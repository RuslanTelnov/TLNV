
import sys
import os
import json
import requests
from supabase import create_client
from dotenv import load_dotenv

# Ensure we can import from local modules
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

from modules.category_mapper import KaspiCategoryMapper
import config

def fix_categories(article_ids):
    # Init Supabase
    load_dotenv(os.path.join(current_dir, '..', '..', '.env.local'))
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    supabase = create_client(url, key)

    print(f"Checking articles: {article_ids}")
    
    # helper for update
    def update_product(p_id, name, desc):
        print(f"\nProcessing {name} (ID: {p_id})")
        cat_name, cat_type = KaspiCategoryMapper.detect_category(name, desc or "")
        
        if cat_name:
            print(f"✅ New Category: {cat_name} ({cat_type})")
            
            # Generate expected attributes
            attrs = KaspiCategoryMapper.generate_attributes(name, desc or "", cat_type, cat_name)
            print(f"   Attrs: {json.dumps(attrs, indent=2, ensure_ascii=False)}")
            
            # Update DB
            # Fetch current specs
            current = supabase.schema('Parser').table('wb_search_results').select('specs').eq('id', p_id).execute()
            specs = current.data[0].get('specs', {}) or {}
            
            specs['category_code'] = cat_name
            specs['category_type'] = cat_type
            specs['kaspi_attributes'] = attrs
            specs['kaspi_created'] = False # Force retry
            
            data = {
                "kaspi_status": "pending", 
                "kaspi_created": False,
                "specs": specs
            }
            try:
                supabase.schema('Parser').table('wb_search_results').update(data).eq("id", p_id).execute()
                print("💾 Updated DB to retry creation.")
            except Exception as e:
                print(f"❌ DB Update failed: {e}")
                
        else:
            print("⚠️ Still could not detect category!")

    # Fetch
    try:
        resp = supabase.schema('Parser').table('wb_search_results').select("*").in_("id", article_ids).execute()
        for p in resp.data:
            update_product(p['id'], p['name'], p.get('description'))
            
    except Exception as e:
        print(f"Error fetching: {e}")

if __name__ == "__main__":
    ids = [529158934, 437302729]
    fix_categories(ids)
