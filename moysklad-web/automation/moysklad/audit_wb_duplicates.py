import os
import requests
import base64
import json
from dotenv import load_dotenv

env_paths = ['.env.local', '.env', '../.env', 'moysklad-web/.env.local', 'automation/moysklad/.env']
for path in env_paths:
    if os.path.exists(path):
        load_dotenv(path)
        break

LOGIN = os.getenv("MOYSKLAD_LOGIN")
PASSWORD = os.getenv("MOYSKLAD_PASSWORD")
BASE_URL = "https://api.moysklad.ru/api/remap/1.2"
WB_STORE_ID = "6c721ced-f052-11f0-0a80-03a50013dad7"

if not LOGIN or not PASSWORD:
    print("❌ Error: Missing MoySklad credentials")
    exit(1)

auth_str = f"{LOGIN}:{PASSWORD}"
auth_b64 = base64.b64encode(auth_str.encode()).decode()
HEADERS = {
    "Authorization": f"Basic {auth_b64}",
    "Accept": "application/json;charset=utf-8",
    "Content-Type": "application/json"
}

def get_duplicates():
    print("🔎 Scanning for stock duplicates on 'Склад ВБ'...")
    url = f"{BASE_URL}/report/stock/all"
    params = {"limit": 1000, "stockMode": "positiveOnly"}
    
    duplicates = []
    offset = 0
    
    while True:
        params["offset"] = offset
        resp = requests.get(url, headers=HEADERS, params=params)
        if resp.status_code != 200:
            print(f"❌ API Error: {resp.text}")
            break
            
        data = resp.json()
        rows = data.get('rows', [])
        if not rows:
            break
            
        for item in rows:
            name = item.get('name')
            article = item.get('article', 'N/A')
            stock_by_store = item.get('stockByStore', [])
            
            wb_stock = 0
            other_stocks = []
            
            for store in stock_by_store:
                s_href = store.get('meta', {}).get('href', '')
                s_stock = store.get('stock', 0)
                
                if WB_STORE_ID in s_href:
                    wb_stock = s_stock
                elif s_stock > 0:
                    # We'll fetch the store name later if needed, for now just flag it
                    other_stocks.append(s_stock)
            
            # If it has stock on WB AND anywhere else, it's a potential duplicate
            if wb_stock > 0 and other_stocks:
                duplicates.append({
                    "name": name,
                    "article": article,
                    "wb_stock": wb_stock,
                    "total_other": sum(other_stocks)
                })
        
        offset += params["limit"]
        if offset >= data.get('meta', {}).get('size', 0):
            break
            
    return duplicates

if __name__ == "__main__":
    dups = get_duplicates()
    
    if dups:
        print(f"\n🚨 Found {len(dups)} products with duplicate stock:")
        print(f"{'Article':<15} | {'WB':<5} | {'Other':<5} | {'Name'}")
        print("-" * 60)
        for d in dups:
            print(f"{d['article']:<15} | {int(d['wb_stock']):<5} | {int(d['total_other']):<5} | {d['name']}")
        print("\n💡 Recommendation: These products should probably be removed from 'Склад ВБ' if they are on 'Основной склад'.")
    else:
        print("\n✨ No duplicate stock found. All systems nominal.")
