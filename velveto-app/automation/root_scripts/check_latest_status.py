
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv("moysklad-web/.env.local")

url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key = os.getenv("SUPABASE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

supabase = create_client(url, key)

response = supabase.schema('Parser').table('wb_search_results').select("id, name, conveyor_status, ms_created, updated_at").order("updated_at", desc=True).limit(5).execute()

for row in response.data:
    print(row)
