import os
import json
import time
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL or SUPABASE_KEY not found")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_basket_number(nm_id):
    vol = nm_id // 100000
    part = nm_id // 1000
    return vol, part

def get_basket_host(vol):
    if 0 <= vol <= 143: return "basket-01.wbbasket.ru"
    if 144 <= vol <= 287: return "basket-02.wbbasket.ru"
    if 288 <= vol <= 431: return "basket-03.wbbasket.ru"
    if 432 <= vol <= 719: return "basket-04.wbbasket.ru"
    if 720 <= vol <= 1007: return "basket-05.wbbasket.ru"
    if 1008 <= vol <= 1061: return "basket-06.wbbasket.ru"
    if 1062 <= vol <= 1115: return "basket-07.wbbasket.ru"
    if 1116 <= vol <= 1169: return "basket-08.wbbasket.ru"
    if 1170 <= vol <= 1313: return "basket-09.wbbasket.ru"
    if 1314 <= vol <= 1601: return "basket-10.wbbasket.ru"
    if 1602 <= vol <= 1655: return "basket-11.wbbasket.ru"
    if 1656 <= vol <= 1919: return "basket-12.wbbasket.ru"
    if 1920 <= vol <= 2045: return "basket-13.wbbasket.ru"
    if 2046 <= vol <= 2189: return "basket-14.wbbasket.ru"
    if 2190 <= vol <= 2405: return "basket-15.wbbasket.ru"
    if 2406 <= vol <= 2621: return "basket-16.wbbasket.ru"
    if 2622 <= vol <= 2837: return "basket-17.wbbasket.ru"
    if 2838 <= vol <= 3053: return "basket-18.wbbasket.ru"
    if 3054 <= vol <= 3269: return "basket-19.wbbasket.ru"
    if 3270 <= vol <= 3485: return "basket-20.wbbasket.ru"
    if 3486 <= vol <= 3701: return "basket-21.wbbasket.ru"
    if 3702 <= vol <= 3917: return "basket-22.wbbasket.ru"
    if 3918 <= vol <= 4133: return "basket-23.wbbasket.ru"
    if 4134 <= vol <= 4349: return "basket-24.wbbasket.ru"
    if 4350 <= vol <= 4565: return "basket-25.wbbasket.ru"
    if 4566 <= vol <= 4781: return "basket-26.wbbasket.ru"
    if 4782 <= vol <= 4997: return "basket-27.wbbasket.ru"
    if 4998 <= vol <= 5213: return "basket-28.wbbasket.ru"
    if 5214 <= vol <= 5429: return "basket-29.wbbasket.ru"
    if 5430 <= vol <= 5645: return "basket-30.wbbasket.ru"
    if 5646 <= vol <= 5861: return "basket-31.wbbasket.ru"
    if 5862 <= vol <= 6077: return "basket-32.wbbasket.ru"
    if 6078 <= vol <= 6293: return "basket-33.wbbasket.ru"
    if 6294 <= vol <= 6509: return "basket-34.wbbasket.ru"
    if 6510 <= vol <= 6725: return "basket-35.wbbasket.ru"
    if 6726 <= vol <= 6941: return "basket-36.wbbasket.ru"
    if 6942 <= vol <= 7157: return "basket-37.wbbasket.ru"
    if 7158 <= vol <= 7373: return "basket-38.wbbasket.ru"
    if 7374 <= vol <= 7589: return "basket-39.wbbasket.ru"
    if 7590 <= vol <= 7805: return "basket-40.wbbasket.ru"
    if 7806 <= vol <= 8021: return "basket-41.wbbasket.ru"
    if 8022 <= vol <= 8237: return "basket-42.wbbasket.ru"
    
    # Fallback for newer/unknown volumes
    return "basket-43.wbbasket.ru"

def process_product(nm_id):
    try:
        vol, part = get_basket_number(nm_id)
        host = get_basket_host(vol)
        
        # Fetch card.json
        card_url = f"https://{host}/vol{vol}/part{part}/{nm_id}/info/ru/card.json"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        
        # Short timeout because we expect the host to be correct
        card_resp = requests.get(card_url, timeout=3, headers=headers)
        
        if card_resp.status_code != 200:
            # If smart resolution failed, maybe try a fallback or just log it
            # print(f"Failed to fetch card for {nm_id} on {host}")
            return None
            
        card_data = card_resp.json()
        name = card_data.get('imt_name', 'Unknown')
        brand = card_data.get('selling', {}).get('brand_name', 'Unknown')
        
        # Fetch price-history.json for price
        price_url = f"https://{host}/vol{vol}/part{part}/{nm_id}/info/price-history.json"
        price_resp = requests.get(price_url, timeout=3, headers=headers)
        
        price_kzt = 0
        
        if price_resp.status_code == 200:
            try:
                history = price_resp.json()
                if history and isinstance(history, list):
                    last_entry = history[-1]
                    price_dict = last_entry.get('price', {})
                    if 'RUB' in price_dict:
                        # Price in kopecks usually
                        raw_price_rub = price_dict['RUB'] / 100
                        # Convert to KZT (approx rate 5.6 as per parse_wb_top.py)
                        price_kzt = int(raw_price_rub * 5.6)
            except:
                pass
        
        # Prepare update data
        update_data = {
            "id": nm_id, # Required for upsert
            "name": name,
            "brand": brand,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        if price_kzt > 0:
            update_data["price_kzt"] = price_kzt
            
        return update_data

    except Exception as e:
        print(f"Error processing {nm_id}: {e}")
        return None

def update_products():
    print("Fetching products from wb_search_results...")
    try:
        # Fetch all IDs from wb_search_results
        response = supabase.schema('Parser').table('wb_search_results').select("id").execute()
        product_ids = [item['id'] for item in response.data]
        print(f"Found {len(product_ids)} products to update.")
    except Exception as e:
        print(f"Error fetching product IDs: {e}")
        return

    updates = []
    processed_count = 0
    
    # Process products in parallel
    # Increased workers to 20 since requests are now direct and fast
    with ThreadPoolExecutor(max_workers=20) as executor:
        future_to_id = {executor.submit(process_product, nm_id): nm_id for nm_id in product_ids}
        
        for future in as_completed(future_to_id):
            nm_id = future_to_id[future]
            processed_count += 1
            try:
                result = future.result()
                if result:
                    updates.append(result)
                    print(f"[{processed_count}/{len(product_ids)}] Processed {nm_id}: {result.get('name')}")
                else:
                    print(f"[{processed_count}/{len(product_ids)}] Failed to process {nm_id}")
            except Exception as e:
                print(f"[{processed_count}/{len(product_ids)}] Exception for {nm_id}: {e}")

    # Batch update to Supabase
    if updates:
        print(f"Pushing {len(updates)} updates to Supabase...")
        try:
            # Upsert in chunks of 100 to avoid payload limits
            chunk_size = 100
            for i in range(0, len(updates), chunk_size):
                chunk = updates[i:i + chunk_size]
                supabase.schema('Parser').table('wb_search_results').upsert(chunk).execute()
                print(f"Upserted chunk {i//chunk_size + 1}")
            print("All updates completed successfully.")
        except Exception as e:
            print(f"Error pushing updates to Supabase: {e}")
    else:
        print("No updates to push.")

if __name__ == "__main__":
    start_time = time.time()
    update_products()
    print(f"Total time: {time.time() - start_time:.2f} seconds")
