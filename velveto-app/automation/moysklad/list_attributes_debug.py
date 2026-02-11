import os
import requests
import base64
from dotenv import load_dotenv

# Load environment variables
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(env_path)


LOGIN = os.getenv("MOYSKLAD_LOGIN")
PASSWORD = os.getenv("MOYSKLAD_PASSWORD")
BASE_URL = "https://api.moysklad.ru/api/remap/1.2"

auth_str = f"{LOGIN}:{PASSWORD}"
auth_b64 = base64.b64encode(auth_str.encode()).decode()
HEADERS = {
    "Authorization": f"Basic {auth_b64}",
    "Content-Type": "application/json"
}

def list_attributes():
    url = f"{BASE_URL}/entity/product/metadata/attributes"
    try:
        resp = requests.get(url, headers=HEADERS)
        if resp.status_code == 200:
            rows = resp.json().get('rows', [])
            for row in rows:
                print(f"Name: {row['name']}, ID: {row['id']}, Type: {row['type']}")
                if 'customEntity' in row:
                    print(f"  Custom Entity: {row['customEntity']}")
        else:
            print(f"Error: {resp.status_code} - {resp.text}")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    list_attributes()
