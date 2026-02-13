import os
import sys
import json
from dotenv import load_dotenv

# Add paths
sys.path.append(os.path.join(os.getcwd(), 'automation/kaspi'))
from modules.kaspi_api_client import KaspiApiClient
import config

load_dotenv('moysklad-web/.env.local')
token = config.KASPI_API_TOKEN or os.getenv("KASPI_API_TOKEN") or os.getenv("KASPI_TOKEN")

if not token:
    print("❌ Token not found!")
    sys.exit(1)

client = KaspiApiClient(token)
category_code = "Master - Board games"

print(f"Fetching attributes for category: {category_code}")
try:
    attrs = client.get_attributes(category_code)
    for attr in attrs:
        if attr['mandatory']:
            print(f"\n--- {attr['code']} ---")
            print(f"Type: {attr['type']}")
            if attr['type'] == 'enum':
                values = client.get_attribute_values(category_code, attr['code'])
                print(f"Allowed Values: {values}")
except Exception as e:
    print(f"Error: {e}")
