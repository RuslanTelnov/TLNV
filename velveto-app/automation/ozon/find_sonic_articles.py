import os
import requests
import base64
import json
from dotenv import load_dotenv

# Load env from moysklad-automation folder
load_dotenv(os.path.join(os.getcwd(), "moysklad-automation", ".env"))

LOGIN = os.getenv("MOYSKLAD_LOGIN")
PASSWORD = os.getenv("MOYSKLAD_PASSWORD")
BASE_URL = "https://api.moysklad.ru/api/remap/1.2"

auth_str = f"{LOGIN}:{PASSWORD}"
auth_b64 = base64.b64encode(auth_str.encode()).decode()
HEADERS = {
    "Authorization": f"Basic {auth_b64}",
    "Content-Type": "application/json"
}

def find_products(query):
    print(f"🔎 Searching for '{query}' in MoySklad...")
    
    url = f"{BASE_URL}/entity/assortment"
    params = {
        "filter": f"name~={query}",
        "limit": 10
    }
    
    resp = requests.get(url, headers=HEADERS, params=params)
    if resp.status_code != 200:
        print(f"❌ Error: {resp.status_code}")
        return

    data = resp.json()
    rows = data.get('rows', [])
    
    print(f"✅ Found {len(rows)} products for '{query}':")
    for item in rows:
        name = item.get('name')
        article = item.get('article', 'NO_ARTICLE')
        stock = item.get('stock', 0)
        print(f" - {name} (Article: {article}, Stock: {stock})")

if __name__ == "__main__":
    find_products("Sonic")
    find_products("мягкая")
