
import os
import json
from supabase import create_client
from dotenv import load_dotenv

# Load env from .env.local
load_dotenv('moysklad-web/.env.local')

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not url or not key:
    print("Error: Missing Supabase credentials")
    exit(1)

supabase = create_client(url, key)

ids = [376504161, 8143657, 567235635, 207249566]

print(f"Checking {len(ids)} ids: {ids}")
try:
    resp = supabase.table('wb_search_results').select('id, name, specs').in_('id', ids).execute()
    
    if resp.data:
        print(f"Found {len(resp.data)} products.")
        for p in resp.data:
            print(f"\n--- Product {p['id']} ({p['name']}) ---")
            specs = p.get('specs') or {}
            print(f"Status: {specs.get('kaspi_upload_status')}")
            if specs:
                print("Specs (Kaspi Data):")
                print(json.dumps(specs, indent=2, ensure_ascii=False))
            else:
                print("Specs: None")
    else:
        print("No products found.")
        
except Exception as e:
    print(f"Error: {e}")
