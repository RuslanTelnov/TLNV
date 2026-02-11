import os
import json
from supabase import create_client, Client

# --- CONFIGURATION ---
# Enter your NEW database credentials here
NEW_SUPABASE_URL = "YOUR_NEW_SUPABASE_URL"
NEW_SUPABASE_KEY = "YOUR_NEW_SUPABASE_KEY"
# ---------------------

if NEW_SUPABASE_URL == "YOUR_NEW_SUPABASE_URL":
    print("⚠️  Please configure NEW_SUPABASE_URL and NEW_SUPABASE_KEY in the script first.")
    exit(1)

supabase: Client = create_client(NEW_SUPABASE_URL, NEW_SUPABASE_KEY)

FILES_TO_IMPORT = [
    {"file": "products_export.json", "table": "products"},
    {"file": "wb_search_results_export.json", "table": "wb_search_results"},
    {"file": "wb_top_products_export.json", "table": "wb_top_products"}
]

def import_table(file_path, table_name):
    print(f"📦 Importing '{table_name}' from {file_path}...")
    
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return

    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    if not data:
        print("⚠️  No data to import.")
        return

    # Batch insert to avoid limits
    batch_size = 100
    total = len(data)
    
    for i in range(0, total, batch_size):
        batch = data[i:i + batch_size]
        try:
            supabase.table(table_name).upsert(batch).execute()
            print(f"   Inserted {min(i + batch_size, total)}/{total} rows...")
        except Exception as e:
            print(f"❌ Error inserting batch {i}: {e}")

    print(f"✅ Finished importing {table_name}.")

if __name__ == "__main__":
    for item in FILES_TO_IMPORT:
        import_table(item["file"], item["table"])
    print("🎉 Migration complete!")
