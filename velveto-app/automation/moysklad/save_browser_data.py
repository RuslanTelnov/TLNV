import os
import json
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL or SUPABASE_KEY not found")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

raw_data = [
  {
    "id": "200527396",
    "brand": "Conflate",
    "name": "Пивная кружка подарочная Викинг",
    "price": "834 ₽"
  },
  {
    "id": "114992813",
    "brand": "Good&Good",
    "name": "Кружка с двойными стенками дном",
    "price": "562 ₽"
  },
  {
    "id": "309265419",
    "brand": "EARLY BIRD",
    "name": "Кружка для чая и кофе милая эстетичная керамическая чашка",
    "price": "623 ₽"
  },
  {
    "id": "179790764",
    "brand": "CupCraft",
    "name": "Милая кружка для любимых с котиками люблю тебя",
    "price": "350 ₽"
  },
  {
    "id": "124019598",
    "brand": "molti",
    "name": "Кружка для чая кофе большая керамика 400 мл",
    "price": "643 ₽"
  }
]

def clean_price(price_str):
    return int(price_str.replace(" ₽", "").replace(" ", ""))

products = []
for item in raw_data:
    price = clean_price(item["price"])
    products.append({
        "id": int(item["id"]),
        "name": item["name"],
        "brand": item["brand"],
        "price": price,
        "sale_price_u": price, # Assuming the displayed price is the sale price
        "rating": 0, # Not extracted
        "feedbacks": 0, # Not extracted
        "delivery_date": "Завтра",
        "specs": {"Category": "Кружки (Browser Extracted)"},
        "url": f"https://www.wildberries.ru/catalog/{item['id']}/detail.aspx"
    })

print(f"Saving {len(products)} products to Supabase...")

try:
    # Clear existing data first to show only these new ones
    supabase.schema('Parser').table('wb_top_products').delete().neq("id", 0).execute()
    
    data = supabase.schema('Parser').table('wb_top_products').upsert(products).execute()
    print("Success!")
except Exception as e:
    print(f"Error saving to Supabase: {e}")
