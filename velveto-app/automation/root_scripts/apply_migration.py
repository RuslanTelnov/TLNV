import os
import psycopg2
from dotenv import load_dotenv

load_dotenv("moysklad-web/.env.local")

# DB Connection - Supabase usually exposes port 6543 or 5432 for pooler/direct
# Using direct connection string if available in env, or constructing it
db_url = os.environ.get("DATABASE_URL")
# If not in local env, try to guess or use default local mapping
# For this environment, user seems to have ssh access to postgres@localhost?
# But `ssh` failed.
# Let's try standard connection.

if not db_url:
    # Try localhost default
    db_url = "postgresql://postgres:postgres@localhost:54322/postgres"

print(f"Connecting to DB...")
try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    with open("database_migration/add_conveyor_columns.sql", "r") as f:
        sql = f.read()
        print("Executing SQL...")
        cur.execute(sql)
        conn.commit()
        print("Migration successful.")
        
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
