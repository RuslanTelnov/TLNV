import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def check_dates():
    res = supabase.schema('Parser').table('products').select("name, created_at").order("created_at", desc=True).limit(10).execute()
    for p in res.data:
        print(f"{p['created_at']} - {p['name']}")

if __name__ == "__main__":
    check_dates()
