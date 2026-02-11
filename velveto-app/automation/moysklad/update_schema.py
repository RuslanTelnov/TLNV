import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DB_HOST = "127.0.0.1"
DB_PORT = "54322"
DB_NAME = "postgres"
DB_USER = "postgres"
DB_PASS = "postgres"

try:
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASS
    )
    conn.autocommit = True
    cursor = conn.cursor()
    
    print("🆕 Updating schema...")
    
    # Add columns if they don't exist
    commands = [
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier TEXT;",
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price NUMERIC;",
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;"
    ]
    
    for cmd in commands:
        cursor.execute(cmd)
        print(f"✅ Executed: {cmd}")
    
    cursor.close()
    conn.close()
    print("🎉 Schema updated successfully")
    
except Exception as e:
    print(f"❌ Error updating schema: {e}")
