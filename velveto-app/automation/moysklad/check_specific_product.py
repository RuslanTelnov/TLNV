import os
from dotenv import load_dotenv
from supabase import create_client, Client
import json

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL or SUPABASE_KEY not found")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def check_product():
    nm_id = 124019598
    
    try:
        response = supabase.schema('Parser').table('wb_top_products').select("*").eq("id", nm_id).execute()
        if response.data:
            print(json.dumps(response.data[0], indent=2, ensure_ascii=False))
        else:
            print(f"Product {nm_id} not found in database.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_product()
