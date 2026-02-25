import os
import re
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
        os.path.join(current_dir, "../../../.env"),
        os.path.join(current_dir, "../../../.env.local"),
        os.path.join(os.getcwd(), ".env"),
        os.path.join(os.getcwd(), ".env.local"),
        "/home/wik/antigravity/scratch/moysklad-automation/.env"
    ]
    loaded = False
    for p in possible_paths:
        if os.path.exists(p):
            print(f"✅ Loading env from: {p}")
            load_dotenv(p)
            loaded = True
    return loaded

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

def check_if_created(article: int):
    """Checks if the product is already marked as created in Supabase."""
    try:
        res = supabase.schema('Parser').table('wb_search_results').select('kaspi_created').eq('id', article).execute()
        if res.data and res.data[0].get('kaspi_created'):
            return True
    except Exception as e:
        print(f"   ⚠️ Error checking status: {e}")
    return False

def update_kaspi_status(article: int, upload_id: str, sku: str):
    """Updates the product status in Supabase 'wb_search_results'."""
    try:
        # 1. Fetch current specs to preserve other data
        res = supabase.schema('Parser').table('wb_search_results').select('specs').eq('id', article).execute()
        specs = {}
        if res.data and res.data[0].get('specs'):
            specs = res.data[0]['specs']
            if isinstance(specs, str):
                specs = json.loads(specs)
        
        # 2. Add Kaspi info
        specs['kaspi_created'] = True
        specs['kaspi_upload_id'] = upload_id
        specs['kaspi_sku'] = sku
        specs['kaspi_sync_date'] = time.strftime('%Y-%m-%d %H:%M:%S')
        
        # 3. Update record
        supabase.schema('Parser').table('wb_search_results').update({
            'kaspi_created': True,
            'specs': specs
        }).eq('id', article).execute()
        print(f"   🔄 Updated status in Supabase for {article}")
    except Exception as e:
        print(f"   ⚠️ Failed to update Supabase status: {e}")

def check_name_integrity(ms_name: str, wb_name: str) -> bool:
    """Checks if MS name and WB name are reasonably similar."""
    if not ms_name or not wb_name:
        return False
        
    ms_words = set(re.findall(r'\w+', ms_name.lower()))
    wb_words = set(re.findall(r'\w+', wb_name.lower()))
    
    # Filter out very short words
    ms_words = {w for w in ms_words if len(w) > 2}
    wb_words = {w for w in wb_words if len(w) > 2}
    
    if not ms_words: # If MS name is just symbols/numbers, allow it
        return True
        
    overlap = ms_words.intersection(wb_words)
    
    # If no overlapping words and both names are substantial, it's likely a mistake
    if not overlap and len(ms_words) >= 2 and len(wb_words) >= 2:
        return False
        
    return True

def process_product(ms_product: Dict[str, Any]):
    product_name = ms_product.get('name')
    # article field in MS should contain the WB NM ID
    article_str = ms_product.get('article')
    
    if not article_str or not article_str.isdigit():
        print(f"⚠️ Skipping '{product_name}': Invalid Article ID ('{article_str}')")
        return False

    nm_id = int(article_str)
    
    # Check if already created
    if check_if_created(nm_id):
        print(f"⏭️  Skipping '{product_name}' ({nm_id}): Already marked as created.")
        return True # Treat as success in terms of flow

    print(f"🚀 Processing: {product_name} (Article: {nm_id})")

    # 1. Enrich data from Wildberries
    print(f"   🔍 Enriching data from WB...")
    wb_data = WBEnricher.enrich_product_data({"id": nm_id, "name": product_name})
    
    if not wb_data or not wb_data.get('attributes'):
        print(f"   ❌ Failed to enrich data for {nm_id}")
        return False

    # 1.5 Strict Integrity Check
    wb_name = wb_data.get('name', '')
    if not check_name_integrity(product_name, wb_name):
        print(f"   🛑 DATA INTEGRITY ALERT: Severe name mismatch!")
        print(f"      MS: '{product_name}'")
        print(f"      WB: '{wb_name}'")
        print(f"      Skipping to avoid miscategorization.")
        return False

    # 2. Add price from MS stock report
    price_kzt = int(ms_product.get('price', 0) / 100) 
    if not price_kzt:
        price_kzt = wb_data.get('price_kzt', 0)

    # 3. Create Kaspi Card
    print(f"   📦 Creating Kaspi Card...")
    try:
        from create_from_wb import map_wb_to_kaspi
        
        # Pass MS name as hint to prefer our manual cache
        kaspi_payload = map_wb_to_kaspi(wb_data, name_hint=product_name)
        if not kaspi_payload:
            print(f"   ❌ Failed to map to Kaspi (Unknown category?)")
            return False
            
        # Ensure SKU is consistent (usually MoySklad Code or standard format)
        # For v2, let's use nm_id as default if MS doesn't have a better one
        sku = ms_product.get('code') or str(nm_id)
            
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
            
            # 5. Update Status in Database
            update_kaspi_status(nm_id, upload_id, sku)
            
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
