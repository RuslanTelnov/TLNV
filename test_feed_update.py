
import os
import sys
import json
from supabase import create_client, Client
from dotenv import load_dotenv

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def run_test(target_id):
    load_dotenv("moysklad-web/.env.local")
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    
    supabase = create_client(url, key)
    
    print(f"1. Updating {target_id} -> is_in_feed=True")
    
    # 1. Fetch current specs
    resp = supabase.table("wb_search_results").select("specs").eq("id", target_id).single().execute()
    if not resp.data:
        print("Product not found!")
        return
        
    specs = resp.data['specs'] or {}
    specs['is_in_feed'] = True
    
    # 2. Update
    supabase.table("wb_search_results").update({
        "specs": specs,
        "kaspi_created": True
    }).eq("id", target_id).execute()
    
    print("   Update success.")
    
    # 3. Fetch back and verify readiness
    resp = supabase.table("wb_search_results").select("*").eq("id", target_id).single().execute()
    p = resp.data
    
    print("\n2. verifying Data for XML:")
    print(f"   SKU: {p['id']}-K")
    print(f"   Name: {p['name']}")
    print(f"   Description (len): {len(p.get('specs', {}).get('description') or p.get('description') or '')}")
    print(f"   Images: {p.get('specs', {}).get('image_urls') or [p.get('image_url')]}")
    print(f"   Price: {p.get('price_kzt')}")
    print(f"   In Feed: {p.get('specs', {}).get('is_in_feed')}")

if __name__ == "__main__":
    run_test(619295843)
