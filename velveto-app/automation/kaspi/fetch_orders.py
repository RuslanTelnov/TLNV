import requests
import os
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load env
env_paths = [
    'moysklad-web/.env.local',
    '.env',
    '../.env'
]
for path in env_paths:
    if os.path.exists(path):
        load_dotenv(path)
        break

TOKEN = os.getenv("KASPI_API_TOKEN", "dutmsmqJIEi4CpuX2PNPDLbNcdpiRwNpKc3mwggACq0=")
BASE_URL = "https://kaspi.kz/shop/api/v2"

HEADERS = {
    "Content-Type": "application/json",
    "X-Auth-Token": TOKEN,
    "Accept": "application/json"
}

def fetch_orders():
    url = f"{BASE_URL}/orders/search"
    
    # Yesterday to today
    start_date = int((datetime.now() - timedelta(days=7)).timestamp() * 1000)
    end_date = int(datetime.now().timestamp() * 1000)
    
    payload = {
        "data": {
            "filter": {
                "creationDate": {
                    "$gte": start_date,
                    "$lte": end_date
                }
            }
        }
    }
    
    print(f"POST {url}")
    # Kaspi API expects text/plain or specific JSON structure sometimes.
    # Actually for v2 it's usually application/json
    resp = requests.post(url, headers=HEADERS, json=payload)
    
    if resp.status_code == 200:
        data = resp.json()
        print(f"✅ Found {len(data.get('data', []))} orders.")
        print(json.dumps(data, indent=2, ensure_ascii=False))
    else:
        print(f"Error: {resp.status_code} {resp.text}")

if __name__ == "__main__":
    fetch_orders()
