
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load env vars
load_dotenv("/home/wik/wb-kaspi-dashboard/moysklad-web/.env.local")

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not url or not key:
    print(f"Error: Supabase credentials not found. URL: {url}, Key: {'FOUND' if key else 'MISSING'}")
    exit(1)

supabase: Client = create_client(url, key)

tables_to_check = ["products", "wb_top_products", "wb_search_results"]

for table in tables_to_check:
    print(f"\nChecking '{table}' table...")
    try:
        res = supabase.table(table).select("count", count="exact").limit(1).execute()
        print(f"✅ '{table}' table exists. Count: {res.count}")
    except Exception as e:
        print(f"❌ '{table}' table error: {e}")
