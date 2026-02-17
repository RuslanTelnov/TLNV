
import os
import sys
from supabase import create_client
from dotenv import load_dotenv

def run_sql(sql_file):
    # Load env
    load_dotenv('.env')
    load_dotenv('temp_tlnv_parser/velveto-app/.env.local')
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")
    
    if not url or not key:
        print("Missing Supabase credentials (Service Role Required)")
        return

    supabase = create_client(url, key)
    
    with open(sql_file, 'r') as f:
        sql = f.read()
        
    print(f"Executing SQL from {sql_file}...")
    try:
        # Using sql_query as expected by some existing migrations
        res = supabase.rpc('exec_sql', {'sql_query': sql}).execute()
        print("✅ Success!")
    except Exception as e:
        print("❌ Error:", e)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 run_sql.py <file.sql>")
    else:
        run_sql(sys.argv[1])
