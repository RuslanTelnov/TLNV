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
category_code = "Master - Cups and saucers sets"

try:
    attrs = client.get_attributes(category_code)
    for attr in attrs:
        if attr['code'] in ["Toys*Color", "Toys*Material", "Stuffed toys*Type", "Stuffed toys*Filler", "Stuffed toys*View"]:
            val_info = ""
            if attr['type'] == 'enum':
                values = client.get_attribute_values(category_code, attr['code'])
                val_info = f" | Allowed: {[v['code'] for v in values]}"
            print(f"{attr['code']}: multiValued={attr['multiValued']}, mandatory={attr['mandatory']}{val_info}")
except Exception as e:
    print(f"Error: {e}")
