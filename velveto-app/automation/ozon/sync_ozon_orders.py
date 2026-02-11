import os
import json
import requests
import time
from datetime import datetime, timedelta
from dotenv import load_dotenv
import base64

# Load Ozon Env
script_dir = os.path.dirname(os.path.abspath(__file__))
ozon_env_path = os.path.join(script_dir, ".env.ozon")
load_dotenv(ozon_env_path)

OZON_CLIENT_ID = os.getenv('OZON_CLIENT_ID')
OZON_API_KEY = os.getenv('OZON_API_KEY')

# Load MoySklad Env (from parent/moysklad-automation)
# Load MoySklad Env (from root moysklad-automation)
# Path: .../moysklad-automation/temp_tlnv_parser/moysklad-web/automation/ozon/sync_ozon_orders.py
# Env:  .../moysklad-automation/.env
# Need to go up 4 levels
ms_env_path = os.path.join(script_dir, "..", "..", "..", "..", ".env")
ms_env_path = os.path.abspath(ms_env_path)
load_dotenv(ms_env_path)

MOYSKLAD_LOGIN = os.getenv('MOYSKLAD_LOGIN')
MOYSKLAD_PASSWORD = os.getenv('MOYSKLAD_PASSWORD')

# Cache File
CACHE_FILE = os.path.join(script_dir, "synced_orders.json")

def load_cache():
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, "r") as f:
            return json.load(f)
    return {"synced_ids": []}

def save_cache(cache):
    with open(CACHE_FILE, "w") as f:
        json.dump(cache, f, indent=2)

def get_ms_auth_header():
    auth_str = f"{MOYSKLAD_LOGIN}:{MOYSKLAD_PASSWORD}"
    encoded_auth = base64.b64encode(auth_str.encode()).decode()
    return {"Authorization": f"Basic {encoded_auth}"}

def get_ozon_orders():
    url = "https://api-seller.ozon.ru/v3/posting/fbs/list"
    headers = {
        'Client-Id': OZON_CLIENT_ID,
        'Api-Key': OZON_API_KEY,
        'Content-Type': 'application/json'
    }
    
    # Fetch orders from last 24 hours
    # Fetch orders from last 7 days
    since = (datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    to = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.000Z")
    
    payload = {
        "dir": "ASC",
        "filter": {
            "since": since,
            "to": to
        },
        "limit": 50
    }
    
    try:
        resp = requests.post(url, headers=headers, json=payload)
        if resp.status_code == 200:
            return resp.json().get('result', {}).get('postings', [])
        else:
            print(f"❌ Ozon API Error: {resp.status_code} - {resp.text}")
            return []
    except Exception as e:
        print(f"❌ Ozon Request Exception: {e}")
        return []

def find_ms_product(article):
    # 1. Try exact match
    url = f"https://api.moysklad.ru/api/remap/1.2/entity/product?filter=article={article}"
    headers = get_ms_auth_header()
    
    try:
        resp = requests.get(url, headers=headers)
        if resp.status_code == 200:
            rows = resp.json().get('rows', [])
            if rows:
                return rows[0]
                
        # 2. Try stripping suffix (e.g. 109711985_ozon_v2 -> 109711985)
        if '_' in article:
            clean_article = article.split('_')[0]
            print(f"ℹ️ Retrying search with clean article: {clean_article}")
            url = f"https://api.moysklad.ru/api/remap/1.2/entity/product?filter=article={clean_article}"
            resp = requests.get(url, headers=headers)
            if resp.status_code == 200:
                rows = resp.json().get('rows', [])
                if rows:
                    return rows[0]
                    
    except Exception as e:
        print(f"❌ MS Search Exception: {e}")
    return None

def get_or_create_agent():
    # Find or create "Ozon Buyer"
    name = "Покупатель Ozon"
    url = f"https://api.moysklad.ru/api/remap/1.2/entity/counterparty?filter=name={name}"
    headers = get_ms_auth_header()
    
    try:
        resp = requests.get(url, headers=headers)
        if resp.status_code == 200:
            rows = resp.json().get('rows', [])
            if rows:
                return rows[0]
            
        # Create
        create_url = "https://api.moysklad.ru/api/remap/1.2/entity/counterparty"
        payload = {"name": name}
        resp = requests.post(create_url, headers=headers, json=payload)
        if resp.status_code == 200:
            return resp.json()
    except Exception as e:
        print(f"❌ Agent Error: {e}")
    return None

def get_organization():
    url = "https://api.moysklad.ru/api/remap/1.2/entity/organization"
    headers = get_ms_auth_header()
    try:
        resp = requests.get(url, headers=headers)
        if resp.status_code == 200:
            rows = resp.json().get('rows', [])
            if rows:
                return rows[0]
    except:
        pass
    return None

def get_main_warehouse():
    # "Основной склад"
    url = "https://api.moysklad.ru/api/remap/1.2/entity/store?filter=name=Основной склад"
    headers = get_ms_auth_header()
    try:
        resp = requests.get(url, headers=headers)
        if resp.status_code == 200:
            rows = resp.json().get('rows', [])
            if rows:
                return rows[0]
    except Exception as e:
        print(f"❌ Warehouse Error: {e}")
    return None

def create_ms_order(ozon_order, agent, organization, warehouse):
    url = "https://api.moysklad.ru/api/remap/1.2/entity/customerorder"
    headers = get_ms_auth_header()
    
    posting_number = ozon_order.get('posting_number')
    products = ozon_order.get('products', [])
    
    positions = []
    
    for p in products:
        offer_id = p.get('offer_id') # Should be our Article
        quantity = p.get('quantity', 1)
        price_str = p.get('price', '0')
        price_val = float(price_str) * 100 # MS uses cents
        
        ms_product = find_ms_product(offer_id)
        if not ms_product:
            print(f"⚠️ Product not found in MS: {offer_id}")
            continue
            
        positions.append({
            "quantity": quantity,
            "price": price_val,
            "reserve": quantity,
            "assortment": {
                "meta": ms_product['meta']
            }
        })
        
    if not positions:
        print("⚠️ No valid positions for order.")
        return False
        
    payload = {
        "name": posting_number,
        "organization": {"meta": organization['meta']},
        "agent": {"meta": agent['meta']},
        "store": {"meta": warehouse['meta']},
        "positions": positions,
        "description": f"Ozon Order: {posting_number}"
    }
    
    try:
        resp = requests.post(url, headers=headers, json=payload)
        if resp.status_code == 200:
            print(f"✅ Created MS Order: {posting_number}")
            return True
        else:
            print(f"❌ MS Order Creation Failed: {resp.status_code} - {resp.text}")
    except Exception as e:
        print(f"❌ MS Order Exception: {e}")
        
    return False

def get_ozon_cancelled_orders():
    url = "https://api-seller.ozon.ru/v3/posting/fbs/list"
    headers = {
        'Client-Id': OZON_CLIENT_ID,
        'Api-Key': OZON_API_KEY,
        'Content-Type': 'application/json'
    }
    
    # Fetch cancelled orders from last 24 hours
    since = (datetime.utcnow() - timedelta(days=1)).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    to = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.000Z")
    
    payload = {
        "dir": "ASC",
        "filter": {
            "since": since,
            "to": to,
            "status": "cancelled" 
        },
        "limit": 50
    }
    
    try:
        resp = requests.post(url, headers=headers, json=payload)
        if resp.status_code == 200:
            return resp.json().get('result', {}).get('postings', [])
        else:
            print(f"❌ Ozon API Error (Cancelled): {resp.status_code} - {resp.text}")
            return []
    except Exception as e:
        print(f"❌ Ozon Request Exception (Cancelled): {e}")
        return []

def cancel_ms_order(posting_number):
    # Find order by name
    url = f"https://api.moysklad.ru/api/remap/1.2/entity/customerorder?filter=name={posting_number}"
    headers = get_ms_auth_header()
    
    try:
        resp = requests.get(url, headers=headers)
        if resp.status_code == 200:
            rows = resp.json().get('rows', [])
            if rows:
                order = rows[0]
                if order.get('applicable') == False:
                    # Already cancelled/not applicable
                    return False
                
                # Update to applicable=False
                update_url = order['meta']['href']
                payload = {"applicable": False}
                update_resp = requests.put(update_url, headers=headers, json=payload)
                
                if update_resp.status_code == 200:
                    print(f"✅ Cancelled MS Order: {posting_number} (Reserve released)")
                    return True
                else:
                    print(f"❌ Failed to cancel MS Order {posting_number}: {update_resp.status_code}")
    except Exception as e:
        print(f"❌ MS Cancel Exception: {e}")
    return False

def main():
    print("🚀 Starting Ozon Order Sync...")
    
    if not OZON_CLIENT_ID or not OZON_API_KEY:
        print("❌ Missing Ozon Credentials")
        return

    if not MOYSKLAD_LOGIN or not MOYSKLAD_PASSWORD:
        print("❌ Missing MoySklad Credentials")
        return

    cache = load_cache()
    synced_ids = set(cache.get('synced_ids', []))
    
    # 1. Process New Orders
    orders = get_ozon_orders()
    print(f"📦 Found {len(orders)} orders awaiting packaging.")
    
    agent = get_or_create_agent()
    organization = get_organization()
    warehouse = get_main_warehouse()
    
    if agent and organization and warehouse:
        new_synced_count = 0
        for order in orders:
            posting_number = order.get('posting_number')
            status = order.get('status')
            
            if status not in ['awaiting_packaging', 'awaiting_deliver']:
                continue

            if posting_number in synced_ids:
                continue
                
            print(f"Processing new order: {posting_number} ({status})")
            if create_ms_order(order, agent, organization, warehouse):
                synced_ids.add(posting_number)
                new_synced_count += 1
        
        if new_synced_count > 0:
            print(f"✅ Created {new_synced_count} new orders.")
            
    # 2. Process Cancellations
    cancelled_orders = get_ozon_cancelled_orders()
    if cancelled_orders:
        print(f"🚫 Found {len(cancelled_orders)} cancelled orders.")
        cancelled_count = 0
        for order in cancelled_orders:
            posting_number = order.get('posting_number')
            if cancel_ms_order(posting_number):
                cancelled_count += 1
        if cancelled_count > 0:
            print(f"✅ Cancelled {cancelled_count} orders in MS.")

    cache['synced_ids'] = list(synced_ids)
    save_cache(cache)
    print("✅ Sync cycle complete.")

if __name__ == "__main__":
    main()
