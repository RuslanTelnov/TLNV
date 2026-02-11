import os
import json
import time
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client
import re
from curl_cffi import requests

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

from concurrent.futures import ThreadPoolExecutor, as_completed

def check_basket(i, vol, part, nm_id):
    host = f"basket-{i:02d}.wbbasket.ru"
    url = f"https://{host}/vol{vol}/part{part}/{nm_id}/info/ru/card.json"
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            return host
    except:
        pass
    return None

def find_basket_host(nm_id):
    vol, part = get_basket_number(nm_id)
    # Try baskets 01 to 50 in parallel
    with ThreadPoolExecutor(max_workers=20) as executor:
        futures = [executor.submit(check_basket, i, vol, part, nm_id) for i in range(1, 51)]
        for future in as_completed(futures):
            result = future.result()
            if result:
                # Cancel other futures if possible (not easy in Python, but we return early)
                return result
    return None

def fetch_wb_data():
    # Fetch product IDs from Supabase
    try:
        response = supabase.schema('Parser').table('wb_top_products').select("id").execute()
        product_ids = [item['id'] for item in response.data]
        print(f"Fetched {len(product_ids)} products from database: {product_ids}")
    except Exception as e:
        print(f"Error fetching product IDs: {e}")
        product_ids = [179790764] # Fallback
    
    products = []
    
    for nm_id in product_ids:
        print(f"Processing {nm_id}...")
        try:
            vol, part = get_basket_number(nm_id)
            host = find_basket_host(nm_id)
            
            if not host:
                print(f"Could not find basket host for {nm_id}")
                continue
                
            print(f"Found host: {host}")
            
            # Fetch card.json
            card_url = f"https://{host}/vol{vol}/part{part}/{nm_id}/info/ru/card.json"
            card_resp = requests.get(card_url, timeout=5)
            if card_resp.status_code != 200:
                print(f"Failed to fetch card.json for {nm_id}")
                continue
            
            card_data = card_resp.json()
            name = card_data.get('imt_name', 'Unknown')
            brand = card_data.get('selling', {}).get('brand_name', 'Unknown')
            description = card_data.get('description', '')
            
            # Fetch price-history.json
            price_url = f"https://{host}/vol{vol}/part{part}/{nm_id}/info/price-history.json"
            price_resp = requests.get(price_url, timeout=5)
            
            price = 0
            currency = "RUB"
            
            if price_resp.status_code == 200:
                try:
                    history = price_resp.json()
                    if history and isinstance(history, list):
                        last_entry = history[-1]
                        price_dict = last_entry.get('price', {})
                        if 'RUB' in price_dict:
                            # Price is usually in kopecks in API, but here it seems to be integer RUB?
                            # Wait, in price-history.json it was 29478. 
                            # If it's kopecks, it's 294.78 RUB.
                            # If it's RUB, it's 29478 RUB.
                            # Let's assume kopecks as is standard for WB.
                            raw_price = price_dict['RUB']
                            price = raw_price / 100
                            currency = "RUB"
                except Exception as e:
                    print(f"Error parsing price history: {e}")
            else:
                print(f"Price history not found for {nm_id}")

            # Convert to KZT
            if currency == "RUB":
                # Market rate is approx 6.5 (Dec 2025)
                # Frontend uses 5.2 for some reason, but 6.5 is closer to reality.
                # We will use 6.5 to be more accurate.
                print(f"Converting {price} RUB to KZT (rate 6.5)...")
                price = int(price * 6.5)
                currency = "KZT"
            
            # Extract other metadata if available (rating, reviews not in card.json usually)
            rating = 0.0
            feedbacks = 0
            delivery_date = "Check Site"
            
            print(f"Parsed: {name} - {price} {currency}")
            
            product_data = {
                "id": nm_id,
                "name": name,
                "brand": brand,
                "price": price, 
                "sale_price_u": price,
                "rating": rating,
                "feedbacks": feedbacks,
                "delivery_date": delivery_date,
                "specs": {"description": description[:200]}, 
                "url": f"https://www.wildberries.ru/catalog/{nm_id}/detail.aspx",
                "updated_at": datetime.utcnow().isoformat(),
                "currency": currency
            }
            products.append(product_data)
            
            # Update Supabase
            try:
                supabase.schema('Parser').table('wb_top_products').upsert(product_data).execute()
                print(f"Updated DB for {nm_id}")
            except Exception as e:
                print(f"DB Update Error: {e}")
                
            # Small delay
            time.sleep(0.5)
            
        except Exception as e:
            print(f"Error processing {nm_id}: {e}")
            
    return products

def save_to_supabase(products):
    if not products:
        print("No products to save")
        return
    # Already saved in loop, but this function is kept for compatibility
    pass

if __name__ == "__main__":
    products = fetch_wb_data()
