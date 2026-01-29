
import os
import requests
from dotenv import load_dotenv

load_dotenv("moysklad-web/.env.local")
URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
KEY = os.environ.get("SUPABASE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

def add_constraint():
    sql = 'ALTER TABLE "Parser".products ADD CONSTRAINT products_moysklad_id_unique UNIQUE (moysklad_id);'
    rpc_url = f"{URL}/rest/v1/rpc/exec_sql"
    headers = {
        "apikey": KEY,
        "Authorization": f"Bearer {KEY}",
        "Content-Type": "application/json",
        "Accept-Profile": "Parser"
    }
    
    print("Fixing missing constraint in products table...")
    resp = requests.post(rpc_url, headers=headers, json={"sql": sql})
    print(f"Result: {resp.json()}")

if __name__ == "__main__":
    add_constraint()
