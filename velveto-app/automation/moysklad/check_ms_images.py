import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

response = supabase.schema('Parser').table('products').select("id, name, image_url").limit(20).execute()

print(f"Checking first {len(response.data)} products:")
for product in response.data:
    has_image = bool(product.get('image_url'))
    print(f"ID: {product['id']}, Name: {product['name']}, Has Image: {has_image}")
