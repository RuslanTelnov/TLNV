import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

try:
    # Check product 179790764
    response = supabase.schema('Parser').table('wb_top_products').select("*").eq("id", 179790764).execute()
    if response.data:
        print("Product found:", response.data[0])
    else:
        print("Product 179790764 not found in DB.")
except Exception as e:
    print(f"Error: {e}")
