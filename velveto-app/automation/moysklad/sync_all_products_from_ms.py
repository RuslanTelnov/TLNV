import os
import requests
import base64
import json
from dotenv import load_dotenv
from supabase import create_client, Client

# Load env from moysklad-web
load_dotenv(os.path.join(os.getcwd(), "moysklad-web", ".env.local"))
# Also load local .env for MS credentials if they are there
load_dotenv(os.path.join(os.getcwd(), ".env"))

# Supabase settings
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL") # Next.js uses this prefix
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL:
    SUPABASE_URL = os.getenv("SUPABASE_URL")
if not SUPABASE_KEY:
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Supabase credentials missing")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# MoySklad settings
LOGIN = os.getenv("MOYSKLAD_LOGIN")
PASSWORD = os.getenv("MOYSKLAD_PASSWORD")
BASE_URL = "https://api.moysklad.ru/api/remap/1.2"

if not LOGIN or not PASSWORD:
    print("❌ MoySklad credentials missing")
    exit(1)

auth_str = f"{LOGIN}:{PASSWORD}"
auth_b64 = base64.b64encode(auth_str.encode()).decode()
HEADERS = {
    "Authorization": f"Basic {auth_b64}",
    "Content-Type": "application/json"
}

def fetch_all_products():
    print("📦 Fetching ALL products from MoySklad...")
    products = []
    offset = 0
    limit = 100
    
    while True:
        url = f"{BASE_URL}/entity/product?limit={limit}&offset={offset}"
        try:
            resp = requests.get(url, headers=HEADERS)
            if resp.status_code != 200:
                print(f"❌ Error fetching products: {resp.status_code} - {resp.text}")
                break
                
            data = resp.json()
            rows = data.get('rows', [])
            products.extend(rows)
            
            print(f"   Fetched {len(rows)} items (Total: {len(products)})")
            
            if len(rows) < limit:
                break
                
            offset += limit
        except Exception as e:
            print(f"❌ Exception fetching products: {e}")
            break
            
    return products

def get_stock(product_id):
    # This is expensive to call for every product individually. 
    # Better to fetch all stocks in batch if possible, or just skip for now and rely on sync_stock.py
    # For now, let's just set stock to 0 if new, and rely on sync_stock.py for accurate stock.
    return 0

def sync_products():
    ms_products = fetch_all_products()
    print(f"✅ Fetched {len(ms_products)} products from MoySklad.")
    
    count = 0
    errors = 0
    
    for p in ms_products:
        try:
            ms_id = p['id']
            name = p['name']
            article = p.get('article')
            code = p.get('code')
            
            if not article:
                # print(f"⚠️ Skipping {name}: No article")
                continue
                
            # Prices
            min_price = 0
            if 'minPrice' in p:
                min_price = p['minPrice'].get('value', 0)
                
            cost_price = 0
            if 'buyPrice' in p:
                cost_price = p['buyPrice'].get('value', 0)
                
            sale_price = 0
            if 'salePrices' in p and len(p['salePrices']) > 0:
                sale_price = p['salePrices'][0].get('value', 0)
                
            # Prepare DB data
            db_data = {
                "moysklad_id": ms_id,
                "name": name,
                "article": article,
                "code": code,
                "price": sale_price,
                "min_price": min_price,
                "cost_price": cost_price,
                # "stock": 0 # Don't overwrite stock if it exists, or set to 0 if new? 
                # Better to upsert without stock, or let sync_stock handle it.
                # If we don't include stock, it defaults to null or 0?
            }
            
            # Upsert
            # We use article as unique key if possible, or moysklad_id?
            # The schema likely has article as unique or primary key logic.
            # Let's try upserting by article.
            
            # Check if exists to decide on stock?
            # Just upserting fields we know.
            
            supabase.schema('Parser').table('products').upsert(db_data, on_conflict="article").execute()
            count += 1
            if count % 50 == 0:
                print(f"   Processed {count} products...")
                
        except Exception as e:
            print(f"❌ Error syncing {p.get('name')}: {e}")
            errors += 1
            
    print(f"🏁 Sync complete. Processed {count} products. Errors: {errors}")

if __name__ == "__main__":
    sync_products()
