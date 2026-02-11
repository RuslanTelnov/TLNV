import os
import json
from dotenv import load_dotenv
from supabase import create_client, Client

# Load env
load_dotenv(os.path.join(os.getcwd(), "moysklad-automation", ".env"))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Supabase credentials not found.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def export_data():
    output_dir = "dashboard_export"
    os.makedirs(output_dir, exist_ok=True)
    
    print("Exporting 'products' table...")
    try:
        resp = supabase.schema('Parser').table('products').select("*").execute()
        with open(f"{output_dir}/products.json", "w", encoding="utf-8") as f:
            json.dump(resp.data, f, indent=2, ensure_ascii=False)
        print(f"Saved {len(resp.data)} records to products.json")
    except Exception as e:
        print(f"Error exporting products: {e}")

    print("Exporting 'wb_top_products' table...")
    try:
        resp = supabase.schema('Parser').table('wb_top_products').select("*").execute()
        with open(f"{output_dir}/wb_top_products.json", "w", encoding="utf-8") as f:
            json.dump(resp.data, f, indent=2, ensure_ascii=False)
        print(f"Saved {len(resp.data)} records to wb_top_products.json")
    except Exception as e:
        print(f"Error exporting wb_top_products: {e}")

if __name__ == "__main__":
    export_data()
