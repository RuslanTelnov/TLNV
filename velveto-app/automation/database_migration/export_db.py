import os
import json
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv("moysklad-automation/.env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL or SUPABASE_KEY not found")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

TABLES = ["products", "wb_search_results", "wb_top_products"]

def export_table(table_name):
    print(f"📦 Exporting table '{table_name}'...")
    all_rows = []
    offset = 0
    limit = 1000
    
    while True:
        try:
            response = supabase.table(table_name).select("*").range(offset, offset + limit - 1).execute()
            rows = response.data
            if not rows:
                break
            all_rows.extend(rows)
            offset += limit
            print(f"   Fetched {len(all_rows)} rows...")
        except Exception as e:
            print(f"❌ Error fetching {table_name}: {e}")
            break
            
    filename = f"moysklad-automation/{table_name}_export.json"
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(all_rows, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Exported {len(all_rows)} rows to {filename}")

if __name__ == "__main__":
    for table in TABLES:
        export_table(table)
    print("🎉 All exports complete.")
