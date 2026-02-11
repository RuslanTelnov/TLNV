import os
import requests
import base64
import json
from dotenv import load_dotenv
from supabase import create_client, Client

# Load env from moysklad-web
load_dotenv(os.path.join(os.getcwd(), "..", "moysklad-web", ".env.local"))
# Also load local .env for MS credentials if they are there
load_dotenv(os.path.join(os.getcwd(), ".env"))

# Supabase settings
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
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

def fetch_warehouses():
    print("📦 Fetching Warehouses from MoySklad...")
    url = f"{BASE_URL}/entity/store"
    try:
        resp = requests.get(url, headers=HEADERS)
        if resp.status_code != 200:
            print(f"❌ Error fetching warehouses: {resp.status_code} - {resp.text}")
            return []
        
        rows = resp.json().get('rows', [])
        warehouses = []
        for row in rows:
            warehouses.append({
                "moysklad_id": row['id'],
                "name": row['name']
            })
        return warehouses
    except Exception as e:
        print(f"❌ Exception fetching warehouses: {e}")
        return []

def sync_warehouses(warehouses):
    print(f"🔄 Syncing {len(warehouses)} warehouses to DB...")
    for w in warehouses:
        try:
            data = {
                "moysklad_id": w['moysklad_id'],
                "name": w['name']
            }
            # Upsert warehouse
            res = supabase.schema('Parser').table('warehouses').upsert(data, on_conflict="moysklad_id").execute()
            # print(f"   Saved {w['name']}")
        except Exception as e:
            print(f"❌ Error saving warehouse {w['name']}: {e}")

def get_db_warehouse_map():
    # Helper to map MS ID to DB UUID
    res = supabase.schema('Parser').table('warehouses').select("id, moysklad_id").execute()
    mapping = {}
    for w in res.data:
        mapping[w['moysklad_id']] = w['id']
    return mapping

def get_db_product_map():
    # Helper to map MS ID/Article to DB UUID
    # We might need to fetch by article if ms_id is missing or inconsistent
    # But for stocks, we usually key by product MS ID if available. 
    # Let's map Article -> UUID since our main sync keys by Article.
    
    # Warning: fetching all products might be heavy. 
    # START PAGINATION
    print("📥 Loading product map (Article -> UUID)...")
    mapping = {}
    offset = 0
    limit = 1000
    while True:
        res = supabase.schema('Parser').table('products').select("id, article, moysklad_id").range(offset, offset+limit-1).execute()
        if not res.data:
            break
        for p in res.data:
            if p.get('article'):
                mapping[str(p['article'])] = p['id']
            # Also map by moysklad_id if useful?
            # mapping[p['moysklad_id']] = p['id'] 
        
        if len(res.data) < limit:
            break
        offset += limit
    
    print(f"   Loaded {len(mapping)} products.")
    return mapping

def fetch_stock_for_warehouse(warehouse_ms_id):
    # Fetch assortment filtered by store
    url = f"{BASE_URL}/entity/assortment"
    params = {
        "store": f"https://api.moysklad.ru/api/remap/1.2/entity/store/{warehouse_ms_id}",
        "limit": 1000,
        "scope": "product_variant" # Try to limit scope if possible, or filter later
    }
    
    stock_map = {} # article -> stock_value
    
    offset = 0
    while True:
        params["offset"] = offset
        # print(f"   Fetching batch offset {offset}...")
        
        try:
            resp = requests.get(url, headers=HEADERS, params=params)
            if resp.status_code != 200:
                print(f"❌ Error fetching stock: {resp.text}")
                break
                
            data = resp.json()
            rows = data.get('rows', [])
            if not rows:
                break
                
            for item in rows:
                # We assume we sync products. 
                # Stock is 'stock' field.
                stock = int(item.get('stock', 0))
                article = item.get('article')
                
                if article:
                    stock_map[str(article)] = stock
            
            if len(rows) < 1000:
                break
            offset += 1000
            
        except Exception as e:
            print(f"❌ Exception fetching stock batch: {e}")
            break
            
    return stock_map

def sync_all():
    # 1. Sync Warehouses
    ms_warehouses = fetch_warehouses()
    sync_warehouses(ms_warehouses)
    
    # 2. Get Maps
    wh_map = get_db_warehouse_map() # MS_ID -> UUID
    prod_map_by_article = get_db_product_map() # Article -> UUID
    
    # 3. Iterate Warehouses and Sync Stock
    for w in ms_warehouses:
        ms_id = w['moysklad_id']
        name = w['name']
        db_wh_id = wh_map.get(ms_id)
        
        if not db_wh_id:
            print(f"⚠️ specific warehouse {name} not found in DB mapping, skipping.")
            continue
            
        print(f"🏭 Processing {name}...")
        stock_data = fetch_stock_for_warehouse(ms_id)
        print(f"   Found {len(stock_data)} items with potential stock info.")
        
        # Prepare batch upserts
        upsert_list = []
        
        for article, stock_qty in stock_data.items():
            prod_id = prod_map_by_article.get(article)
            if not prod_id:
                # Product might not be synced yet or no article match
                continue
                
            # If stock is 0, we still might want to record it? Or save space?
            # Let's save it if it exists in response.
            
            upsert_list.append({
                "product_id": prod_id,
                "warehouse_id": db_wh_id,
                "stock": stock_qty
            })
            
            if len(upsert_list) >= 1000:
                # Flush
                try:
                    supabase.schema('Parser').table('product_stocks').upsert(upsert_list, on_conflict="product_id,warehouse_id").execute()
                    # print(f"   Flushed {len(upsert_list)} stocks.")
                    upsert_list = []
                except Exception as e:
                    print(f"❌ Error flushing stocks for {name}: {e}")
                    upsert_list = [] # clear to proceed?

        # Final flush
        if upsert_list:
            try:
                supabase.schema('Parser').table('product_stocks').upsert(upsert_list, on_conflict="product_id,warehouse_id").execute()
                print(f"   ✅ Updated stocks for {len(upsert_list)} items (final batch).")
            except Exception as e:
                print(f"❌ Error flushing final stocks for {name}: {e}")

    # 4. Aggregation?
    # We could calculate total stock for each product and update 'products.stock'
    # But maybe better to just let the UI calculate or do it in a separate pass.
    # For now, let's leave 'products.stock' as is (synced from general list) 
    # or update it if inaccurate. 
    # The general list usually sums all warehouses?
    
    print("🏁 Warehouse Sync Complete.")

if __name__ == "__main__":
    sync_all()
