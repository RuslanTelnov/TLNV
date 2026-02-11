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

def list_products():
    try:
        response = supabase.schema('Parser').table('wb_top_products').select("id, name, url, price").execute()
        products = response.data
        print(f"Found {len(products)} products:")
        for p in products:
            print(f"{p['id']}: {p['name']} - Current Price: {p['price']}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_products()
