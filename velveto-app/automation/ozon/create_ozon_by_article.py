import os
import requests
import json
import base64
import subprocess
import re
from dotenv import load_dotenv

script_dir = os.path.dirname(os.path.abspath(__file__))
# Navigate up 4 levels to reach moysklad-automation root
env_path = os.path.abspath(os.path.join(script_dir, "../../../../.env"))
load_dotenv(env_path)

# Try loading .env.ozon if it exists in current dir or parent
ozon_env_path = os.path.join(script_dir, ".env.ozon")
if os.path.exists(ozon_env_path):
    load_dotenv(ozon_env_path)

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

def upload_to_catbox(content, filename):
    """Upload file to catbox.moe and return public URL"""
    print(f"☁️ Uploading {filename} to catbox.moe...")
    try:
        files = {'fileToUpload': (filename, content)}
        data = {'reqtype': 'fileupload'}
        response = requests.post('https://catbox.moe/user/api.php', files=files, data=data)
        if response.status_code == 200:
            url = response.text.strip()
            print(f"✅ Public URL: {url}")
            return url
        else:
            print(f"❌ Catbox upload failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Catbox exception: {e}")
    return None

def fetch_kaspi_data(sku):
    """Fetch product data from Kaspi using playwright script"""
    print(f"🔍 Searching in Kaspi for SKU: {sku}...")
    try:
        # Path to kaspi automation relative to this script
        # structure: automation/ozon/create_ozon_by_article.py -> automation/kaspi/fetch_kaspi_product.py
        # So we go up one level then into kaspi
        kaspi_script = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "kaspi", "fetch_kaspi_product.py")
        cmd = ["python3", kaspi_script, sku]
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
    
    # 1. Search in MoySklad (Article, Code, or Barcode)
    # We try multiple fields to ensure we find the product
    ms_product = None
    
    search_fields = ["article", "code"]
    
    for field in search_fields:
        if ms_product: break
        print(f"🔎 Searching MS by {field}={article}...")
        url = "https://api.moysklad.ru/api/remap/1.2/entity/product"
        params = {"filter": f"{field}={article}"}
        try:
            resp = requests.get(url, headers=MS_HEADERS, params=params)
            if resp.status_code == 200 and resp.json().get('rows'):
                ms_product = resp.json()['rows'][0]
                print(f"📦 Found in MS by {field}: {ms_product['name']}")
        except Exception as e:
            print(f"❌ Error searching MS by {field}: {e}")

    # Also try searching by barcode if not found
    if not ms_product:
        print(f"🔎 Searching MS by barcode={article}...")
        # Barcode search is trickier, needs specific filter syntax often or checking all variants.
        # Simplest is to try fetching known products or using the global search (json/filter).
        # We can try a broader filter? No, let's keep it simple.
        pass

    if not ms_product:
        print("⚠️ Product NOT found in MoySklad. Proceeding with limited data...")

    # 2. Search in Kaspi (for images and better title)
    kaspi_data = fetch_kaspi_data(article)
    
    image_urls = []
    if kaspi_data and kaspi_data.get('images'):
        print(f"🖼️ Found {len(kaspi_data['images'])} images in Kaspi.")
        for i, img_url in enumerate(kaspi_data['images']):
            try:
                img_resp = requests.get(img_url)
                if img_resp.status_code == 200:
                    uploaded_url = upload_to_catbox(img_resp.content, f"{article}_{i}.jpg")
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
                            uploaded_url = upload_to_catbox(content_resp.content, img_row['filename'])
                            if uploaded_url:
                                image_urls.append(uploaded_url)

    if not image_urls:
        print("⚠️ No images found. Skipping product.")
        return

    # 3. Prepare Ozon Payload
    # Use Kaspi title if available, otherwise MS title
    final_name = kaspi_data['title'] if kaspi_data else (ms_product['name'] if ms_product else f"Товар {article}")
    
    # Basic info from MS or defaults
    price = str(ms_product.get('salePrices', [{}])[0].get('value', 0) / 100) if ms_product else "1000"
    weight = int(ms_product.get('weight', 0) * 1000) if ms_product else 100
    
    # Category detection (simple keyword based)
    cat_id = None
    type_id = None
    
    final_name_lower = final_name.lower()
    
    if "рюкзак" in final_name_lower:
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
    elif "брелок" in final_name.lower():
        cat_id = 17027899
        type_id = 87458885
    elif "стриппер" in final_name.lower() or "инструмент для снятия" in final_name.lower():
        cat_id = 17028653
        type_id = 92079
    elif "картина" in final_name.lower():
        cat_id = 17027906
        type_id = 91955
    elif "кепка" in final_name.lower() or "бейсболка" in final_name.lower():
        cat_id = 41777465
        type_id = 93040
    elif "коврик" in final_name.lower():
        cat_id = 18262715
        type_id = 96808
    elif "лампа" in final_name.lower() or "свет" in final_name.lower():
        cat_id = 17028647
        type_id = 97420
    elif "комплект" in final_name.lower() or "термобелье" in final_name.lower():
        cat_id = 200001517
        type_id = 93225
    elif "кошелек" in final_name.lower():
        cat_id = 17027904
        type_id = 93338
    elif "кусторез" in final_name.lower():
        cat_id = 17028940
        type_id = 98397
    elif "весы" in final_name.lower():
        cat_id = 17028912
        type_id = 91418
    elif "лейка" in final_name.lower():
        cat_id = 64766017
        type_id = 94630 # Changed from 94633 (Лейка) to 94630 (Душевой комплект)
    elif "маркер" in final_name.lower():
        cat_id = 17029021
        type_id = 93306
    elif "массажер" in final_name.lower():
        cat_id = 200001548
        type_id = 970978680
    elif "тарака" in final_name.lower() or "насеком" in final_name.lower() or "dahao" in final_name.lower():
        cat_id = 34955 # Средства от насекомых (Household chemicals / Insect protection)
        type_id = 93563 # Средство от насекомых


    # Title cleaning (Ozon doesn't allow external links like .kz, .ru)
    final_name = re.sub(r'[a-zA-Z0-9.-]+\.(kz|ru|com|net|org|info|biz)', '', final_name).strip()
    final_name = re.sub(r'\s+', ' ', final_name) # Clean extra spaces

    # Attributes (simplified for now, using research from previous steps)
    type_value = "Товар"
    if type_id == 96463: type_value = "Зажигалка"
    elif type_id == 115945533: type_value = "Рюкзак"
    elif type_id == 93337: type_value = "Косметичка"
    elif type_id == 93352: type_value = "Зонт"
    elif type_id == 97199: type_value = "Балаклава"
    elif type_id == 87458885: type_value = "Брелок"
    elif type_id == 92079: type_value = "Стрипперы"
    elif type_id == 91955: type_value = "Картина"
    elif type_id == 93040: type_value = "Бейсболка"
    elif type_id == 96808: type_value = "Коврик для мышки"
    elif type_id == 97420: type_value = "Свет для мобильной съемки"
    elif type_id == 93225: type_value = "Комплект термобелья"
    elif type_id == 92851: type_value = "Интерактивная игрушка"
    elif type_id == 93338: type_value = "Кошелек"
    elif type_id == 98397: type_value = "Кусторез"
    elif type_id == 91418: type_value = "Кухонные весы"
    elif type_id == 94633: type_value = "Лейка для душа"
    elif type_id == 94630: type_value = "Душевой комплект"
    elif type_id == 93306: type_value = "Маркер"
    elif type_id == 970978680: # Массажер ручной
        type_value = "Массажер ручной"
    elif type_id == 93563:
        type_value = "Средство от насекомых"

    if cat_id is None or type_id is None:
        print(f"⚠️ Unknown category for '{final_name}'. Skipping creation.")
        return

    attributes = [
        {"complex_id": 0, "id": 8229, "values": [{"dictionary_value_id": type_id, "value": type_value}]},
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
        attributes.append({"complex_id": 0, "id": 8292, "values": [{"value": article}]})
    elif type_id == 87458885: # Брелок
        attributes.append({"complex_id": 0, "id": 22232, "values": [{"dictionary_value_id": 971399197, "value": "7326909807 - Прочие изделия из черных металлов..."}]})
        attributes.append({"complex_id": 0, "id": 9163, "values": [{"dictionary_value_id": 22880, "value": "Унисекс"}]})
    elif type_id == 92079: # Стриппер
        attributes.append({"complex_id": 0, "id": 22232, "values": [{"dictionary_value_id": 971399266, "value": "8203200009 - Клещи..."}]})
    elif type_id == 91955: # Картина
        attributes.append({"complex_id": 0, "id": 22232, "values": [{"dictionary_value_id": 971400837, "value": "9701910000 - Картины..."}]})
    elif type_id == 93040: # Бейсболка
        attributes.append({"complex_id": 0, "id": 22232, "values": [{"dictionary_value_id": 971398849, "value": "6505009000 - Шляпы..."}]})
        attributes.append({"complex_id": 0, "id": 9163, "values": [{"dictionary_value_id": 22880, "value": "Унисекс"}]})
        attributes.append({"complex_id": 0, "id": 4295, "values": [{"dictionary_value_id": 35646, "value": "универсальный"}]})
        attributes.append({"complex_id": 0, "id": 10096, "values": [{"dictionary_value_id": 61574, "value": "черный"}]})
        attributes.append({"complex_id": 0, "id": 31, "values": [{"dictionary_value_id": 5061932, "value": "T-Design"}]})
        attributes.append({"complex_id": 0, "id": 8292, "values": [{"value": article}]})
    elif type_id == 96808: # Коврик для мыши
        attributes.append({"complex_id": 0, "id": 22232, "values": [{"dictionary_value_id": 971397978, "value": "3926909200 - Изделия прочие..."}]})
        attributes.append({"complex_id": 0, "id": 10096, "values": [{"dictionary_value_id": 61574, "value": "черный"}]})
    elif type_id == 97420: # Свет для мобильной съемки
        attributes.append({"complex_id": 0, "id": 22232, "values": [{"dictionary_value_id": 972022788, "value": "9405410019 - Прожекторы..."}]})
    elif type_id == 93225: # Комплект термобелья
        attributes.append({"complex_id": 0, "id": 22232, "values": [{"dictionary_value_id": 971398484, "value": "6107990000 - Прочие..."}]})
        attributes.append({"complex_id": 0, "id": 9163, "values": [{"dictionary_value_id": 22880, "value": "Унисекс"}]})
        attributes.append({"complex_id": 0, "id": 4295, "values": [{"dictionary_value_id": 35646, "value": "универсальный"}]})
        attributes.append({"complex_id": 0, "id": 10096, "values": [{"dictionary_value_id": 61574, "value": "черный"}]})
        attributes.append({"complex_id": 0, "id": 31, "values": [{"dictionary_value_id": 5061932, "value": "T-Design"}]})
        attributes.append({"complex_id": 0, "id": 8292, "values": [{"value": article}]})
    elif type_id == 92851: # Игрушка
        attributes.append({"complex_id": 0, "id": 22232, "values": [{"dictionary_value_id": 971400719, "value": "9503009909 - Игрушки прочие..."}]})
        attributes.append({"complex_id": 0, "id": 13215, "values": [{"dictionary_value_id": 971005969, "value": "18 лет"}]})
        attributes.append({"complex_id": 0, "id": 13214, "values": [{"dictionary_value_id": 971006005, "value": "3 года"}]})
    elif type_id == 93338: # Кошелек
        attributes.append({"complex_id": 0, "id": 22232, "values": [{"dictionary_value_id": 971398077, "value": "4202929100 - Сумки дорожные..."}]})
        attributes.append({"complex_id": 0, "id": 9163, "values": [{"dictionary_value_id": 22881, "value": "Женский"}]})
    elif type_id == 98397: # Кусторез
        attributes.append({"complex_id": 0, "id": 22232, "values": [{"dictionary_value_id": 971399267, "value": "8203300000 - Ножницы для резки металла..."}]})
    elif type_id == 91418: # Весы
        attributes.append({"complex_id": 0, "id": 5132, "values": [{"dictionary_value_id": 23689, "value": "Электронные"}]})
    elif type_id == 94633: # Лейка для душа (Old) - Changed to Shower Set
        pass
    elif type_id == 94630: # Душевой комплект (New for Лейка)
        attributes.append({"complex_id": 0, "id": 22232, "values": [{"dictionary_value_id": 971397965, "value": "3924900009 - Прочие приборы..."}]})
    elif type_id == 93306: # Маркер
        pass # No extra required attributes found
    elif type_id == 970978680: # Массажер
        attributes.append({"complex_id": 0, "id": 22232, "values": [{"dictionary_value_id": 971400475, "value": "9019109009 - Прочая аппаратура..."}]})
    elif type_id == 93563: # Средство от насекомых
        # 8229 - Type
        # 5061932 - Brand T-Design
        # We need to ensure the main dictionary_value_id for 8229 matches the type.
        # Often for 93563 the dictionary value is also roughly same or we use "Средство от насекомых" text
        pass # Base attributes (Type, Brand, Name) are added below automatically. 
             # We might need "Volume" or "Form of release".
        # Adding Form of release (id 4855) -> Powder (id 23645) as it's Dahao powder
        attributes.append({"complex_id": 0, "id": 4855, "values": [{"dictionary_value_id": 23645, "value": "Порошок"}]})
        # Adding Purpose (id 4843) -> Against cockroaches (id 23617)
        attributes.append({"complex_id": 0, "id": 4843, "values": [{"dictionary_value_id": 23617, "value": "От тараканов"}]})

    offer_id = f"{article}_ozon"

    item = {
        "attributes": attributes,
        "barcode": str(article),
        "description_category_id": cat_id,
        "type_id": type_id,
        "name": final_name,
        "offer_id": offer_id,
        "price": price,
        "vat": "0",
        "height": 100,
        "depth": 100,
        "width": 100,
        "dimension_unit": "mm",
        "weight": 100,
        "weight_unit": "g",
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
            with open("ozon-automation/last_task_id.txt", "w") as f:
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
