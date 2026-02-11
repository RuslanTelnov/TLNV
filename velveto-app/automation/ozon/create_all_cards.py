import os
import requests
import json
import hashlib
import sys
from dotenv import load_dotenv

# Load env from ozon-automation folder
load_dotenv(os.path.join(os.getcwd(), "ozon-automation", ".env.ozon"))

OZON_CLIENT_ID = os.getenv('OZON_CLIENT_ID')
OZON_API_KEY = os.getenv('OZON_API_KEY')

headers = {
    'Client-Id': OZON_CLIENT_ID,
    'Api-Key': OZON_API_KEY,
    'Content-Type': 'application/json'
}

def upload_to_catbox(file_path):
    """Upload file to catbox.moe and return public URL"""
    if not file_path or not os.path.exists(file_path):
        return None
    print(f"☁️ Uploading {os.path.basename(file_path)} to catbox.moe...")
    try:
        with open(file_path, 'rb') as f:
            files = {'fileToUpload': f}
            data = {'reqtype': 'fileupload'}
            response = requests.post('https://catbox.moe/user/api.php', files=files, data=data)
            if response.status_code == 200:
                url = response.text.strip()
                print(f"✅ Public URL: {url}")
                return url
    except Exception as e:
        print(f"❌ Catbox exception: {e}")
    return None

def find_ozon_category(product_name):
    """Search for the best Ozon category based on product name"""
    print(f"🔍 Searching Ozon category for: {product_name}")
    
    # Keyword map for categories
    keywords = {
        "рюкзак": (17027904, 115945533), # Аксессуары -> Рюкзак
        "сумка": (17027904, 115945533), # Map bags to backpacks for now
        "игрушка": (17028973, 92851),   # Детские товары -> Мягкая игрушка
        "соник": (17028973, 92851),     # Sonic is a toy
        "горшок": (17028684, 94472),    # Детские товары -> Горшок для ребенка
        "ремень": (17027904, 91581),    # Аксессуары -> Ремень
        "стакан": (17029130, 93151),    # Дом и сад -> Стакан
        "контейнер": (17029130, 93151), # Map to houseware
        "массажер": (17037910, 95851),  # Красота и здоровье -> Массажер
        "брелок": (17027904, 87458885), # Аксессуары -> Брелок
        "аккумулятор": (17028742, 91886), # Электроника -> Внешний аккумулятор (Category ID guessed, Type ID correct)
        "заколка": (17027904, 97576),   # Аксессуары -> Заколка для волос
        "краб": (17027904, 97576),      # Аксессуары -> Заколка для волос
        "декор": (17029130, 91996),     # Дом и сад -> Фигурка декоративная
        "визитница": (17027904, 92358), # Аксессуары -> Визитница (Type ID from grep)
        "футляр": (17027904, 92499),    # Аксессуары -> Футляр (Type ID from grep)
        "бутылка": (17029130, 93151)    # Дом и сад -> Бутылка/Стакан
    }
    
    name_lower = product_name.lower()
    for kw, ids in keywords.items():
        if kw in name_lower:
            return ids
            
    return (17027904, 115945533) # Default to Accessories/Backpack if unknown

def get_required_attributes(category_id, type_id):
    """Fetch required attributes for a category"""
    url = "https://api-seller.ozon.ru/v1/description-category/attribute"
    payload = {
        "description_category_id": category_id,
        "type_id": type_id,
        "language": "DEFAULT"
    }
    response = requests.post(url, headers=headers, json=payload)
    if response.status_code == 200:
        attrs = response.json().get('result', [])
        return [a for a in attrs if a.get('is_required')]
    return []

def generate_numeric_offer_id(ms_id):
    """Generate a numeric offer ID from MS ID"""
    # Use MD5 hash of MS ID + salt and take numeric part
    h = hashlib.md5((ms_id + "v3").encode()).hexdigest()
    # Take numeric part of the hash
    numeric_id = "".join(filter(str.isdigit, str(int(h, 16))))[:12]
    return numeric_id

def search_for_image(product_name):
    """Search for a product image using image_map.json or fallback"""
    print(f"🔍 Searching image for: {product_name}")
    
    # 1. Check image_map.json
    map_file = os.path.join(os.getcwd(), "ozon-automation", "image_map.json")
    if os.path.exists(map_file):
        with open(map_file, "r", encoding="utf-8") as f:
            image_map = json.load(f)
            if product_name in image_map:
                print(f"   ✅ Found in image_map.json")
                return image_map[product_name]
    
    # 2. Fallback
    print("   ⚠️ No image found in map, using placeholder.")
    return "https://files.catbox.moe/rz3oby.jpg" # Placeholder (yellow backpack)

def create_all_cards():
    input_file = os.path.join(os.getcwd(), "ozon-automation", "products_to_process.json")
    if not os.path.exists(input_file):
        print("❌ Input file not found.")
        return

    with open(input_file, "r", encoding="utf-8") as f:
        products = json.load(f)

    print(f"🚀 Processing {len(products)} products for Ozon...")
    
    items_payload = []
    
    for p in products:
        ms_id = p.get('ms_id')
        name = p.get('name')
        price = str(p.get('price'))
        local_image_path = p.get('local_image_path')
        
        # 1. Generate numeric Offer ID
        offer_id = generate_numeric_offer_id(ms_id)
        
        # 2. Find Category
        cat_id, type_id = find_ozon_category(name)
        
        # 3. Handle Image
        if local_image_path and os.path.exists(local_image_path):
            image_url = upload_to_catbox(local_image_path)
        else:
            image_url = search_for_image(name)
            
        if not image_url:
            print(f"⚠️ Skipping {name}: No image found")
            continue

        print(f"🔨 Preparing payload for: {name} (Category: {cat_id}, Type: {type_id})")

        # 4. Fetch Required Attributes
        req_attrs = get_required_attributes(cat_id, type_id)
        
        attributes = []
        for ra in req_attrs:
            attr_id = ra['id']
            attr_name = ra['name']
            
            # Default values for common attributes
            val = None
            dict_id = None
            
            if attr_id == 85: # Brand
                val = "T-Design"
                dict_id = 5061932
            elif attr_id == 8229: # Type
                # Use the type_id we found
                val = "Мягкая игрушка" if type_id == 92851 else ("Рюкзак" if type_id == 115945533 else ("Горшок для ребенка" if type_id == 94472 else None))
                dict_id = type_id
            elif attr_id == 9048: # Model Name
                val = name[:50]
            elif attr_id == 22232: # TN VED
                if "рюкзак" in name.lower() or "сумка" in name.lower():
                    val = "4202929100 - Сумки дорожные, сумочки для косметических средств или наборов для личной гигиены, рюкзаки и сумки спортивные, с лицевой поверхностью из текстильных материалов"
                else:
                    val = "9503004100 - Игрушки, изображающие животных или других существ, кроме людей, набивные"
            elif attr_id == 9163: # Gender
                val = "Девочки"
                dict_id = 22881
            elif attr_id == 13214: # Min Age
                val = "3 года"
                dict_id = 971006005
            elif attr_id == 13215: # Max Age
                val = "7 лет"
                dict_id = 971005958
            
            if val:
                attr_obj = {"complex_id": 0, "id": attr_id, "values": []}
                if dict_id:
                    attr_obj["values"].append({"dictionary_value_id": dict_id, "value": val})
                else:
                    attr_obj["values"].append({"value": val})
                attributes.append(attr_obj)

        # Ensure required attributes are present (minimal set for test)
        # If we missed some, Ozon will tell us in the task errors.

        item = {
            "attributes": attributes,
            "barcode": offer_id, # Use numeric offer_id as barcode for now
            "description_category_id": cat_id,
            "type_id": type_id,
            "name": name,
            "offer_id": offer_id,
            "price": price,
            "vat": "0",
            "weight": 500,
            "weight_unit": "g",
            "width": 300,
            "height": 400,
            "depth": 150,
            "dimension_unit": "mm",
            "images": [image_url]
        }
        items_payload.append(item)
        
        # Limit removed to process all products
        # if len(items_payload) >= 10:
        #     break

    if not items_payload:
        print("❌ No valid items to create.")
        return

    payload = {"items": items_payload}
    url = "https://api-seller.ozon.ru/v3/product/import"
    print(f"📤 Sending {len(items_payload)} items to Ozon...")
    response = requests.post(url, headers=headers, json=payload)
    
    if response.status_code == 200:
        print("✅ SUCCESS! Task created.")
        print(response.json())
    else:
        print(f"❌ ERROR: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    create_all_cards()
