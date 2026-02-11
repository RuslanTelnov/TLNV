import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv("moysklad-web/.env.local")
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_product(nm_id):
    res = supabase.schema('Parser').table('wb_search_results').select("*").eq("id", nm_id).execute()
    if res.data:
        print(json.dumps(res.data[0], indent=2, ensure_ascii=False))
    else:
        print("Not found")

if __name__ == "__main__":
    import json
    import sys
    get_product(sys.argv[1])
