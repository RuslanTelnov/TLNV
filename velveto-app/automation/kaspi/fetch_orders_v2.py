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
USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

HEADERS = {
    "Content-Type": "application/json",
    "X-Auth-Token": TOKEN,
    "Accept": "application/json",
    "User-Agent": USER_AGENT
}

def fetch_orders():
    # Try /orders first (often GET) or /orders/search (often POST)
    url = f"{BASE_URL}/orders/search"
    
    # Last 3 days
    start_date = int((datetime.now() - timedelta(days=30)).timestamp() * 1000)
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
    try:
        response = requests.post(url, headers=HEADERS, json=payload, timeout=20)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Found {len(data.get('data', []))} orders.")
            # Print only first 2 orders to avoid flood
            debug_data = data.get('data', [])[:2]
            print(json.dumps(debug_data, indent=2, ensure_ascii=False))
        else:
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fetch_orders()
