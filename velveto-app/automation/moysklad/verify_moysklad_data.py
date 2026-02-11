import os
import requests
import base64
from dotenv import load_dotenv

load_dotenv()
LOGIN = os.getenv("MOYSKLAD_LOGIN")
PASSWORD = os.getenv("MOYSKLAD_PASSWORD")
BASE_URL = "https://api.moysklad.ru/api/remap/1.2"

auth_str = f"{LOGIN}:{PASSWORD}"
auth_b64 = base64.b64encode(auth_str.encode()).decode()
HEADERS = {
    "Authorization": f"Basic {auth_b64}",
    "Content-Type": "application/json"
}

def verify_product(article):
    url = f"{BASE_URL}/entity/product?filter=article={article}&expand=supplier,images"
    resp = requests.get(url, headers=HEADERS)
    if resp.status_code != 200:
        print(f"❌ Failed to get product: {resp.status_code}")
        return

    rows = resp.json().get('rows', [])
    if not rows:
        print(f"❌ Product not found: {article}")
        return

    product = rows[0]
    print(f"✅ Product found: {product['name']}")

    # Check Cost Price (Price Type 'Себестоимость')
    sale_prices = product.get('salePrices', [])
    cost_price_found = False
    for sp in sale_prices:
        if sp['priceType']['name'] == 'Себестоимость':
            cost_price_found = True
            if sp['value'] == 260000: # 2600.00 * 100
                print(f"✅ Cost Price (Себестоимость) is correct: {sp['value']/100}")
            else:
                print(f"❌ Cost Price (Себестоимость) incorrect: {sp['value']}")
            break
    
    if not cost_price_found:
        print("❌ Cost Price (Себестоимость) not found in salePrices")

    # Check Supplier
    supplier = product.get('supplier')
    if supplier and supplier['name'] == 'ООО "Поставщик"':
        print(f"✅ Supplier is correct: {supplier['name']}")
    else:
        print(f"❌ Supplier incorrect: {supplier}")

    # Check Images
    images = product.get('images', {}).get('rows', [])
    if images:
        print(f"✅ Images found: {len(images)}")
        print(f"   Image URL: {images[0].get('miniature', {}).get('href')}")
    else:
        print(f"⚠️ No images found (Expected if file missing)")

if __name__ == "__main__":
    verify_product('123456')
