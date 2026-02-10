import requests
import os
import json
from dotenv import load_dotenv

# Load env from various possible locations
env_paths = [
    'moysklad-web/.env.local',
    '.env',
    '../.env'
]
for path in env_paths:
    if os.path.exists(path):
        load_dotenv(path)
        print(f"Loaded env from {path}")
        break

TOKEN = os.getenv("KASPI_API_TOKEN", "dutmsmqJIEi4CpuX2PNPDLbNcdpiRwNpKc3mwggACq0=")
BASE_URL = "https://kaspi.kz/shop/api/v2"

HEADERS = {
    "Content-Type": "application/json",
    "X-Auth-Token": TOKEN,
    "Accept": "application/json"
}

def probe_pos():
    url = f"{BASE_URL}/pointsofservice"
    print(f"GET {url}")
    resp = requests.get(url, headers=HEADERS)
    if resp.status_code == 200:
        data = resp.json()
        print(json.dumps(data, indent=2, ensure_ascii=False))
    else:
        print(f"Error: {resp.status_code} {resp.text}")

if __name__ == "__main__":
    probe_pos()
