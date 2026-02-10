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
    "X-Auth-Token": TOKEN,
    "Accept": "application/json",
    "User-Agent": USER_AGENT
}

def fetch_orders():
    # Try GET /orders
    url = f"{BASE_URL}/orders"
    
    # Last 30 days
    start_date = int((datetime.now() - timedelta(days=30)).timestamp() * 1000)
    end_date = int(datetime.now().timestamp() * 1000)
    
    params = {
        "filter[creationDate][$gte]": start_date,
        "filter[creationDate][$lte]": end_date,
        "page[number]": 0,
        "page[size]": 20
    }
    
    print(f"GET {url}")
    try:
        response = requests.get(url, headers=HEADERS, params=params, timeout=20)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success!")
            print(json.dumps(data, indent=2, ensure_ascii=False)[:2000] + "...")
        else:
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fetch_orders()
