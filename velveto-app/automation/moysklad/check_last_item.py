import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv("moysklad-automation/.env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

response = supabase.schema('Parser').table('wb_search_results').select("*").order("updated_at", desc=True).limit(1).execute()
print(response.data)
