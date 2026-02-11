import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

# Using the same credentials as update_schema.py
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
    
    print("🆕 Adding currency column...")
    
    cmd = "ALTER TABLE wb_top_products ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'RUB';"
    cursor.execute(cmd)
    print(f"✅ Executed: {cmd}")
    
    cursor.close()
    conn.close()
    print("🎉 Schema updated successfully")
    
except Exception as e:
    print(f"❌ Error updating schema: {e}")
