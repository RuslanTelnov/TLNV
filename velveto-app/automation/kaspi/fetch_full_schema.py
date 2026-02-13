import requests
import json
import os
import sys
import time

# Adjust path to import KaspiApiClient
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from modules.kaspi_api_client import KaspiApiClient

# Valid Token from existing code
TOKEN = 'dutmsmqJIEi4CpuX2PNPDLbNcdpiRwNpKc3mwggACq0='

def fetch_full_schema():
    client = KaspiApiClient(TOKEN)
    
    print("🚀 Fetching all categories...")
    try:
        categories = client.get_categories()
    except Exception as e:
        print(f"❌ Failed to get categories: {e}")
        return

    print(f"✅ Found {len(categories)} categories.")
    
    full_schema = []
    
    # Limit for testing/safety if needed, but user wants ALL
    # iterating all might take time.
    
    for idx, cat in enumerate(categories):
        code = cat.get('code')
        name = cat.get('title') # Changed from 'name' to 'title'
        print(f"[{idx+1}/{len(categories)}] Processing '{name}' ({code})...")
        
        cat_data = {
            "code": code,
            "name": name,
            "attributes": []
        }
        
        try:
            # Fetch attributes for this category
            attributes = client.get_attributes(code)
            
            # For each attribute, we might want values too? 
            # The user asked for "available fields for filling".
            # Attributes definition usually includes type.
            
            for attr in attributes:
                attr_code = attr.get('code')
                # If it's a list type, we might want to fetch values, but that triggers A LOT of requests.
                # Let's stick to attribute definitions first.
                cat_data['attributes'].append(attr)
                
            full_schema.append(cat_data)
            
        except Exception as e:
            print(f"   ⚠️ Failed to attributes for {code}: {e}")
            # Append anyway without attributes
            full_schema.append(cat_data)
            
        # Rate limit protection
        time.sleep(0.1)

    # Save to file
    output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../data/kaspi_full_schema.json')
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(full_schema, f, ensure_ascii=False, indent=2)
        
    print(f"💾 Schema saved to {output_path}")

if __name__ == "__main__":
    fetch_full_schema()
