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

client = KaspiApiClient(token)
category_code = "Master - Stuffed toys"

try:
    attrs = client.get_attributes(category_code)
    for attr in attrs:
        if 'Brand' in attr['code']:
            print(json.dumps(attr, indent=2, ensure_ascii=False))
except Exception as e:
    print(f"Error: {e}")
