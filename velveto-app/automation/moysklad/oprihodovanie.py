import os
import requests
import json
import base64
import argparse
from dotenv import load_dotenv

# Load environment variables from web project
load_dotenv("moysklad-web/.env.local")

# MoySklad settings
LOGIN = os.getenv("MOYSKLAD_LOGIN")
PASSWORD = os.getenv("MOYSKLAD_PASSWORD")
BASE_URL = "https://api.moysklad.ru/api/remap/1.2"

# Removed hardcoded WAREHOUSE_ID
# Default target: "Склад ВБ"

auth_str = f"{LOGIN}:{PASSWORD}"
auth_b64 = base64.b64encode(auth_str.encode()).decode()
HEADERS = {
    "Authorization": f"Basic {auth_b64}",
    "Content-Type": "application/json"
}

def get_store_meta(name="Склад ВБ"):
    """Find store by name and return meta"""
    url = f"{BASE_URL}/entity/store"
    try:
        resp = requests.get(url, headers=HEADERS)
        if resp.status_code == 200:
            rows = resp.json().get('rows', [])
            for row in rows:
                if row['name'] == name:
                    return row['meta']
            
            # Fallback if specific not found (e.g. for testing)
            # Try finding "Основной склад" if "Склад ВБ" missing
            if name != "Основной склад":
                 for row in rows:
                    if row['name'] == "Основной склад":
                        return row['meta']
            
            if rows: return rows[0]['meta']
    except Exception as e:
        print(f"Error getting store: {e}")
    return None

def find_product_by_article(article):
    url = f"{BASE_URL}/entity/product?filter=article={article}"
    resp = requests.get(url, headers=HEADERS)
    if resp.status_code == 200:
        rows = resp.json().get('rows', [])
        if rows:
            return rows[0]
    return None

def get_product_stock(product_id, store_id=None):
    """
    Get stock for a product. 
    If store_id is provided, returns stock for that specific warehouse.
    Otherwise returns total physical stock.
    """
    url = f"{BASE_URL}/report/stock/all?filter=product={BASE_URL}/entity/product/{product_id}"
    if store_id:
        url += f";store={BASE_URL}/entity/store/{store_id}"
        
    try:
        resp = requests.get(url, headers=HEADERS)
        if resp.status_code == 200:
            rows = resp.json().get('rows', [])
            if rows:
                return rows[0].get('stock', 0)
    except Exception as e:
        print(f"Error getting stock: {e}")
    return 0

def create_enter(product_meta, quantity, price):
    url = f"{BASE_URL}/entity/enter"
    
    # Dynamic store fetch
    store_meta = get_store_meta("Склад ВБ")
    if not store_meta:
        return {"success": False, "error": "Store 'Склад ВБ' not found"}

    data = {
        "organization": {
            "meta": {
                "href": f"{BASE_URL}/entity/organization/metadata/attributes", 
                "type": "organization"
            }
        },
        "store": {
            "meta": store_meta
        },
        "positions": [
            {
                "quantity": quantity,
                "price": int(price * 100),
                "assortment": {
                    "meta": product_meta
                }
            }
        ]
    }
    
    # We need a valid organization. Let's fetch the first one.
    org_url = f"{BASE_URL}/entity/organization"
    org_resp = requests.get(org_url, headers=HEADERS)
    if org_resp.status_code == 200 and org_resp.json().get('rows'):
        data['organization']['meta'] = org_resp.json()['rows'][0]['meta']
    else:
        return {"success": False, "error": "Could not find organization"}

    resp = requests.post(url, json=data, headers=HEADERS)
    if resp.status_code == 200 or resp.status_code == 201:
        return {"success": True, "data": resp.json()}
    else:
        return {"success": False, "error": resp.text}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--article", required=True)
    parser.add_argument("--name", required=True)
    parser.add_argument("--quantity", type=int, default=1)
    parser.add_argument("--price", type=float, default=0)
    args = parser.parse_args()

    print(f"🚀 Starting oprihodovanie for {args.name} ({args.article})...")
    
    try:
        product = find_product_by_article(args.article)
        if not product:
            print(f"⚠️ Product {args.article} not found in MS. Please create it first.")
            print(f"JSON_START{json.dumps({'success': False, 'error': f'Product {args.article} not found in MS. Create it first.'})}JSON_END")
            return

        result = create_enter(product['meta'], args.quantity, args.price)
        if result['success']:
            print(f"✅ Oprihodovanie created: {result['data'].get('name')}")
            print(f"JSON_START{json.dumps(result)}JSON_END")
        else:
            print(f"❌ Error: {result['error']}")
            print(f"JSON_START{json.dumps(result)}JSON_END")

    except Exception as e:
        print(f"❌ Unexpected Error: {str(e)}")
        print(f"JSON_START{json.dumps({'success': False, 'error': str(e)})}JSON_END")

if __name__ == "__main__":
    main()
