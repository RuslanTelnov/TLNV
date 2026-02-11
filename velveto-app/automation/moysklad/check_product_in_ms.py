import os
import requests
import base64
import argparse
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MoySklad settings
LOGIN = os.getenv("MOYSKLAD_LOGIN")
PASSWORD = os.getenv("MOYSKLAD_PASSWORD")
BASE_URL = "https://api.moysklad.ru/api/remap/1.2"

if not LOGIN or not PASSWORD:
    print(json.dumps({"error": "Missing MoySklad credentials in .env"}))
    exit(1)

auth_str = f"{LOGIN}:{PASSWORD}"
auth_b64 = base64.b64encode(auth_str.encode()).decode()
HEADERS = {
    "Authorization": f"Basic {auth_b64}",
    "Content-Type": "application/json"
}

def check_product(article):
    url = f"{BASE_URL}/entity/product?filter=externalCode={article}"
    print(f"Checking URL: {url}")
    try:
        resp = requests.get(url, headers=HEADERS)
        if resp.status_code == 200:
            data = resp.json()
            rows = data.get('rows', [])
            print(f"Found {len(rows)} products.")
            for row in rows:
                print(f"ID: {row['id']}")
                print(f"Name: {row['name']}")
                print(f"Article: {row.get('article', 'N/A')}")
                print(f"Folder: {row.get('productFolder', {}).get('meta', {}).get('href', 'N/A')}")
                
                # Fetch folder details
                folder_href = row.get('productFolder', {}).get('meta', {}).get('href')
                if folder_href:
                    folder_resp = requests.get(folder_href, headers=HEADERS)
                    if folder_resp.status_code == 200:
                        print(f"Folder Name: {folder_resp.json().get('name')}")
        else:
            print(f"Error: {resp.status_code} - {resp.text}")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("article", help="Product article/externalCode")
    args = parser.parse_args()
    check_product(args.article)
