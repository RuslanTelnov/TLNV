import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv("moysklad-web/.env.local")
url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
supabase = create_client(url, key)

res = supabase.table("wb_search_results").select("*").order("updated_at", desc=True).limit(10).execute()

for p in res.data:
    print(f"ID: {p['id']} | Name: {p['name'][:20]} | Brand: '{p.get('brand')}'")
