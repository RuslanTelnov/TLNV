import os
import time
import sys
import json
import logging
import traceback
from dotenv import load_dotenv
from supabase import create_client, Client

# Import existing modules
# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import create_wb_products_in_ms as ms_creator
import oprihodovanie as ms_stock
# Fix import for create_from_wb (it is in ../kaspi)
current_dir = os.path.dirname(os.path.abspath(__file__))
kaspi_dir = os.path.join(os.path.dirname(current_dir), 'kaspi')
sys.path.append(kaspi_dir)

from create_from_wb import create_from_wb
import check_kaspi_status
import generate_fixed_price # Import the XML generator

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

# Robustly find .env.local
try:
    current_dir = os.path.dirname(os.path.abspath(__file__))
    possible_paths = [
        os.path.join(current_dir, "../../../.env.local"), # Back from moysklad/automation/velveto-app
        os.path.join(current_dir, "../../.env.local"),
        os.path.join(os.getcwd(), "temp_tlnv_parser/velveto-app/.env.local"),
        os.path.join(os.getcwd(), ".env.local")
    ]
    for p in possible_paths:
        if os.path.exists(p):
            print(f"✅ Loading env from: {p}")
            load_dotenv(p)
            break
except: pass

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
        
        supabase.schema('Parser').table('wb_search_results').update(status_dict).eq("id", wb_id).execute()
    except Exception as e:
        logger.error(f"Failed to update DB status for {wb_id}: {e}")

def run_conveyor(single_pass=False, skip_parser=False):
    logger.info(f"🚀 Starting Integrated Conveyor (Single Pass: {single_pass}, Skip Parser: {skip_parser})...")
    
    # 1. Setup MS Context
    folder_meta = ms_creator.get_or_create_group("Parser WB")
    price_type_meta = ms_creator.get_price_type("Розничная цена")
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

    if skip_parser:
        parse_and_save = None

    current_page = 1
    max_page = 100

    while True:
        try:
            # -------------------------------------------------------------
            # 0. BATCH CONTROL: Limit moderation queue to 100
            # -------------------------------------------------------------
            try:
                # Count products currently in moderation
                # Note: kaspi_status is stored inside the 'specs' JSONB column
                mod_resp = supabase.schema('Parser').table('wb_search_results') \
                    .select("id", count="exact") \
                    .eq("kaspi_created", True) \
                    .contains("specs", {"kaspi_status": "moderation"}) \
                    .execute()
                
                mod_count = mod_resp.count if hasattr(mod_resp, 'count') else 0
                
                if mod_count >= 500:
                    logger.info(f"⏳ Moderation Queue Full ({mod_count}/500). Triggering status check & waiting...")
                    try:
                        check_kaspi_status.main()
                    except Exception as e:
                        logger.error(f"Failed to run status check: {e}")
                    
                    time.sleep(60) # Wait a minute
                    continue
                elif mod_count > 0:
                    logger.info(f"📊 Moderation Queue: {mod_count}/500. Proceeding with caution.")
            except Exception as e:
                logger.warning(f"Failed to check moderation queue size: {e}")

            # -------------------------------------------------------------
            # 1. PROCESS CANDIDATES (Conveyor) - PRIORITY
            # -------------------------------------------------------------
            # Fetch last 50 items to check status
            response = supabase.schema('Parser').table('wb_search_results') \
                .select("*") \
                .neq("conveyor_status", "done") \
                .order("ms_created", desc=False) \
                .order("updated_at", desc=True) \
                .limit(100) \
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
                    # is_closed might be in 'specs' jsonB column now if checking new parser logic
                    specs = product.get('specs') or {}
                    is_closed_val = product.get('is_closed', False) or specs.get('is_closed', False)
                    k_status = specs.get('kaspi_status', 'none')

                    if (ms_created and stock_added and kaspi_created and k_status == 'created') or is_closed_val:
                        if conveyor_status != 'done' and not is_closed_val:
                             update_status(wb_id, {"conveyor_status": "done"})
                        continue
                    
                    # -------------------------------------------------------------
                    # DATA INTEGRITY / MANUAL REVIEW BLOCK
                    # -------------------------------------------------------------
                    if specs.get('needs_manual_review'):
                        logger.warning(f"⚠️ Skipping {name} ({wb_id}) - Needs Manual Review: {specs.get('integrity_error')}")
                        update_status(wb_id, {"conveyor_status": "manual_review", "conveyor_log": f"Integrity Error: {specs.get('integrity_error')}"})
                        continue

                    # -------------------------------------------------------------
                    # MODERATION FEEDBACK LOOP (Requires Fix Handling)
                    # -------------------------------------------------------------
                    if k_status == 'requires_fix' or k_status == 'rejected':
                        logger.info(f"🛠️ Handling 'Requires Fix/Rejected' for {name} ({wb_id})...")
                        # Reset status to allow re-runs with fresh mapping
                        ms_created = False 
                        kaspi_created = False
                        
                        # Cleanup specs for fresh start
                        specs['kaspi_status'] = 'pending'
                        specs.pop('kaspi_attributes', None)
                        specs.pop('kaspi_category', None)
                        specs.pop('kaspi_upload_id', None)
                        
                        update_status(wb_id, {
                            "kaspi_created": False, 
                            "ms_created": False, 
                            "conveyor_status": "processing",
                            "specs": specs
                        })
                        logger.info(f"♻️ Reset status for {wb_id} to trigger re-submission.")

                    active_work = True
                    update_status(wb_id, {"conveyor_status": "processing"})
                    logger.info(f"--- Processing {name} ({wb_id}) ---")

                    # Step A: Create/Update in MS
                    if not ms_created:
                        logger.info(f"Ensuring Product in MS (Update Enabled)...")
                        # Extract all images
                        image_urls = specs.get('image_urls', [])
                        if not image_urls and product.get('image_url'):
                            image_urls = [product.get('image_url')]

                        prod_data = {
                            "id": product['id'],
                            "name": product['name'],
                            "price": int(product.get('price_kzt', 0) or 0),
                            "image_urls": image_urls,
                            "image_url": product.get('image_url')
                        }
                        
                        # Ensure create_product_in_ms returns the ID 
                        # This will update nomenclature (category/description/attributes)
                        result_id, error_msg = ms_creator.create_product_in_ms(
                            prod_data, 
                            folder_meta, 
                            price_type_meta, 
                            extra_attributes=extra_attrs, 
                            update_existing=True,
                            kaspi_attributes=specs # Use specs for attributes
                        )
                        
                        if result_id:
                            update_status(wb_id, {"ms_created": True})
                            ms_created = True
                            ms_id_created = result_id 
                        else:
                            update_status(wb_id, {"conveyor_status": "error", "conveyor_log": f"MS Creation Failed: {error_msg}"})
                            continue

                    # Step B: Stocking
                    if ms_created and not stock_added:
                        logger.info(f"Checking Stock Availability on target warehouse...")
                        
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
                             # Get warehouse meta to get its ID
                             target_warehouse_name = "Склад ВБ"
                             store_meta = ms_stock.get_store_meta(target_warehouse_name)
                             store_id = None
                             if store_meta:
                                 store_id = store_meta['href'].split('/')[-1]

                             # CHECK: Warehouse-specific stock (What Kaspi sees)
                             current_stock_wh = ms_stock.get_product_stock(ms_prod['id'], store_id=store_id)
                             
                             # CHECK: Global stock (Safety check to avoid adding stock if we have it elsewhere)
                             # We use the report but look at the global total
                             global_stock = ms_stock.get_product_stock(ms_prod['id'])
                             
                             # CHECK: Warehouse-specific stock (What Kaspi sees currently)
                             current_stock_wh = ms_stock.get_product_stock(ms_prod['id'], store_id=store_id)

                             # Update specs['stock'] with WAREHOUSE stock (Isolation)
                             try:
                                 # Fetch current specs
                                 current_data = supabase.schema('Parser').table('wb_search_results').select("specs").eq("id", int(wb_id)).execute()
                                 specs = {}
                                 if current_data.data and current_data.data[0].get("specs"):
                                     specs = current_data.data[0]["specs"]
                                 
                                 specs['stock'] = current_stock_wh
                                 specs['warehouse_name'] = target_warehouse_name
                                 specs['global_stock'] = global_stock
                                 supabase.schema('Parser').table('wb_search_results').update({"specs": specs}).eq("id", int(wb_id)).execute()
                             except Exception as db_err:
                                 logger.warning(f"Failed to update stock spec for {wb_id}: {db_err}")

                             if global_stock > 0:
                                 logger.info(f"Product {wb_id} has stock globally ({global_stock}). Isolation: Skipping stocking for '{target_warehouse_name}'.")
                                 update_status(wb_id, {"stock_added": True, "conveyor_log": f"Globally exists: {global_stock}. Warehouse '{target_warehouse_name}' has: {current_stock_wh}"})
                                 stock_added = True
                             else:
                                 logger.info(f"Adding Placeholder Stock (10) to '{target_warehouse_name}' (Global stock is 0)...")
                                 price = int(product.get('price_kzt', 0) or 0)
                                 # We only enter stock if it's truly missing everywhere
                                 res = ms_stock.create_enter(ms_prod['meta'], 10, price)
                                 if res.get('success'):
                                     update_status(wb_id, {"stock_added": True})
                                     stock_added = True
                                     # Update spec again to reflect added stock
                                     try:
                                         specs['stock'] = 10 
                                         supabase.schema('Parser').table('wb_search_results').update({"specs": specs}).eq("id", int(wb_id)).execute()
                                     except: pass
                                 else:
                                     logger.error(f"Stock error: {res.get('error')}")
                                     update_status(wb_id, {"conveyor_log": f"Stock Error: {res.get('error')}"})
                        else:
                            logger.error("Product not found in MS for stocking")
                            pass

                    # Step C: Kaspi
                    if (stock_added or product.get('stock_added')) and not kaspi_created:
                        logger.info(f"Creating Kaspi Card for Article: {wb_id}...")
                        k_success = create_from_wb(wb_id)
                        
                        if k_success:
                             # 1. Resolve MS Code for Publishing (Must match Kaspi SKU)
                             ms_code = None
                             try:
                                 # Refetch specs from DB (create_from_wb stores kaspi_sku there)
                                 refetch = supabase.schema('Parser').table('wb_search_results').select("specs").eq("id", int(wb_id)).execute()
                                 if refetch.data:
                                     ms_code = refetch.data[0].get('specs', {}).get('kaspi_sku')
                             except: pass
                             
                             if not ms_code:
                                 # Fallback: check products table for code
                                 try:
                                     res_p = supabase.schema('Parser').table('products').select("code").eq("article", wb_id).execute()
                                     if res_p.data:
                                         ms_code = res_p.data[0].get('code')
                                 except: pass
                             
                             if ms_code:
                                 # 2. Direct Push to Kaspi Merchant API
                                 try:
                                     from publish_offer import publish_offer
                                     logger.info(f"Publishing Offer via API. SKU: {ms_code}")
                                     price_val = int(product.get('price_kzt', 0) or 0)
                                     if price_val > 0:
                                          retail_price = int(price_val / 0.3)
                                          publish_offer(ms_code, price=retail_price, stock=10, preorder=True)
                                 except Exception as po_err:
                                     logger.warning(f"Failed to push offer directly: {po_err}")
                             else:
                                 logger.warning(f"Could not find MS Code for publishing offer {wb_id}. Card created but offer pending XML sync.")
                             
                             update_status(wb_id, {"kaspi_created": True, "conveyor_status": "done"})
                        else:
                             update_status(wb_id, {"conveyor_log": "Kaspi Creation Failed (check attributes)"})
                    
                        if k_success:
                            # If at least one Kaspi card was created, regenerate the XML feed immediately
                            try:
                                logger.info("Regenerating XML Feed...")
                                generate_fixed_price.generate_xml()
                            except Exception as e:
                                logger.error(f"Failed to regenerate XML: {e}")

                    
                    time.sleep(0.05)

            # -------------------------------------------------------------
            # 2. RUN PARSER (Background)
            # -------------------------------------------------------------
            if parse_and_save:
                try:
                    # Check for queued jobs first
                    job = job_response.data[0] if job_response.data else None
                    
                    if job:
                        logger.info(f"🚀 Processing Queue Job: {job['query']} (Mode: {job['mode']}, Page: {job['page']})")
                        supabase.schema('Parser').table('parser_queue').update({"status": "processing"}).eq("id", job['id']).execute()
                        
                        try:
                            # Run the parser for this job
                            parse_and_save(job['query'], limit=100, page=job['page'])
                            supabase.schema('Parser').table('parser_queue').update({"status": "done"}).eq("id", job['id']).execute()
                        except Exception as e:
                            logger.error(f"Job failed: {e}")
                            supabase.schema('Parser').table('parser_queue').update({"status": "error", "log": str(e)}).eq("id", job['id']).execute()
                            
                    else:
                        # --- AUTOPILOT MODE (Expanded Keyword Rotation) ---
                        try:
                            from discovery_keywords import KEYWORDS
                        except ImportError:
                            KEYWORDS = ["Хиты", "Игрушки", "Новинки"]
                        
                        # Use a persistent index if possible, otherwise just cycle
                        if not hasattr(run_conveyor, 'kw_index'):
                            run_conveyor.kw_index = 0
                        
                        target_kw = KEYWORDS[run_conveyor.kw_index % len(KEYWORDS)]
                        logger.info(f"Autopilot: Scanning category '{target_kw}' (Page {current_page})...")
                        
                        # Note: parse_and_save now uses sort=popular internally
                        count = parse_and_save(target_kw, limit=100, page=current_page)
                        
                        # Rotate categories after some depth
                        if count == 0 or current_page >= 3: # 3 pages per category is enough for variety
                            logger.info(f"Finished category '{target_kw}'. Moving to next.")
                            current_page = 1
                            run_conveyor.kw_index += 1
                        else:
                            current_page += 1
                            
                except Exception as e:
                    logger.error(f"Parser failed: {e}")
                    time.sleep(20) # Back off on error

            if not active_work:
                # logger.info("No active work in latest batch. Sleeping...")
                pass
            
            if single_pass:
                logger.info("Single pass complete.")
                break

            time.sleep(5)
            
        except Exception as e:
            logger.error(f"Loop Error: {e}")
            logger.error(traceback.format_exc())
            time.sleep(10)

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--once", action="store_true", help="Run only one pass")
    parser.add_argument("--skip-parser", action="store_true", help="Skip parsing step")
    args = parser.parse_args()
    
    run_conveyor(single_pass=args.once, skip_parser=args.skip_parser)
