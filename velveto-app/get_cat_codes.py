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

try:
    cats = client.get_categories()
    # Find something like "cups" or "saucers"
    results = [c for c in cats if 'cups' in c['code'].lower()]
    print(json.dumps(results, indent=2, ensure_ascii=False))
except Exception as e:
    print(f"Error: {e}")
