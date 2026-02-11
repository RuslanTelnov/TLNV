import os
import requests
import base64
from dotenv import load_dotenv

load_dotenv()

LOGIN = os.getenv("MOYSKLAD_LOGIN")
PASSWORD = os.getenv("MOYSKLAD_PASSWORD")
BASE_URL = "https://api.moysklad.ru/api/remap/1.2"

auth_str = f"{LOGIN}:{PASSWORD}"
auth_b64 = base64.b64encode(auth_str.encode()).decode()
HEADERS = {
    "Authorization": f"Basic {auth_b64}",
    "Content-Type": "application/json"
}

def list_stores():
    url = f"{BASE_URL}/entity/store"
    resp = requests.get(url, headers=HEADERS)
    if resp.status_code == 200:
        stores = resp.json().get('rows', [])
        for s in stores:
            print(f"ID: {s['id']}, Name: {s['name']}")
    else:
        print(f"Error: {resp.status_code} - {resp.text}")

if __name__ == "__main__":
    list_stores()
