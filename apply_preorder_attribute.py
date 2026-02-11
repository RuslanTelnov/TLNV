import os
import sys
import requests
import json
import base64
from dotenv import load_dotenv

# Setup path
sys.path.append(os.path.join(os.getcwd(), 'moysklad-web/automation/moysklad'))
import oprihodovanie

# Load MS Credentials
load_dotenv('moysklad-web/.env.local')
LOGIN = os.getenv("MOYSKLAD_LOGIN")
PASSWORD = os.getenv("MOYSKLAD_PASSWORD")
BASE_URL = "https://api.moysklad.ru/api/remap/1.2"

auth_str = f"{LOGIN}:{PASSWORD}"
auth_b64 = base64.b64encode(auth_str.encode()).decode()
HEADERS = {
    "Authorization": f"Basic {auth_b64}",
    "Content-Type": "application/json"
}

def get_preorder_attribute_id():
    url = f"{BASE_URL}/entity/product/metadata/attributes"
    resp = requests.get(url, headers=HEADERS)
    if resp.status_code == 200:
        rows = resp.json().get('rows', [])
        for row in rows:
            if "предзаказ" in row['name'].lower():
                return row['meta'], row['id']
    return None, None

def run_cleanup():
    print("🚀 Starting Preorder Attribute Cleanup (Target: 30 days)...")
    
    # 1. Get Attribute Info
    attr_meta, attr_id = get_preorder_attribute_id()
    if not attr_meta:
        print("❌ 'Предзаказ' attribute not found in MoySklad.")
        return

    # 2. Find Warehouse "Склад ВБ"
    store_meta = oprihodovanie.get_store_meta("Склад ВБ")
    if not store_meta:
        print("❌ 'Склад ВБ' not found.")
        return
    store_id = store_meta['href'].split('/')[-1]

    # 3. Fetch all products with stock on this warehouse
    print(f"📡 Fetching stock report for 'Склад ВБ'...")
    url = f"{BASE_URL}/report/stock/all?filter=store={BASE_URL}/entity/store/{store_id};stockMode=positiveOnly"
    resp = requests.get(url, headers=HEADERS)
    if resp.status_code != 200:
        print(f"❌ Error fetching stock: {resp.text}")
        return

    rows = resp.json().get('rows', [])
    print(f"📦 Found {len(rows)} products on 'Склад ВБ'. Updating attributes...")

    updated_count = 0
    for row in rows:
        ms_id = row['meta']['href'].split('/')[-1]
        name = row.get('name')
        
        # Apply attribute
        payload = {
            "attributes": [
                {
                    "meta": attr_meta,
                    "value": 30
                }
            ]
        }
        
        put_url = f"{BASE_URL}/entity/product/{ms_id}"
        put_resp = requests.put(put_url, json=payload, headers=HEADERS)
        if put_resp.status_code == 200:
            print(f"   ✅ Updated {name}")
            updated_count += 1
        else:
            print(f"   ❌ Failed {name}: {put_resp.text}")

    print(f"🏁 Cleanup Complete. Updated {updated_count} products.")

if __name__ == "__main__":
    run_cleanup()
