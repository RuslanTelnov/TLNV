import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    # Try loading from moysklad-web/.env.local
    load_dotenv("moysklad-web/.env.local")
    SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def check_columns():
    # We can't directly get columns via SDK easily without psql, 
    # but we can try to fetch one row and see the keys.
    try:
        res = supabase.schema('Parser').table('wb_search_results').select("*").limit(1).execute()
        if res.data:
            print("Columns in wb_search_results:")
            for key in res.data[0].keys():
                print(f"- {key}")
        else:
            print("No data in wb_search_results to infer columns.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_columns()
