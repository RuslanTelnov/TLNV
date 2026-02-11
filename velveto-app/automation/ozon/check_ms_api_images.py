import os
import requests
import base64
import json
from dotenv import load_dotenv

load_dotenv(os.path.join(os.getcwd(), "moysklad-automation", ".env"))

LOGIN = os.getenv("MOYSKLAD_LOGIN")
PASSWORD = os.getenv("MOYSKLAD_PASSWORD")

if not LOGIN or not PASSWORD:
    print("Error: MOYSKLAD_LOGIN or MOYSKLAD_PASSWORD not found in .env")
    exit(1)

print(f"Login loaded: {LOGIN[:3]}***")
BASE_URL = "https://api.moysklad.ru/api/remap/1.2"
MAIN_WAREHOUSE_ID = "de940fd4-23f4-11ef-0a80-0eb00010b17c"

auth_str = f"{LOGIN}:{PASSWORD}"
auth_b64 = base64.b64encode(auth_str.encode()).decode()
HEADERS = {
    "Authorization": f"Basic {auth_b64}",
    "Content-Type": "application/json"
}

def check_images():
    url = f"{BASE_URL}/entity/assortment"
    params = {
        "store": f"https://api.moysklad.ru/api/remap/1.2/entity/store/{MAIN_WAREHOUSE_ID}",
        "limit": 100,
        "stockMode": "positiveOnly",
        "expand": "images"
    }
    
    print(f"Fetching products from warehouse {MAIN_WAREHOUSE_ID}...")
    resp = requests.get(url, headers=HEADERS, params=params)
    
    if resp.status_code != 200:
        print(f"Error: {resp.status_code} {resp.text}")
        return

    data = resp.json()
    rows = data.get('rows', [])
    
    found_image = False
    for item in rows:
        images = item.get('images')
        # Check if size > 0
        if images and images.get('meta', {}).get('size', 0) > 0:
            name = item.get('name')
            print(f"\n✅ Found product with images: {name}")
            print(f"  Images raw: {json.dumps(images, indent=2)}")
            
            if isinstance(images, dict) and 'rows' in images:
                for img in images['rows']:
                    filename = img.get('filename')
                    miniature = img.get('miniature', {}).get('href')
                    tiny = img.get('tiny', {}).get('href')
                    print(f"  - Image: {filename}")
                    print(f"    Miniature: {miniature}")
                    print(f"    Tiny: {tiny}")
            found_image = True
            break
    
    if not found_image:
        print("❌ No products with images found in the first 100 items.")

if __name__ == "__main__":
    check_images()
