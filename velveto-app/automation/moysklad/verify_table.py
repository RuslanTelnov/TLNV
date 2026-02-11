import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

try:
    res = supabase.schema('Parser').table('wb_top_products').select("*").limit(1).execute()
    print("Table exists!")
    print(res)
except Exception as e:
    print(f"Table check failed: {e}")
