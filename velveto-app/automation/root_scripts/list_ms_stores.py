
import os
import requests
import base64
from dotenv import load_dotenv

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

url = f"{BASE_URL}/entity/store"
resp = requests.get(url, headers=HEADERS)

if resp.status_code == 200:
    for row in resp.json()['rows']:
        print(f"Store: {row['name']} (ID: {row['id']})")
else:
    print(f"Error: {resp.text}")
