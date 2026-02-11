import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL or SUPABASE_KEY not found")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

try:
    # Fetch one row to see keys
    response = supabase.schema('Parser').table('wb_top_products').select("*").limit(1).execute()
    if response.data:
        print("Columns found:", response.data[0].keys())
    else:
        print("Table is empty, cannot infer columns easily via select.")
except Exception as e:
    print(f"Error: {e}")
