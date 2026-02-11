import os
import sys
import psycopg2
from dotenv import load_dotenv

def main():
    # Using the same credentials as other add_* scripts
    DB_HOST = "127.0.0.1"
    DB_PORT = "54322"
    DB_NAME = "postgres"
    DB_USER = "postgres"
    DB_PASS = "postgres"

    try:
        print(f"🆕 Connecting to DB at {DB_HOST}:{DB_PORT}...")
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASS
        )
        conn.autocommit = True
        cursor = conn.cursor()
        
        print("🚀 Adding 'is_autonomous_mode' column to 'Parser.client_configs' table...")
        cmd = 'ALTER TABLE "Parser"."client_configs" ADD COLUMN IF NOT EXISTS "is_autonomous_mode" BOOLEAN DEFAULT FALSE;'
        cursor.execute(cmd)
        print(f"✅ Executed: {cmd}")
        
        cursor.close()
        conn.close()
        print("🎉 Schema updated successfully")
        
    except Exception as e:
        print(f"❌ Error updating schema: {e}")
        print("\nNote: If this is a remote Supabase instance, you may need to run the following SQL manually in the Dashboard:")
        print('ALTER TABLE "Parser"."client_configs" ADD COLUMN "is_autonomous_mode" BOOLEAN DEFAULT FALSE;')

if __name__ == "__main__":
    main()
