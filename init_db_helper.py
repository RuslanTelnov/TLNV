import os
from supabase import create_client
from dotenv import load_dotenv

def initialize_db():
    # Try different env files
    env_files = ['.env', 'temp_tlnv_parser/velveto-app/.env.local', 'kaspi-dashboard/.env']
    for env_file in env_files:
        if os.path.exists(env_file):
            load_dotenv(env_file)
    
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")
    
    if not url or not key:
        print("❌ Error: Missing Supabase credentials")
        return

    print(f"Connecting to {url}...")
    supabase = create_client(url, key)
    
    # SQL to create exec_sql function
    # We use a POST request manually if rpc('exec_sql') doesn't exist yet, 
    # but wait - there's no way to run arbitrary SQL via the standard Supabase client 
    # WITHOUT an existing function.
    
    # However, sometimes the 'postgres' schema might have useful functions.
    # If we really don't have ANY way to run raw SQL, we might be stuck.
    
    # Let's try to see if we can use the 'query' method if using a different client or raw requests.
    import requests
    
    sql_init = """
    CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql_query;
    END;
    $$;
    """
    
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json"
    }
    
    # Standard PostgREST 
    # We can't run raw SQL via PostgREST directly. 
    # Usually, developers use the Supabase Dashboard to run this first.
    
    print("⚠️  Warning: Direct SQL execution via HTTP is usually disabled for security.")
    print("If this fails, you MUST run the following in Supabase SQL Editor manually:")
    print(sql_init)
    
    # Try rpc call just in case it had a different name
    try:
        res = supabase.rpc('exec_sql', {'sql_query': sql_init}).execute()
        print("✅ exec_sql created/updated via existing rpc.")
    except Exception as e:
        print(f"❌ Failed to create exec_sql via rpc: {e}")

if __name__ == "__main__":
    initialize_db()
