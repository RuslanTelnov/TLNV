import os
import requests
import base64
import time
from dotenv import load_dotenv

# Load environment variables
load_dotenv("moysklad-web/.env.local")

LOGIN = os.getenv("MOYSKLAD_LOGIN")
PASSWORD = os.getenv("MOYSKLAD_PASSWORD")
BASE_URL = "https://api.moysklad.ru/api/remap/1.2"

auth_str = f"{LOGIN}:{PASSWORD}"
auth_b64 = base64.b64encode(auth_str.encode()).decode()
HEADERS = {
    "Authorization": f"Basic {auth_b64}",
    "Content-Type": "application/json"
}

def get_store_id(name="Склад ВБ"):
    url = f"{BASE_URL}/entity/store"
    resp = requests.get(url, headers=HEADERS)
    if resp.status_code == 200:
        for row in resp.json().get('rows', []):
            if row['name'] == name:
                return row['id']
    return None

def cleanup():
    print("🧹 Starting MoySklad Cleanup...")
    
    # 1. Find Products with prefix 9876543456
    print("🔍 Searching for test products (prefix 9876543456)...")
    products = []
    offset = 0
    while True:
        url = f"{BASE_URL}/entity/product?filter=code~=9876543456&limit=100&offset={offset}"
        resp = requests.get(url, headers=HEADERS)
        if resp.status_code != 200:
            print(f"❌ Error fetching products: {resp.text}")
            break
        data = resp.json()
        rows = data.get('rows', [])
        if not rows:
            break
        products.extend(rows)
        offset += 100
        print(f"   Found {len(products)} products so far...")
    
    print(f"✅ Total products found: {len(products)}")

    # 2. Find Enter Documents on Склад ВБ
    store_id = get_store_id("Склад ВБ")
    if not store_id:
        print("❌ Could not find 'Склад ВБ'. Skipping Enter docs deletion.")
    else:
        print(f"🔍 Searching for 'Enter' documents on 'Склад ВБ' (Store ID: {store_id})...")
        enter_docs = []
        offset = 0
        while True:
            url = f"{BASE_URL}/entity/enter?filter=store=https://api.moysklad.ru/api/remap/1.2/entity/store/{store_id}&limit=100&offset={offset}"
            resp = requests.get(url, headers=HEADERS)
            if resp.status_code != 200:
                print(f"❌ Error fetching enter docs: {resp.text}")
                break
            data = resp.json()
            rows = data.get('rows', [])
            if not rows:
                break
            enter_docs.extend(rows)
            offset += 100
            print(f"   Found {len(enter_docs)} enter docs so far...")
        
        print(f"✅ Total Enter docs found: {len(enter_docs)}")

        # 3. Delete Enter Documents
        print(f"🗑️ Deleting {len(enter_docs)} Enter documents...")
        for doc in enter_docs:
            doc_id = doc['id']
            name = doc.get('name', 'Unknown')
            resp = requests.delete(f"{BASE_URL}/entity/enter/{doc_id}", headers=HEADERS)
            if resp.status_code == 200 or resp.status_code == 204:
                print(f"   ✅ Deleted Enter: {name}")
            else:
                print(f"   ❌ Failed to delete Enter {name}: {resp.text}")
            time.sleep(0.1) # Avoid rate limits

    # 4. Delete Products
    print(f"🗑️ Deleting {len(products)} products...")
    for prod in products:
        prod_id = prod['id']
        name = prod['name']
        resp = requests.delete(f"{BASE_URL}/entity/product/{prod_id}", headers=HEADERS)
        if resp.status_code == 200 or resp.status_code == 204:
            print(f"   ✅ Deleted Product: {name}")
        else:
            print(f"   ❌ Failed to delete Product {name}: {resp.text}")
        time.sleep(0.1) # Avoid rate limits

    print("🏁 Cleanup complete.")

if __name__ == "__main__":
    cleanup()
