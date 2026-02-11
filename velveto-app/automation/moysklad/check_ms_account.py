import os
import requests
import base64
import json
from dotenv import load_dotenv

load_dotenv()

LOGIN = os.getenv("MOYSKLAD_LOGIN")
PASSWORD = os.getenv("MOYSKLAD_PASSWORD")
BASE_URL = "https://api.moysklad.ru/api/remap/1.2"

if not LOGIN or not PASSWORD:
    print("Error: Missing credentials")
    exit(1)

auth_str = f"{LOGIN}:{PASSWORD}"
auth_b64 = base64.b64encode(auth_str.encode()).decode()
HEADERS = {
    "Authorization": f"Basic {auth_b64}",
    "Content-Type": "application/json"
}

def check_account():
    url = f"{BASE_URL}/context/companysettings"
    try:
        resp = requests.get(url, headers=HEADERS)
        if resp.status_code == 200:
            data = resp.json()
            print("--- MoySklad Account Info ---")
            print(f"Company ID: {data.get('id')}")
            # Try to get company name from another endpoint if needed, but settings usually has currency etc.
            
            # Get My Company entity to see name
            org_url = f"{BASE_URL}/entity/organization"
            org_resp = requests.get(org_url, headers=HEADERS)
            if org_resp.status_code == 200:
                rows = org_resp.json().get('rows', [])
                if rows:
                    print(f"Organization Name: {rows[0]['name']}")
                    print(f"Organization ID: {rows[0]['id']}")
                else:
                    print("No organization found.")
            
        else:
            print(f"Error: {resp.status_code} - {resp.text}")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    check_account()
