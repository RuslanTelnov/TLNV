import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv(os.path.join(os.getcwd(), "moysklad-automation", ".env"))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

name = "Дорожный горшок Becute, розовый"
print(f"Checking image_url for: {name}")

response = supabase.schema('Parser').table('products').select("id, name, image_url").eq("name", name).execute()

for product in response.data:
    print(f"ID: {product['id']}")
    print(f"Image URL: {product.get('image_url')}")
