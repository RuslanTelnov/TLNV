from dotenv import load_dotenv
import os
import json
from supabase import create_client

load_dotenv("moysklad-web/.env.local")
url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_KEY")
supabase = create_client(url, key)

# Fetch items that are marked as created in Kaspi
res = supabase.table("wb_search_results") \
    .select("id, name, specs, kaspi_created") \
    .eq("kaspi_created", True) \
    .order("updated_at", desc=True) \
    .limit(5) \
    .execute()

if res.data:
    print(f"Found {len(res.data)} created items.")
    for p in res.data:
        sku = "N/A"
        if p.get('specs'):
            sku = p['specs'].get('kaspi_sku', 'N/A')
        print(f"ID: {p['id']} | SKU: {sku} | Name: {p['name']}")
else:
    print("No items found with kaspi_created=True")
