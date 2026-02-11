import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL or SUPABASE_KEY not found")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# SQL to add column if not exists
sql = """
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wb_top_products' AND column_name = 'image_url') THEN
        ALTER TABLE wb_top_products ADD COLUMN image_url TEXT;
    END IF;
END $$;
"""

# Since we can't run raw SQL easily via this client without rpc, we'll try a direct connection or just use the python client to update one row and see if it fails, 
# OR better: use psycopg2 which we know works.

import psycopg2

# Default local supabase connection string
DB_URL = "postgresql://postgres:postgres@127.0.0.1:54322/postgres"

try:
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    cur.execute("ALTER TABLE wb_top_products ADD COLUMN IF NOT EXISTS image_url TEXT;")
    conn.commit()
    cur.close()
    conn.close()
    print("Successfully added image_url column.")
except Exception as e:
    print(f"Error adding column: {e}")
