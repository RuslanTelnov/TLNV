import sys
import os
import json
import time

# Add project root to pythonpath
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'modules')))

from config import KASPI_API_TOKEN
from kaspi_api_client import KaspiApiClient

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

CATEGORIES_FILE = os.path.join(DATA_DIR, "kaspi_categories.json")

def main():
    print(f"initializing KaspiApiClient...")
    client = KaspiApiClient(KASPI_API_TOKEN)

    print("Fetching categories...")
    try:
        categories = client.get_categories()
        print(f"Received {len(categories)} categories.")
        
        with open(CATEGORIES_FILE, "w", encoding="utf-8") as f:
            json.dump(categories, f, indent=2, ensure_ascii=False)
            
        print(f"Saved categories to {CATEGORIES_FILE}")
        
    except Exception as e:
        print(f"Error fetching categories: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
