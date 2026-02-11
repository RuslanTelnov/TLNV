import os
import psycopg2
from dotenv import load_dotenv

load_dotenv("moysklad-automation/.env")

# Try to get DB params from env
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = os.getenv("DB_PORT", "54322")
DB_NAME = os.getenv("DB_NAME", "postgres")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "postgres")

# Also check for DATABASE_URL
DATABASE_URL = os.getenv("DATABASE_URL")

def apply_sql(sql_file):
    print(f"Applying {sql_file}...")
    
    try:
        if DATABASE_URL:
            conn = psycopg2.connect(DATABASE_URL)
        else:
            conn = psycopg2.connect(
                host=DB_HOST,
                port=DB_PORT,
                dbname=DB_NAME,
                user=DB_USER,
                password=DB_PASS
            )
        conn.autocommit = True
        cur = conn.cursor()
        
        with open(sql_file, 'r') as f:
            sql_content = f.read()
            
        cur.execute(sql_content)
        print("✅ SQL executed successfully.")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ Error applying SQL: {e}")

if __name__ == "__main__":
    apply_sql("moysklad-automation/create_wb_search_table.sql")
