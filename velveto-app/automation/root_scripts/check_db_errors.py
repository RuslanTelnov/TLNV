
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv("moysklad-web/.env.local")

url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key = os.getenv("SUPABASE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not url:
    print("No URL")
    exit()

supabase = create_client(url, key)

response = supabase.schema('Parser').table('wb_search_results').select("id, name, conveyor_status, conveyor_log").eq("conveyor_status", "error").limit(5).execute()

for row in response.data:
    print(f"ID: {row['id']} | Status: {row['conveyor_status']} | Log: {row['conveyor_log']}")
