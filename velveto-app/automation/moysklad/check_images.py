import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

response = supabase.schema('Parser').table('wb_top_products').select("id, name, image_url, images").execute()

for product in response.data:
    has_main = bool(product.get('image_url'))
    images_count = len(product.get('images') or [])
    print(f"ID: {product['id']}, Main Image: {has_main}, Gallery Count: {images_count}")
    if not has_main and images_count > 0:
        print(f"  -> Needs fix: has gallery but no main image.")
