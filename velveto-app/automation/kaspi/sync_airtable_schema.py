import os
import json
import requests
import time
from dotenv import load_dotenv

# Load env from web folder if needed (as in other scripts)
try:
    load_dotenv("moysklad-web/.env.local")
except: pass

if not os.getenv("AIRTABLE_API_KEY"):
    load_dotenv()

API_KEY = os.getenv("AIRTABLE_API_KEY")
BASE_ID = os.getenv("AIRTABLE_BASE_ID") or "appitxCGjgmiW2zLX" 

def get_headers():
    if not API_KEY:
        print("❌ AIRTABLE_API_KEY not found")
        return {}
    return {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

HEADERS = get_headers()

def ensure_category_table(category_code):
    """
    Ensure a table exists for the given category code.
    Loads schema from file to find category definition.
    """
    # Load schema
    schema_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../data/kaspi_full_schema.json')
    if not os.path.exists(schema_path):
        print(f"⚠️ Schema file not found at {schema_path}")
        return False
        
    try:
        with open(schema_path, 'r', encoding='utf-8') as f:
            categories = json.load(f)
    except Exception as e:
        print(f"❌ Error reading schema: {e}")
        return False

    # Find category
    target_cat = None
    for cat in categories:
        if cat.get('code') == category_code:
            target_cat = cat
            break
            
    if not target_cat:
        print(f"⚠️ Category {category_code} not found in schema.")
        return False
        
    # Check if table exists
    existing = get_existing_tables()
    table_name = target_cat.get('title', '')[:50].replace("/", "-")
    
    if table_name in existing:
        print(f"👌 Table '{table_name}' already exists.")
        return True
        
    # Create
    return create_table(target_cat)

def get_existing_tables():
    headers = get_headers()
    url = f"https://api.airtable.com/v0/meta/bases/{BASE_ID}/tables"
    resp = requests.get(url, headers=headers)
    if resp.status_code == 200:
        return {t['name']: t for t in resp.json().get('tables', [])}
    elif resp.status_code == 404:
        print("❌ Base not found or API Key invalid for Meta API.")
        return {}
    else:
        print(f"⚠️ Error fetching tables: {resp.text}")
        return {}

def create_table(category):
    table_name = category['title'][:50] # Airtable limit? No, but good practice.
    # Clean name
    table_name = table_name.replace("/", "-")
    
    fields = [
        {"name": "Product Name", "type": "singleLineText"}, # Primary
        {"name": "Brand", "type": "singleLineText"},
        {"name": "Article", "type": "singleLineText"},
        {"name": "Price", "type": "number", "options": {"precision": 0}},
        {"name": "Manual Link", "type": "url"},
        {"name": "Status", "type": "singleSelect", "options": {
            "choices": [
                {"name": "New"},
                {"name": "Processed"}, 
                {"name": "Error"}
            ]
        }}
    ]
    
    # Add Kaspi Attributes
    # We use 'singleLineText' for all to avoid complexity with select options
    seen_fields = {"Product Name", "Brand", "Article", "Price", "Manual Link", "Status"}
    
    for attr in category.get('attributes', []):
        attr_name = attr.get('title')
        if not attr_name or attr_name in seen_fields:
            continue
        
        # Mapping types
        # Kaspi types: STRING, SCALAR, NUMBER, etc.
        # Airtable: singleLineText, number, etc.
        # For simplicity, use singleLineText for everything initially.
        fields.append({"name": attr_name, "type": "singleLineText"})
        seen_fields.add(attr_name)

    payload = {
        "name": table_name,
        "description": f"Kaspi Category: {category.get('code')}",
        "fields": fields
    }
    
    url = f"https://api.airtable.com/v0/meta/bases/{BASE_ID}/tables"
    headers = get_headers()
    resp = requests.post(url, json=payload, headers=headers)
    
    if resp.status_code == 200:
        print(f"✅ Created table '{table_name}'")
        return True
    else:
        print(f"❌ Failed to create table '{table_name}': {resp.text}")
        return False

def sync_schema(schema_path):
    with open(schema_path, 'r', encoding='utf-8') as f:
        categories = json.load(f)
        
    print(f"🔄 Syncing {len(categories)} categories to Airtable (Base: {BASE_ID})...")
    
    existing_tables = get_existing_tables()
    print(f"📄 Found {len(existing_tables)} existing tables.")
    
    for cat in categories:
        name = cat.get('title')
        if not name: continue
        
        # Clean name matching
        clean_name = name[:50].replace("/", "-")
        
        if clean_name in existing_tables:
            print(f"👌 Table '{clean_name}' already exists. Skipping (Update logic TODO if needed).")
            # TODO: Check for new columns and add them?
        else:
            print(f"✨ Creating table for '{clean_name}'...")
            create_table(cat)
            time.sleep(1) # Rate limit 5/sec, be safe with 1/sec for creation

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--test", action="store_true", help="Use test schema")
    args = parser.parse_args()
    
    path = "data/kaspi_full_schema.json"
    if args.test:
        path = "data/kaspi_full_schema_test.json"
        
    full_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../', path)
    
    if os.path.exists(full_path):
        sync_schema(full_path)
    else:
        print(f"❌ Schema file not found: {full_path}")
