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
    
    print("🆕 Adding min_price column...")
    
    cmd = "ALTER TABLE products ADD COLUMN IF NOT EXISTS min_price NUMERIC;"
    cursor.execute(cmd)
    print(f"✅ Executed: {cmd}")
    
    cursor.close()
    conn.close()
    print("🎉 Schema updated successfully")
    
except Exception as e:
    print(f"❌ Error updating schema: {e}")
