import requests
import json
import os
import sys
import time
import concurrent.futures

# Adjust path to import KaspiApiClient
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from modules.kaspi_api_client import KaspiApiClient

TOKEN = 'dutmsmqJIEi4CpuX2PNPDLbNcdpiRwNpKc3mwggACq0='

def fetch_attributes_safe(client, cat):
    code = cat.get('code')
    name = cat.get('title')
    cat_data = {
        "code": code,
        "name": name,
        "attributes": []
    }
    try:
        # print(f"Fetching attrs for {code}...")
        attributes = client.get_attributes(code)
        cat_data['attributes'] = attributes
    except Exception as e:
        print(f"⚠️ Error fetching attributes for {code}: {e}")
    
    return cat_data

def fetch_full_schema_fast():
    client = KaspiApiClient(TOKEN)
    
    print("🚀 Fetching all categories...")
    try:
        categories = client.get_categories()
    except Exception as e:
        print(f"❌ Failed to get categories: {e}")
        return

    print(f"✅ Found {len(categories)} categories. Starting parallel fetch...")
    
    full_schema = []
    total = len(categories)
    completed = 0
    
    # Use ThreadPoolExecutor
    # 20 workers is reasonable for network I/O
    with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
        future_to_cat = {executor.submit(fetch_attributes_safe, client, cat): cat for cat in categories}
        
        for future in concurrent.futures.as_completed(future_to_cat):
            cat_data = future.result()
            full_schema.append(cat_data)
            completed += 1
            if completed % 100 == 0:
                print(f"[{completed}/{total}] Processed...")

    # Save to file
    output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../data/kaspi_full_schema.json')
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(full_schema, f, ensure_ascii=False, indent=2)
        
    print(f"💾 Schema saved to {output_path}")

if __name__ == "__main__":
    fetch_full_schema_fast()
