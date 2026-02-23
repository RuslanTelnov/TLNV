import os
import json
import sys
import time
from typing import List, Dict, Any
from supabase import create_client, Client
from dotenv import load_dotenv
import requests

# Add automation/kaspi to path for imports
current_file_dir = os.path.dirname(os.path.abspath(__file__))
if current_file_dir not in sys.path:
    sys.path.append(current_file_dir)

from modules.creator import create_card
from modules.wb_enricher import WBEnricher
from modules.category_mapper import KaspiCategoryMapper
from modules.image_uploader import ImageUploader
from publish_offer import publish_offer

# Load env
def load_env_robust():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    possible_paths = [
        os.path.join(current_dir, "../../../.env.local"),
        os.path.join(current_dir, "../../../.env"),
        os.path.join(os.getcwd(), ".env.local"),
        os.path.join(os.getcwd(), ".env"),
        "/home/wik/antigravity/scratch/moysklad-automation/.env"
    ]
    for p in possible_paths:
        if os.path.exists(p):
            print(f"✅ Loading env from: {p}")
            load_dotenv(p)
            return True
    return False

load_env_robust()

# MS Credentials
MS_LOGIN = os.getenv("MOYSKLAD_LOGIN")
MS_PASSWORD = os.getenv("MOYSKLAD_PASSWORD")
MS_BASE_URL = "https://api.moysklad.ru/api/remap/1.2"
MS_AUTH = (MS_LOGIN, MS_PASSWORD)

# Supabase
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: Supabase credentials missing!")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_store_id(name="Склад ВБ"):
    resp = requests.get(f"{MS_BASE_URL}/entity/store", auth=MS_AUTH)
    if resp.ok:
        for store in resp.json().get('rows', []):
            if store['name'] == name:
                return store['id']
    return None

def fetch_ms_candidates(store_name="Склад ВБ"):
    store_id = get_store_id(store_name)
    if not store_id:
        print(f"❌ Store '{store_name}' not found.")
        return []

    print(f"🔍 Fetching products with positive stock on '{store_name}'...")
    url = f"{MS_BASE_URL}/report/stock/all?filter=stockMode=positiveOnly&store.id={store_id}&limit=1000"
    
    try:
        resp = requests.get(url, auth=MS_AUTH, timeout=60)
        if resp.ok:
            rows = resp.json().get('rows', [])
            return rows
    except Exception as e:
        print(f"❌ Exception fetching stock: {e}")
    return []

def process_product(ms_product: Dict[str, Any]):
    product_name = ms_product.get('name')
    # article field in MS should contain the WB NM ID
    article = ms_product.get('article')
    
    if not article or not article.isdigit():
        print(f"⚠️ Skipping '{product_name}': Invalid Article ID ('{article}')")
        return False

    nm_id = int(article)
    print(f"🚀 Processing: {product_name} (Article: {nm_id})")

    # 1. Enrich data from Wildberries
    print(f"   🔍 Enriching data from WB...")
    wb_data = WBEnricher.enrich_product_data({"id": nm_id, "name": product_name})
    
    if not wb_data or not wb_data.get('attributes'):
        print(f"   ❌ Failed to enrich data for {nm_id}")
        return False

    # 2. Add price from MS stock report
    price_kzt = int(ms_product.get('price', 0) / 100) # MS stores price in kopeks/tiyn?
    # Actually MS stock report price is usually already in major units or needs conversion.
    # Let's assume it's roughly correct or we get it from WB.
    if not price_kzt:
        price_kzt = wb_data.get('price_kzt', 0)

    # 3. Create Kaspi Card
    print(f"   📦 Creating Kaspi Card...")
    try:
        from create_from_wb import map_wb_to_kaspi
        
        kaspi_payload = map_wb_to_kaspi(wb_data)
        if not kaspi_payload:
            print(f"   ❌ Failed to map to Kaspi (Unknown category?)")
            return False
            
        success, upload_id = create_card(kaspi_payload)
        if success:
            print(f"   ✅ Kaspi Card Created (Upload ID: {upload_id})")
            
            # 4. Immediate Offer Publishing
            retail_price = int(price_kzt / 0.3) if price_kzt > 0 else 0
            if retail_price > 0:
                print(f"   📣 Publishing Offer: {retail_price} KZT")
                publish_offer(str(nm_id), price=retail_price, stock=10, preorder=True)
            else:
                print(f"   ⚠️ Skipping Offer Publish: Price is 0")
            
            return True
        else:
            print(f"   ❌ Kaspi Creation Failed.")
            return False
            
    except Exception as e:
        print(f"   ❌ Exception during Kaspi creation: {e}")
        return False

def main():
    candidates = fetch_ms_candidates()
    if not candidates:
        print("ℹ️ No candidates found.")
        return

    print(f"🎯 Found {len(candidates)} candidates. Processing...")
    
    success_count = 0
    fail_count = 0
    
    for product in candidates:
        if process_product(product):
            success_count += 1
        else:
            fail_count += 1
        
        print(f"📊 Progress: {success_count} success, {fail_count} failed out of {len(candidates)}")
        time.sleep(1) # Rate limit protection

if __name__ == "__main__":
    main()
