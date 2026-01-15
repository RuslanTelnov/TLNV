import os
import time
import sys
import json
import logging
import traceback
from dotenv import load_dotenv
from supabase import create_client, Client

# Import existing modules
sys.path.append(os.path.join(os.getcwd(), 'moysklad-automation'))
sys.path.append(os.path.join(os.getcwd(), 'kaspi-automation'))

import create_wb_products_in_ms as ms_creator
import oprihodovanie as ms_stock
sys.path.append(os.path.dirname(os.path.abspath(__file__))) 
from create_from_wb import create_from_wb

# Setup Logging
log_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'conveyor.log')
logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

load_dotenv()
# Try loading web env if not found
if not os.getenv("MOYSKLAD_LOGIN"):
    load_dotenv("moysklad-web/.env.local")

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL:
    logger.error("Supabase credentials missing")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_preorder_attribute_beta(headers):
    """Find the 'Предзаказ' attribute meta"""
    url = f"{ms_creator.BASE_URL}/entity/product/metadata/attributes"
    try:
        resp = ms_creator.requests.get(url, headers=headers)
        if resp.status_code == 200:
            rows = resp.json().get('rows', [])
            for row in rows:
                if "предзаказ" in row['name'].lower():
                    logger.info(f"Found Preorder attribute: {row['name']} ({row['id']})")
                    return row['meta'], row['id']
    except Exception as e:
        logger.error(f"Error finding preorder attribute: {e}")
    return None, None

def update_status(wb_id, status_dict):
    """Update status in wb_search_results"""
    try:
        # Also log to conveyor_log column
        msg = f"Update: {json.dumps(status_dict)}"
        # Append log if possible? Supabase replace is easier.
        status_dict['conveyor_log'] = msg # Simplification
        
        supabase.table("wb_search_results").update(status_dict).eq("id", wb_id).execute()
    except Exception as e:
        logger.error(f"Failed to update DB status for {wb_id}: {e}")

def run_conveyor():
    logger.info("🚀 Starting Integrated Conveyor...")
    
    # 1. Setup MS Context
    folder_meta = ms_creator.get_or_create_group("Parser WB")
    price_type_meta = ms_creator.get_price_type("Цена продажи")
    preorder_meta, preorder_id = get_preorder_attribute_beta(ms_creator.HEADERS)
    
    extra_attrs = []
    if preorder_meta:
         extra_attrs.append({
            "meta": preorder_meta,
            "value": 30
        })
    else:
        logger.warning("'Предзаказ' attribute not found. Will proceed without it.")

    # Import parser dynamically to avoid circular imports if any
    try:
        from parse_wb_top import parse_and_save
    except ImportError:
        logger.error("Could not import parse_and_save from parse_wb_top")
        parse_and_save = None

    current_page = 1
    max_page = 100

    while True:
        try:

            # -------------------------------------------------------------
            # 1. PROCESS CANDIDATES (Conveyor) - PRIORITY
            # -------------------------------------------------------------
            # Fetch last 50 items to check status
            response = supabase.table("wb_search_results") \
                .select("*") \
                .order("updated_at", desc=True) \
                .limit(50) \
                .execute()
            
            candidates = response.data
            
            active_work = False
            if candidates:
                for product in candidates:
                    wb_id = str(product['id'])
                    name = product['name']
                    
                    # Check current status
                    conveyor_status = product.get('conveyor_status', 'idle')
                    ms_created = product.get('ms_created', False)
                    stock_added = product.get('stock_added', False)
                    kaspi_created = product.get('kaspi_created', False)
                    
                    # If fully done or closed, skip
                    if (ms_created and stock_added and kaspi_created) or product.get('is_closed', False):
                        if conveyor_status != 'done' and not product.get('is_closed', False):
                             update_status(wb_id, {"conveyor_status": "done"})
                        continue
                    
                    active_work = True
                    update_status(wb_id, {"conveyor_status": "processing"})
                    logger.info(f"--- Processing {name} ({wb_id}) ---")

                    # Step A: Create in MS
                    ms_id_created = None
                    if not ms_created:
                        logger.info(f"Creating in MS...")
                        prod_data = {
                            "id": product['id'],
                            "name": product['name'],
                            "price": int(product.get('price_kzt', 0) or 0),
                            "image_url": product.get('image_url')
                        }
                        
                        # Ensure create_product_in_ms returns the ID now
                        result_id, error_msg = ms_creator.create_product_in_ms(prod_data, folder_meta, price_type_meta, extra_attributes=extra_attrs)
                        
                        if result_id:
                            update_status(wb_id, {"ms_created": True})
                            ms_created = True
                            ms_id_created = result_id # Store for immediate stocking
                        else:
                            update_status(wb_id, {"conveyor_status": "error", "conveyor_log": f"MS Creation Failed: {error_msg}"})
                            continue # Retry next loop

                    # Step B: Stocking
                    if ms_created and not stock_added:
                        logger.info(f"Adding Stock...")
                        
                        ms_prod = None
                        if ms_id_created:
                            from create_wb_products_in_ms import BASE_URL, HEADERS, requests
                            try:
                                resp = requests.get(f"{BASE_URL}/entity/product/{ms_id_created}", headers=HEADERS)
                                if resp.status_code == 200:
                                    ms_prod = resp.json()
                            except:
                                pass
                        
                        if not ms_prod:
                             ms_prod = ms_stock.find_product_by_article(wb_id)
                        
                        if ms_prod:
                             price = int(product.get('price_kzt', 0) or 0)
                             res = ms_stock.create_enter(ms_prod['meta'], 10, price)
                             if res.get('success'):
                                 update_status(wb_id, {"stock_added": True})
                                 stock_added = True
                             else:
                                 logger.error(f"Stock error: {res.get('error')}")
                                 update_status(wb_id, {"conveyor_log": f"Stock Error: {res.get('error')}"})
                        else:
                            logger.error("Product not found in MS for stocking")
                            pass

                    # Step C: Kaspi
                    if stock_added and not kaspi_created:
                        logger.info(f"Creating Kaspi Card...")
                        k_success = create_from_wb(wb_id)
                        if k_success:
                            update_status(wb_id, {"kaspi_created": True, "conveyor_status": "done"})
                        else:
                            update_status(wb_id, {"conveyor_log": "Kaspi Creation Failed (check attributes)"})
                    
                    time.sleep(0.05)

            # -------------------------------------------------------------
            # 2. RUN PARSER (Background)
            # -------------------------------------------------------------
            if parse_and_save:
                try:
                    # Parse current page
                    count = parse_and_save("Хиты", limit=100, page=current_page)
                    
                    if count == 0:
                        logger.info("No items found on page, resetting to 1.")
                        current_page = 1
                    else:
                        current_page += 1
                        if current_page > max_page:
                            current_page = 1
                            
                except Exception as e:
                    logger.error(f"Parser failed: {e}")
                    time.sleep(5)

            if not active_work:
                # logger.info("No active work in latest batch. Sleeping...")
                pass
            
            time.sleep(5)
            
        except Exception as e:
            logger.error(f"Loop Error: {e}")
            logger.error(traceback.format_exc())
            time.sleep(10)

if __name__ == "__main__":
    run_conveyor()
