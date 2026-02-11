
import os
import sys
from supabase import create_client
from dotenv import load_dotenv

def run_sql(sql_file):
    # Load env
    load_dotenv('temp_tlnv_parser/velveto-app/.env.local')
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    
    if not url or not key:
        print("Missing Supabase credentials")
        return

    supabase = create_client(url, key)
    
    with open(sql_file, 'r') as f:
        sql = f.read()
        
    print(f"Executing SQL from {sql_file}...")
    try:
        # Assuming we have an 'exec_sql' RPC function as per previous context
        res = supabase.rpc('exec_sql', {'sql': sql}).execute()
        print("Success:", res)
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 run_sql.py <file.sql>")
    else:
        run_sql(sys.argv[1])
