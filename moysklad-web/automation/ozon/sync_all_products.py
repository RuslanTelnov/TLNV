import os
import sys
import json
import requests
import time
from dotenv import load_dotenv

# Add parent directory to path to allow imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from get_ms_products import get_products as fetch_ms_products
from create_ozon_by_article import create_card_by_article

# Load keys
script_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.abspath(os.path.join(script_dir, "../../../../.env"))
load_dotenv(env_path)

ozon_env_path = os.path.join(script_dir, ".env.ozon")
if os.path.exists(ozon_env_path):
    load_dotenv(ozon_env_path)

OZON_CLIENT_ID = os.getenv('OZON_CLIENT_ID')
OZON_API_KEY = os.getenv('OZON_API_KEY')

def get_ozon_existing_products():
    """Fetch all existing products from Ozon to check for duplicates"""
    if not OZON_CLIENT_ID or not OZON_API_KEY:
        print("⚠️ No Ozon keys found. Skipping duplicate check against Ozon API.")
        return set()

    # UPDATED: v2/product/list is 404, using v3
    url = "https://api-seller.ozon.ru/v3/product/list"
    headers = {
        'Client-Id': OZON_CLIENT_ID,
        'Api-Key': OZON_API_KEY,
        'Content-Type': 'application/json'
    }
    
    existing_offer_ids = set()
    
    payload = {
        "filter": {
            "visibility": "ALL"
        },
        "limit": 1000 
    }
    
    try:
        resp = requests.post(url, headers=headers, json=payload)
        if resp.status_code == 200:
            items = resp.json().get('result', {}).get('items', [])
            for item in items:
                existing_offer_ids.add(item['offer_id'])
            print(f"✅ Found {len(existing_offer_ids)} existing products in Ozon.")
        else:
            print(f"❌ Failed to fetch Ozon products: {resp.text}")
    except Exception as e:
        print(f"❌ Error fetching Ozon products: {e}")
        
    return existing_offer_ids

def run_sync():
    # 1. Fetch MS Products
    # We'll run the function but capture its output (it writes to json)
    # Ideally modify get_ms_products to return list, but let's read the JSON it produces.
    print("📦 Fetching products from MoySklad...")
    fetch_ms_products() # This saves to ozon-automation/products_to_process.json
    
    json_path = os.path.join(os.getcwd(), "ozon-automation", "products_to_process.json")
    if not os.path.exists(json_path):
        print("❌ Failed to generate products_to_process.json")
        return

    with open(json_path, "r") as f:
        ms_products = json.load(f)

    # 2. Get Ozon Existing (Offer IDs)
    existing_ozon_ids = get_ozon_existing_products()

    # 3. Filter and Create
    print(f"\n🚀 Starting Batch Creation for {len(ms_products)} products...")
    
    for p in ms_products:
        article = p.get('article')
        name = p.get('name')
        
        if not article:
            print(f"⚠️ Skipping '{name}': No article found.")
            continue
            
        # Check duplicate by Article (which we use as Offer ID)
        if str(article) in existing_ozon_ids:
            print(f"⏭️ Skipping {article} ({name}): Already in Ozon.")
            continue
            
        # Also check with suffix if we used that logic
        if f"{article}_ozon" in existing_ozon_ids:
             print(f"⏭️ Skipping {article} ({name}): Already in Ozon (suffix found).")
             continue

        print(f"\n✨ Creating card for: {name} (Art: {article})")
        
        # Call the creation logic
        # We wrap in try-except to not stop the loop
        try:
            create_card_by_article(article)
            # Sleep to avoid rate limits
            time.sleep(2)
        except Exception as e:
             print(f"❌ Error creating {article}: {e}")

if __name__ == "__main__":
    run_sync()
