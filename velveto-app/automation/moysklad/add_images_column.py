import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

# Default local supabase connection string
DB_URL = "postgresql://postgres:postgres@127.0.0.1:54322/postgres"

try:
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    # Add images column as JSONB to store array of URLs
    cur.execute("ALTER TABLE wb_top_products ADD COLUMN IF NOT EXISTS images JSONB;")
    conn.commit()
    cur.close()
    conn.close()
    print("Successfully added 'images' column.")
except Exception as e:
    print(f"Error adding column: {e}")
