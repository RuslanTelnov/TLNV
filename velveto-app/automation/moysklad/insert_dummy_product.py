import os
from dotenv import load_dotenv
from supabase import create_client
import time

load_dotenv()
url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_KEY')
supabase = create_client(url, key)

dummy_product = {
    "id": 123456789,
    "position": 1,
    "name": "Test Modal Product",
    "brand": "TestBrand",
    "price_kzt": 5000,
    "in_stock": True,
    "image_url": "https://via.placeholder.com/150",
    "product_url": "https://www.wildberries.ru/catalog/0/detail.aspx",
    "specs": {"description": "Test product for modal verification"},
    "delivery_days": 3,
    "query": "test_modal",
    "rating": 5.0,
    "feedbacks": 100
}

try:
    supabase.schema('Parser').table('wb_search_results').upsert(dummy_product).execute()
    print("Dummy product inserted successfully.")
except Exception as e:
    print(f"Error inserting dummy product: {e}")
