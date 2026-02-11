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
    
    print("🗑️  Truncating table products to remove duplicates...")
    cursor.execute("TRUNCATE TABLE products;")
    
    print("🆕 Adding unique constraint to products.article...")
    # Add unique constraint if not exists
    cursor.execute("""
        ALTER TABLE products 
        ADD CONSTRAINT products_article_key UNIQUE (article);
    """)
    
    print("✅ Constraint added successfully")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"❌ Error applying schema: {e}")
