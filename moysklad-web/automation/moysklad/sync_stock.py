import os
import requests
import base64
import json
from dotenv import load_dotenv
from supabase import create_client

load_dotenv("moysklad-web/.env.local")

# Supabase
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: Missing credentials in moysklad-web/.env.local")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# MoySklad
LOGIN = os.getenv("MOYSKLAD_LOGIN")
PASSWORD = os.getenv("MOYSKLAD_PASSWORD")
BASE_URL = "https://api.moysklad.ru/api/remap/1.2"
MAIN_WAREHOUSE_ID = "de940fd4-23f4-11ef-0a80-0eb00010b17c"

auth_str = f"{LOGIN}:{PASSWORD}"
auth_b64 = base64.b64encode(auth_str.encode()).decode()
HEADERS = {
    "Authorization": f"Basic {auth_b64}",
    "Content-Type": "application/json"
}

def sync_stock():
    print("🚀 Starting stock sync for Main Warehouse...")
    
    # Fetch assortment with stock info
    # We filter by store to get stock for specific warehouse
    url = f"{BASE_URL}/entity/assortment"
    params = {
        "store": f"https://api.moysklad.ru/api/remap/1.2/entity/store/{MAIN_WAREHOUSE_ID}",
        "limit": 1000,
        # "stockMode": "positiveOnly" # Get only items with stock > 0
    }
    
    offset = 0
    total_updated = 0
    
    while True:
        params["offset"] = offset
        print(f"📥 Fetching batch offset {offset}...")
        
        resp = requests.get(url, headers=HEADERS, params=params)
        if resp.status_code != 200:
            print(f"❌ Error fetching assortment: {resp.text}")
            break
            
        data = resp.json()
        rows = data.get('rows', [])
        if not rows:
            break
            
        for item in rows:
            # We only care about products (not bundles/services if possible, but assortment returns all)
            # Check if it is a product or variant
            meta = item.get('meta', {})
            type_ = meta.get('type')
            
            if type_ not in ['product', 'variant']:
                continue
                
            ms_id = item.get('id')
            stock = int(item.get('stock', 0))
            name = item.get('name')
            article = item.get('article') # Might be missing
            
            # Extract price
            price = 0
            sale_prices = item.get('salePrices', [])
            if sale_prices:
                price = int(sale_prices[0].get('value', 0))

            # Prepare data for upsert
            product_data = {
                "moysklad_id": ms_id,
                "name": name,
                "article": article,
                "stock": stock,
                "price": price,
                # "cost_price": ... (might need buyPrice or separate fetch, skip for now or use 0)
                # "supplier": ... (skip for now)
            }
            
            try:
                # Upsert by article (which is unique in DB)
                res = supabase.schema('Parser').table('products').upsert(product_data, on_conflict="article").execute()
                
                if len(res.data) > 0:
                    print(f"   ✅ Upserted {name}: stock={stock}")
                    total_updated += 1
            except Exception as e:
                print(f"   ⚠️ Error upserting {name}: {e}")
        
        offset += 1000
        if offset >= data.get('meta', {}).get('size', 0):
            break
            
    print(f"🏁 Sync complete. Updated {total_updated} products.")

if __name__ == "__main__":
    sync_stock()
