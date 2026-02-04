import os
import requests
import json
from dotenv import load_dotenv
import base64

# Setup paths
script_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.abspath(os.path.join(script_dir, "../../../../.env"))
load_dotenv(env_path)

ozon_env_path = os.path.join(script_dir, ".env.ozon")
if os.path.exists(ozon_env_path):
    load_dotenv(ozon_env_path)

# Credentials
MS_LOGIN = os.getenv("MOYSKLAD_LOGIN")
MS_PASSWORD = os.getenv("MOYSKLAD_PASSWORD")
OZON_CLIENT_ID = os.getenv('OZON_CLIENT_ID')
OZON_API_KEY = os.getenv('OZON_API_KEY')

# Headers
auth_str = f"{MS_LOGIN}:{MS_PASSWORD}"
encoded_auth = base64.b64encode(auth_str.encode()).decode()
MS_HEADERS = {"Authorization": f"Basic {encoded_auth}"}

OZON_HEADERS = {
    'Client-Id': OZON_CLIENT_ID,
    'Api-Key': OZON_API_KEY,
    'Content-Type': 'application/json'
}

def get_ms_stock():
    """Fetch stock for all products from MoySklad"""
    print("📦 Fetching stock from MoySklad...")
    url = "https://api.moysklad.ru/api/remap/1.2/report/stock/all"
    # We need to map product code/article to quantity
    stock_map = {}
    
    offset = 0
    limit = 1000
    
    while True:
        params = {"limit": limit, "offset": offset}
        resp = requests.get(url, headers=MS_HEADERS, params=params)
        if resp.status_code != 200:
            print(f"❌ Error fetching stock: {resp.status_code}")
            break
            
        rows = resp.json().get('rows', [])
        if not rows:
            break
            
        for row in rows:
            article = row.get('article')
            quantity = int(row.get('stock', 0))
            if article:
                stock_map[str(article)] = quantity
                
        offset += limit
        if len(rows) < limit:
            break
            
    print(f"✅ Loaded stock for {len(stock_map)} products.")
    return stock_map

def update_ozon_stocks(stock_map):
    """Update Ozon stocks based on MS stock map"""
    print("🚀 Updating Ozon stocks...")
    url = "https://api-seller.ozon.ru/v2/products/stocks"
    
    # We need to send updates in batches (max 100)
    stocks_payload = []
    
    # We don't know exactly which products exist on Ozon, 
    # but we can try updating everything we have an "offer_id" for.
    # In our convention, offer_id = article + "_ozon"
    
    for article, param_qty in stock_map.items():
        qty = max(0, param_qty) # Ensure non-negative
        
        # We assume our convention: offer_id in Ozon is usually associated with the article.
        # However, create_ozon_by_article uses offer_id = f"{article}_ozon"
        offer_id = f"{article}_ozon"
        
        stocks_payload.append({
            "offer_id": offer_id,
            "stock": qty,
            "warehouse_id": 1020000306488000 # WARNING: This needs to be dynamic or configured!
            # If warehouse_id is not provided, Ozon might complain or update default.
            # Usually strict warehouse_id is required for FBS.
        })

    # Ozon requires Warehouse ID.
    # We should fetch available warehouses first.
    wh_id = get_ozon_warehouse_id()
    if not wh_id:
        print("❌ Could not determine Ozon Warehouse ID. Aborting.")
        return

    # Update payload with correct warehouse ID
    final_payload = []
    for item in stocks_payload:
        item['warehouse_id'] = wh_id
        final_payload.append(item)
        
    # Send in batches of 100
    batch_size = 100
    for i in range(0, len(final_payload), batch_size):
        batch = final_payload[i:i+batch_size]
        payload = {"stocks": batch}
        
        try:
            resp = requests.post(url, headers=OZON_HEADERS, json=payload)
            if resp.status_code == 200:
                errors = resp.json().get('result', [])
                if errors:
                    # Ozon returns list of errors for specific items
                    # But if success, result might be struct with error info
                    pass
                print(f"✅ Updated batch {i}-{i+len(batch)}")
            else:
                print(f"❌ Batch error: {resp.text}")
        except Exception as e:
            print(f"❌ Exception: {e}")

def get_ozon_warehouse_id():
    url = "https://api-seller.ozon.ru/v1/warehouse/list"
    resp = requests.post(url, headers=OZON_HEADERS, json={})
    if resp.status_code == 200:
        rows = resp.json().get('result', [])
        if rows:
            print(f"🏭 Using Warehouse: {rows[0]['name']} (ID: {rows[0]['warehouse_id']})")
            return rows[0]['warehouse_id']
    print("❌ No Ozon warehouse found.")
    return None

if __name__ == "__main__":
    stock_map = get_ms_stock()
    if stock_map:
        update_ozon_stocks(stock_map)
