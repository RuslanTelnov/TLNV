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

# Data extracted by browser subagent
images_data = [
  {
    "id": 200527396,
    "images": [
      "https://alm-basket-cdn-03.geobasket.net/vol2005/part200527/200527396/images/big/1.webp",
      "https://alm-basket-cdn-03.geobasket.net/vol2005/part200527/200527396/images/big/2.webp",
      "https://alm-basket-cdn-03.geobasket.net/vol2005/part200527/200527396/images/big/3.webp",
      "https://alm-basket-cdn-03.geobasket.net/vol2005/part200527/200527396/images/big/4.webp",
      "https://alm-basket-cdn-03.geobasket.net/vol2005/part200527/200527396/images/big/5.webp",
      "https://alm-basket-cdn-03.geobasket.net/vol2005/part200527/200527396/images/big/6.webp",
      "https://alm-basket-cdn-03.geobasket.net/vol2005/part200527/200527396/images/big/7.webp",
      "https://alm-basket-cdn-03.geobasket.net/vol2005/part200527/200527396/images/big/8.webp",
      "https://alm-basket-cdn-03.geobasket.net/vol2005/part200527/200527396/images/big/9.webp",
      "https://alm-basket-cdn-03.geobasket.net/vol2005/part200527/200527396/images/big/10.webp",
      "https://alm-basket-cdn-03.geobasket.net/vol2005/part200527/200527396/images/big/11.webp",
      "https://alm-basket-cdn-03.geobasket.net/vol2005/part200527/200527396/images/big/12.webp",
      "https://alm-basket-cdn-03.geobasket.net/vol2005/part200527/200527396/images/big/13.webp",
      "https://alm-basket-cdn-03.geobasket.net/vol2005/part200527/200527396/images/big/14.webp",
      "https://alm-basket-cdn-03.geobasket.net/vol2005/part200527/200527396/images/big/15.webp"
    ]
  },
  {
    "id": 114992813,
    "images": [
      "https://alm-basket-cdn-05.geobasket.net/vol1149/part114992/114992813/images/big/1.webp",
      "https://alm-basket-cdn-05.geobasket.net/vol1149/part114992/114992813/images/big/2.webp",
      "https://alm-basket-cdn-05.geobasket.net/vol1149/part114992/114992813/images/big/3.webp",
      "https://alm-basket-cdn-05.geobasket.net/vol1149/part114992/114992813/images/big/4.webp",
      "https://alm-basket-cdn-05.geobasket.net/vol1149/part114992/114992813/images/big/5.webp",
      "https://alm-basket-cdn-05.geobasket.net/vol1149/part114992/114992813/images/big/6.webp",
      "https://alm-basket-cdn-05.geobasket.net/vol1149/part114992/114992813/images/big/7.webp",
      "https://alm-basket-cdn-05.geobasket.net/vol1149/part114992/114992813/images/big/8.webp",
      "https://alm-basket-cdn-05.geobasket.net/vol1149/part114992/114992813/images/big/9.webp"
    ]
  },
  {
    "id": 309265419,
    "images": [
      "https://alm-basket-cdn-01.geobasket.net/vol3092/part309265/309265419/images/big/1.webp",
      "https://alm-basket-cdn-01.geobasket.net/vol3092/part309265/309265419/images/big/2.webp",
      "https://alm-basket-cdn-01.geobasket.net/vol3092/part309265/309265419/images/big/3.webp",
      "https://alm-basket-cdn-01.geobasket.net/vol3092/part309265/309265419/images/big/4.webp",
      "https://alm-basket-cdn-01.geobasket.net/vol3092/part309265/309265419/images/big/5.webp",
      "https://alm-basket-cdn-01.geobasket.net/vol3092/part309265/309265419/images/big/6.webp",
      "https://alm-basket-cdn-01.geobasket.net/vol3092/part309265/309265419/images/big/7.webp",
      "https://alm-basket-cdn-01.geobasket.net/vol3092/part309265/309265419/images/big/8.webp",
      "https://alm-basket-cdn-01.geobasket.net/vol3092/part309265/309265419/images/big/9.webp",
      "https://alm-basket-cdn-01.geobasket.net/vol3092/part309265/309265419/images/big/10.webp",
      "https://alm-basket-cdn-01.geobasket.net/vol3092/part309265/309265419/images/big/11.webp"
    ]
  },
  {
    "id": 179790764,
    "images": [
      "https://alm-basket-cdn-01.geobasket.net/vol1797/part179790/179790764/images/big/1.webp",
      "https://alm-basket-cdn-01.geobasket.net/vol1797/part179790/179790764/images/big/2.webp",
      "https://alm-basket-cdn-01.geobasket.net/vol1797/part179790/179790764/images/big/3.webp",
      "https://alm-basket-cdn-01.geobasket.net/vol1797/part179790/179790764/images/big/4.webp",
      "https://alm-basket-cdn-01.geobasket.net/vol1797/part179790/179790764/images/big/5.webp"
    ]
  },
  {
    "id": 124019598,
    "images": [
      "https://alm-basket-cdn-05.geobasket.net/vol1240/part124019/124019598/images/big/1.webp",
      "https://alm-basket-cdn-05.geobasket.net/vol1240/part124019/124019598/images/big/2.webp",
      "https://alm-basket-cdn-05.geobasket.net/vol1240/part124019/124019598/images/big/3.webp",
      "https://alm-basket-cdn-05.geobasket.net/vol1240/part124019/124019598/images/big/4.webp",
      "https://alm-basket-cdn-05.geobasket.net/vol1240/part124019/124019598/images/big/5.webp",
      "https://alm-basket-cdn-05.geobasket.net/vol1240/part124019/124019598/images/big/6.webp"
    ]
  }
]

print(f"Updating images for {len(images_data)} products...")

for item in images_data:
    try:
        # Update only the images column for the specific product ID
        data = supabase.schema('Parser').table('wb_top_products').update({"images": item["images"]}).eq("id", item["id"]).execute()
        print(f"Updated product {item['id']}")
    except Exception as e:
        print(f"Error updating product {item['id']}: {e}")

print("Done!")
