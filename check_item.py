from dotenv import load_dotenv
import os
from supabase import create_client

load_dotenv("moysklad-web/.env.local")
url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_KEY")
supabase = create_client(url, key)

id = 18791282

res = supabase.table("wb_search_results").select("*").eq("id", id).execute()
if res.data:
    p = res.data[0]
    print(f"Product: {p['name']}")
    print(f"Conveyor Status: {p.get('conveyor_status')}")
    print(f"MS Created: {p.get('ms_created')}")
    print(f"Stock Added: {p.get('stock_added')}")
    print(f"Kaspi Created: {p.get('kaspi_created')}")
    print(f"Updated At: {p.get('updated_at')}")
    print(f"Log: {p.get('conveyor_log')}")
else:
    print("Product not found")
