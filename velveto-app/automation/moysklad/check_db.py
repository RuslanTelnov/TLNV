import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv("moysklad-automation/.env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL or SUPABASE_KEY not found")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

try:
    # Try to select from the table
    response = supabase.schema('Parser').table('wb_search_results').select("id").limit(1).execute()
    print("✅ Table 'wb_search_results' exists and is accessible.")
except Exception as e:
    print(f"❌ Error accessing table: {e}")
    # Check if it's a "relation does not exist" error
    if "relation" in str(e) and "does not exist" in str(e):
        print("Table does not exist.")
    else:
        print("Unknown error.")
