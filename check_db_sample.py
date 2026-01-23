
import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def check_data():
    load_dotenv("moysklad-web/.env.local")
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    
    if not url or not key:
        print("No Supabase credentials")
        return

    supabase = create_client(url, key)
    
    # Get recent products
    response = supabase.table("wb_search_results").select("id,name").order("updated_at", desc=True).limit(5).execute()
    if response.data:
        print("Recent items (ID - Name):")
        for p in response.data:
            print(f"{p['id']} - {p['name']}")
    else:
        print("No data found")

if __name__ == "__main__":
    check_data()
