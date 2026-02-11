import os
import pandas as pd
import requests
import json
import base64
from dotenv import load_dotenv
from supabase import create_client, Client

# Загрузка переменных окружения
load_dotenv()

# Supabase настройки
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# MoySklad настройки
LOGIN = os.getenv("MOYSKLAD_LOGIN")
PASSWORD = os.getenv("MOYSKLAD_PASSWORD")
BASE_URL = "https://api.moysklad.ru/api/remap/1.2"

# ID атрибута "Предзаказ" (нужно проверить ID в вашем аккаунте, если он менялся)
# Для примера используем заглушку или нужно получить динамически.
# В предыдущих шагах мы использовали хардкод, но лучше бы его найти.
# Пока оставим как было в памяти, или попробуем найти.
ATTR_PREORDER_ID = "677beb5d-7769-11f0-0a80-00cb000c69da"

auth_str = f"{LOGIN}:{PASSWORD}"
auth_b64 = base64.b64encode(auth_str.encode()).decode()
HEADERS = {
    "Authorization": f"Basic {auth_b64}",
    "Content-Type": "application/json"
}

def init_supabase():
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Ошибка: Не заданы SUPABASE_URL или SUPABASE_KEY")
        return None
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def get_countries():
    url = f"{BASE_URL}/entity/country"
    resp = requests.get(url, headers=HEADERS)
    if resp.status_code == 200:
        return {item['name'].lower(): item['meta'] for item in resp.json()['rows']}
    return {}

def get_uom_id():
    url = f"{BASE_URL}/entity/uom"
    resp = requests.get(url, headers=HEADERS)
    if resp.status_code == 200:
        # Берем "шт"
        for uom in resp.json()['rows']:
            if uom['name'] == 'шт':
                return uom['meta']
    return None

def get_currency():
    url = f"{BASE_URL}/entity/currency"
    resp = requests.get(url, headers=HEADERS)
    if resp.status_code == 200:
        # Берем первую (обычно рубль/тенге)
        return resp.json()['rows'][0]['meta']
    return None

def get_price_type(name_filter="Розничная цена"):
    url = f"{BASE_URL}/context/companysettings/pricetype"
    resp = requests.get(url, headers=HEADERS)
    if resp.status_code == 200:
        for pt in resp.json():
            if pt['name'] == name_filter:
                return pt['meta']
        # Если не нашли точное совпадение, вернем первый попавшийся (fallback)
        if name_filter == "Розничная цена" and len(resp.json()) > 0:
             print(f"⚠️  Тип цены '{name_filter}' не найден, используем '{resp.json()[0]['name']}'")
             return resp.json()[0]['meta']
    return None

def find_product_by_article(article):
    url = f"{BASE_URL}/entity/product?filter=article={article}"
    resp = requests.get(url, headers=HEADERS)
    if resp.status_code == 200:
        rows = resp.json().get('rows', [])
        if rows:
            return rows[0]
    return None

def find_counterparty(name):
    url = f"{BASE_URL}/entity/counterparty?filter=name={name}"
    resp = requests.get(url, headers=HEADERS)
    if resp.status_code == 200:
        rows = resp.json().get('rows', [])
        if rows:
            return rows[0]['meta']
    return None

def find_image_path(article):
    """Поиск изображения по артикулу в разных папках"""
    search_paths = [
        "images", 
        "../images",
        "/home/wik/Рабочий стол/Фото каспи",
        "/home/wik/Фото каспи"
    ]
    
    extensions = ['.jpg', '.jpeg', '.png', '.webp']
    
    for folder in search_paths:
        if not os.path.exists(folder):
            continue
            
        for ext in extensions:
            fname = f"{article}{ext}"
            fpath = os.path.join(folder, fname)
            if os.path.exists(fpath):
                return fpath, fname
    return None, None

def upload_image(article):
    """Загрузка изображения в Supabase Storage"""
    supabase = init_supabase()
    if not supabase:
        return None

    bucket_name = "product-images"
    
    file_path, file_name = find_image_path(article)
    
    if not file_path:
        print(f"   ⚠️  Изображение для {article} не найдено (искали в 'images' и 'Фото каспи')")
        return None

    try:
        with open(file_path, 'rb') as f:
            file_content = f.read()
        
        # Загружаем (upsert=True чтобы перезаписать)
        supabase.storage.from_(bucket_name).upload(
            path=file_name,
            file=file_content,
            file_options={"content-type": "image/png" if file_name.endswith('.png') else "image/jpeg", "upsert": "true"}
        )
        
        public_url = supabase.storage.from_(bucket_name).get_public_url(file_name)
        print(f"   🖼️  Изображение загружено: {public_url}")
        return public_url
        
    except Exception as e:
        print(f"   ⚠️  Ошибка загрузки изображения: {e}")
        return None

def get_image_base64(article):
    """Чтение и кодирование изображения в Base64 для МойСклад"""
    file_path, file_name = find_image_path(article)
    
    if file_path:
        with open(file_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8'), file_name
            
    return None, None

def save_to_supabase(product_data, moysklad_id, image_url=None, supplier=None, cost_price=0):
    supabase = init_supabase()
    if not supabase:
        return

    # Извлекаем цену (продажи)
    price = 0
    for sp in product_data.get('salePrices', []):
        # Берем первую цену или ищем конкретную
        price = sp.get('value', 0)
        break
        
    db_data = {
        "moysklad_id": moysklad_id,
        "name": product_data['name'],
        "article": product_data['article'],
        "price": price,
        "cost_price": cost_price,
        "supplier": supplier,
        "country": "Китай", # Упрощение
        "image_url": image_url
    }
    
    try:
        # Upsert по moysklad_id (нужен unique constraint) или article
        # В данном случае просто insert, но лучше upsert
        supabase.schema('Parser').table('products').upsert(db_data, on_conflict="article").execute()
        print("   💾 Сохранено в Supabase")
    except Exception as e:
        print(f"   ⚠️  Ошибка сохранения в Supabase: {e}")

def create_product(row, countries_map, currency_meta, price_type_meta):
    name = row.get('Название')
    article = str(row.get('Артикул', '')).strip()
    
    if not name or not article:
        print("❌ Пропуск: Нет названия или артикула")
        return False

    # Цены
    cost_price = float(row.get('Себестоимость', 0))
    
    if cost_price > 0:
        min_price_rub = (cost_price * 100) / 70
        sale_price_rub = (cost_price * 100) / 40
    else:
        min_price_rub = 0
        sale_price_rub = 0

    min_price = int(round(min_price_rub * 100))
    sale_price = int(round(sale_price_rub * 100))

    # Атрибуты (Предзаказ)
    attributes = []
    attributes.append({
        "meta": {
            "href": f"{BASE_URL}/entity/product/metadata/attributes/{ATTR_PREORDER_ID}",
            "type": "attributemetadata",
            "mediaType": "application/json"
        },
        "value": 30
    })

    # Страна
    country_meta = None
    country_name = str(row.get('Страна', '')).strip().lower()
    if country_name in countries_map:
        country_meta = countries_map[country_name]

    # Поставщик
    supplier_meta = None
    supplier_name = row.get('Поставщик')
    if supplier_name:
        supplier_meta = find_counterparty(supplier_name)
        if not supplier_meta:
             print(f"⚠️  Поставщик не найден: {supplier_name}")

    # Тип цены "Себестоимость"
    cost_price_meta = get_price_type("Себестоимость")

    product_data = {
        "name": name,
        "article": article,
        "minPrice": {"value": min_price, "currency": {"meta": currency_meta}}, 
        "salePrices": [
            {
                "value": sale_price,
                "priceType": {"meta": price_type_meta}
            }
        ]
    }
    
    if cost_price_meta:
        product_data["salePrices"].append({
            "value": int(cost_price * 100),
            "priceType": {"meta": cost_price_meta}
        })

    if country_meta:
        product_data["country"] = {"meta": country_meta}
    
    if supplier_meta:
        product_data["supplier"] = {"meta": supplier_meta}
    
    if attributes:
        product_data["attributes"] = attributes

    # Картинка для МойСклад
    img_b64, img_name = get_image_base64(article)
    if img_b64:
        product_data["images"] = [{
            "filename": img_name,
            "content": img_b64
        }]

    # Проверка дубликата
    existing_product = find_product_by_article(article)
    if existing_product:
        print(f"⏭️  Товар существует: {article}")
        # Обновляем в Supabase
        image_url = upload_image(article)
        save_to_supabase(product_data, existing_product['id'], image_url, supplier_name, cost_price)
        
        # Обновляем в МойСклад (PUT запрос)
        # Для обновления нужно отправить только измененные поля
        # Но для простоты отправим сформированный product_data
        try:
            resp = requests.put(f"{BASE_URL}/entity/product/{existing_product['id']}", json=product_data, headers=HEADERS)
            if resp.status_code == 200:
                print("   ✅ Обновлен в МойСклад")
            else:
                print(f"   ❌ Ошибка обновления в МойСклад: {resp.text}")
        except Exception as e:
            print(f"   ❌ Ошибка запроса обновления: {e}")
            
        return True

    # Создание нового
    try:
        resp = requests.post(f"{BASE_URL}/entity/product", json=product_data, headers=HEADERS)
        if resp.status_code == 200:
            new_product = resp.json()
            print(f"✅ Создан товар: {name} ({article})")
            print(f"   💰 Цены: Розничная={sale_price/100:.2f}, Мин={min_price/100:.2f}")
            
            # Загрузка картинки в Supabase
            image_url = upload_image(article)
            
            # Сохранение в Supabase
            # Сохранение в Supabase
            save_to_supabase(product_data, new_product['id'], image_url, supplier_name, cost_price)
            return True
        else:
            print(f"❌ Ошибка создания: {resp.text}")
            return False
    except Exception as e:
        print(f"❌ Ошибка запроса: {e}")
        return False

def main():
    print("✅ Supabase клиент инициализирован")
    print("🚀 Запуск импорта товаров...")
    
    countries_map = get_countries()
    print("🌍 Загрузка справочника стран...")
    
    currency_meta = get_currency()
    price_type_meta = get_price_type("Розничная цена") # Или "Цена продажи"
    
    input_dir = "input"
    if not os.path.exists(input_dir):
        print(f"❌ Папка {input_dir} не найдена")
        return

    files = [f for f in os.listdir(input_dir) if f.endswith('.xlsx') or f.endswith('.xls')]
    
    for file in files:
        print(f"📂 Чтение файла: {input_dir}/{file}")
        df = pd.read_excel(os.path.join(input_dir, file))
        print(f"📊 Найдено строк: {len(df)}")
        
        count = 0
        for index, row in df.iterrows():
            if create_product(row, countries_map, currency_meta, price_type_meta):
                count += 1
        
        print("==============================")
        print(f"🏁 Готово! Обработано товаров: {count}")

if __name__ == "__main__":
    main()
