import os
import requests
import json
import base64
import subprocess
import re
from dotenv import load_dotenv

# Load env
load_dotenv(os.path.join(os.getcwd(), "moysklad-automation", ".env"))
load_dotenv(os.path.join(os.getcwd(), "ozon-automation", ".env.ozon"))

# MoySklad Settings
MS_LOGIN = os.getenv("MOYSKLAD_LOGIN")
MS_PASSWORD = os.getenv("MOYSKLAD_PASSWORD")
MS_AUTH = base64.b64encode(f"{MS_LOGIN}:{MS_PASSWORD}".encode()).decode()
MS_HEADERS = {"Authorization": f"Basic {MS_AUTH}", "Content-Type": "application/json"}

# Ozon Settings
OZON_CLIENT_ID = os.getenv('OZON_CLIENT_ID')
OZON_API_KEY = os.getenv('OZON_API_KEY')
IMGBB_API_KEY = os.getenv('IMGBB_API_KEY')
OZON_HEADERS = {
    'Client-Id': OZON_CLIENT_ID,
    'Api-Key': OZON_API_KEY,
    'Content-Type': 'application/json'
}

def upload_to_imgbb(content, filename):
    """Upload image content to imgbb.com"""
    print(f"☁️ Uploading {filename} to ImgBB...")
    try:
        url = "https://api.imgbb.com/1/upload"
        payload = {
            "key": IMGBB_API_KEY,
        }
        files = {
            "image": (filename, content)
        }
        response = requests.post(url, data=payload, files=files)
        if response.status_code == 200:
            data = response.json()
            url = data['data']['url']
            print(f"✅ Public URL: {url}")
            return url
        else:
            print(f"❌ ImgBB error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ ImgBB exception: {e}")
    return None

def fetch_kaspi_data(sku):
    """Fetch product data from Kaspi using playwright script"""
    print(f"🔍 Searching in Kaspi for SKU: {sku}...")
    try:
        cmd = ["python3", "utils/fetch_kaspi_product.py", sku]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            data = json.loads(result.stdout)
            if "error" not in data:
                return data
            else:
                print(f"⚠️ Kaspi error: {data['error']}")
        else:
            print(f"❌ Kaspi script failed: {result.stderr}")
    except Exception as e:
        print(f"❌ Kaspi fetch exception: {e}")
    return None

def create_card_by_article(article):
    print(f"🚀 Starting process for article: {article}")
    
    # 1. Search in MoySklad (for basic info like weight, price)
    url = "https://api.moysklad.ru/api/remap/1.2/entity/product"
    params = {"filter": f"article={article}"}
    resp = requests.get(url, headers=MS_HEADERS, params=params)
    
    ms_product = None
    if resp.status_code == 200 and resp.json().get('rows'):
        ms_product = resp.json()['rows'][0]
        print(f"📦 Found in MS: {ms_product['name']}")

    # 2. Search in Kaspi (for images and better title)
    kaspi_data = fetch_kaspi_data(article)
    
    image_urls = []
    if kaspi_data and kaspi_data.get('images'):
        print(f"🖼️ Found {len(kaspi_data['images'])} images in Kaspi.")
        for i, img_url in enumerate(kaspi_data['images']):
            try:
                img_resp = requests.get(img_url)
                if img_resp.status_code == 200:
                    uploaded_url = upload_to_imgbb(img_resp.content, f"{article}_{i}.jpg")
                    if uploaded_url:
                        image_urls.append(uploaded_url)
            except Exception as e:
                print(f"⚠️ Failed to process Kaspi image {i}: {e}")

    # Fallback to MS image if Kaspi failed or returned no images
    if not image_urls and ms_product:
        print("🔄 Falling back to MoySklad image...")
        params_img = {"expand": "images"}
        resp_img = requests.get(f"{url}/{ms_product['id']}", headers=MS_HEADERS, params=params_img)
        if resp_img.status_code == 200:
            product_with_imgs = resp_img.json()
            if product_with_imgs.get('images', {}).get('meta', {}).get('size', 0) > 0:
                img_meta_url = product_with_imgs['images']['meta']['href']
                img_list_resp = requests.get(img_meta_url, headers=MS_HEADERS)
                if img_list_resp.status_code == 200 and img_list_resp.json().get('rows'):
                    for i, img_row in enumerate(img_list_resp.json()['rows']):
                        content_resp = requests.get(img_row['meta']['downloadHref'], headers=MS_HEADERS)
                        if content_resp.status_code == 200:
                            uploaded_url = upload_to_imgbb(content_resp.content, img_row['filename'])
                            if uploaded_url:
                                image_urls.append(uploaded_url)

    if not image_urls:
        print("⚠️ No images found. Using placeholder.")
        image_urls = ["https://files.catbox.moe/rz3oby.jpg"]

    # 3. Prepare Ozon Payload
    # Use Kaspi title if available, otherwise MS title
    final_name = kaspi_data['title'] if kaspi_data else (ms_product['name'] if ms_product else f"Товар {article}")
    
    # Basic info from MS or defaults
    price = str(ms_product.get('salePrices', [{}])[0].get('value', 0) / 100) if ms_product else "1000"
    weight = int(ms_product.get('weight', 0) * 1000) if ms_product else 100
    
    # Category detection (simple keyword based)
    cat_id = 17028998 # Default: Зажигалки
    type_id = 96463
    
    if "рюкзак" in final_name.lower():
        cat_id = 17027904
        type_id = 115945533
    elif "игрушка" in final_name.lower():
        cat_id = 17028973
        type_id = 92851
    elif "горшок" in final_name.lower():
        cat_id = 17028684
        type_id = 94472
    elif "косметичка" in final_name.lower():
        cat_id = 17027904
        type_id = 93337
    elif "зонт" in final_name.lower():
        cat_id = 17027904
        type_id = 93352
    elif "балаклава" in final_name.lower():
        cat_id = 41777465
        type_id = 97199

    # Attributes (simplified for now, using research from previous steps)
    attributes = [
        {"complex_id": 0, "id": 8229, "values": [{"dictionary_value_id": type_id, "value": "Зажигалка" if type_id == 96463 else ("Рюкзак" if type_id == 115945533 else ("Косметичка" if type_id == 93337 else ("Зонт" if type_id == 93352 else "Балаклава")))}]},
        {"complex_id": 0, "id": 85, "values": [{"dictionary_value_id": 5061932, "value": "T-Design"}]},
        {"complex_id": 0, "id": 9048, "values": [{"value": final_name[:50]}]},
    ]
    
    # Add TN VED if known
    if type_id == 96463: # Зажигалка
        attributes.append({"complex_id": 0, "id": 22232, "values": [{"dictionary_value_id": 971400807, "value": "9613800000 - Прочие зажигалки"}]})
        attributes.append({"complex_id": 0, "id": 9782, "values": [{"dictionary_value_id": 970661099, "value": "Не опасен"}]})
    elif type_id == 115945533: # Рюкзак
        attributes.append({"complex_id": 0, "id": 22232, "values": [{"dictionary_value_id": 971398077, "value": "4202929100 - Сумки дорожные..."}]})
        attributes.append({"complex_id": 0, "id": 9163, "values": [{"dictionary_value_id": 22882, "value": "Девочки"}]})
    elif type_id == 93337: # Косметичка
        attributes.append({"complex_id": 0, "id": 22232, "values": [{"dictionary_value_id": 971398077, "value": "4202929100 - Сумки дорожные..."}]})
        attributes.append({"complex_id": 0, "id": 9163, "values": [{"dictionary_value_id": 22881, "value": "Женский"}]})
    elif type_id == 93352: # Зонт
        attributes.append({"complex_id": 0, "id": 22232, "values": [{"dictionary_value_id": 971398860, "value": "6601910000 - Прочие зонты..."}]})
        attributes.append({"complex_id": 0, "id": 9163, "values": [{"dictionary_value_id": 22880, "value": "Унисекс"}]})
    elif type_id == 97199: # Балаклава
        attributes.append({"complex_id": 0, "id": 22232, "values": [{"dictionary_value_id": 971398849, "value": "6505009000 - Шляпы и прочие головные уборы..."}]})
        attributes.append({"complex_id": 0, "id": 9163, "values": [{"dictionary_value_id": 22880, "value": "Мужской"}]})
        attributes.append({"complex_id": 0, "id": 4295, "values": [{"dictionary_value_id": 35646, "value": "универсальный"}]})
        attributes.append({"complex_id": 0, "id": 10096, "values": [{"dictionary_value_id": 61574, "value": "черный"}]})
        attributes.append({"complex_id": 0, "id": 31, "values": [{"dictionary_value_id": 5061932, "value": "T-Design"}]})
        attributes.append({"complex_id": 0, "id": 8292, "values": [{"value": article}]}) # Объединить на одной карточке

    item = {
        "attributes": attributes,
        "barcode": article,
        "description_category_id": cat_id,
        "type_id": type_id,
        "name": final_name,
        "offer_id": f"{article}_ozon",
        "price": price,
        "vat": "0",
        "weight": weight if weight > 0 else 100,
        "weight_unit": "g",
        "width": 100,
        "height": 150,
        "depth": 50,
        "dimension_unit": "mm",
        "images": image_urls
    }

    payload = {"items": [item]}
    
    # 4. Send to Ozon
    print(f"📤 Sending to Ozon: {final_name}")
    ozon_url = "https://api-seller.ozon.ru/v3/product/import"
    ozon_resp = requests.post(ozon_url, headers=OZON_HEADERS, json=payload)
    
    if ozon_resp.status_code == 200:
        print("✅ SUCCESS! Ozon task created.")
        print(json.dumps(ozon_resp.json(), indent=2))
        task_id = ozon_resp.json().get('result', {}).get('task_id')
        if task_id:
            with open("last_task_id.txt", "w") as f:
                f.write(str(task_id))
    else:
        print(f"❌ ERROR: {ozon_resp.status_code}")
        print(ozon_resp.text)

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        create_card_by_article(sys.argv[1])
    else:
        print("Usage: python3 create_ozon_by_article.py <article>")
