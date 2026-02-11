import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv("moysklad-web/.env.local")
url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key = os.getenv("SUPABASE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not url:
    print("Error: SUPABASE_URL not found")
    exit(1)

supabase = create_client(url, key)

res = supabase.schema('Parser').table('wb_search_results').select("in_stock").limit(1).execute()
if res.data:
    val = res.data[0]['in_stock']
    print(f"Value: {val}, Type: {type(val)}")
else:
    print("No data")
