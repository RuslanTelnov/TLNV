import os
import json
import time
import argparse
import urllib.parse
from dotenv import load_dotenv
from supabase import create_client, Client
import requests
import re

# Selenium imports
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
except:
    supabase = None

def get_basket_number(nm_id):
    vol = nm_id // 100000
    part = nm_id // 1000
    return vol, part

def search_wb_selenium(query, limit=100, page=1):
    print(f"Searching for '{query}' via Selenium (Page {page})...")
    
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    chrome_options.add_argument("user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    products = []
    
    try:
        encoded_query = urllib.parse.quote(query)
        url = f"https://www.wildberries.ru/catalog/0/search.aspx?search={encoded_query}&page={page}"
        driver.get(url)
        
        # Try to set location to Astana (Nur-Sultan)
        try:
            loc_btn = driver.find_element(By.CSS_SELECTOR, ".simple-menu__link--address")
            loc_btn.click()
            time.sleep(1)
            search_input = driver.find_element(By.CSS_SELECTOR, ".ymaps-2-1-79-searchbox-input__input")
            search_input.send_keys("Астана")
            time.sleep(1)
            first_res = driver.find_element(By.CSS_SELECTOR, ".address-item")
            first_res.click()
            time.sleep(1)
            select_btn = driver.find_element(By.CSS_SELECTOR, ".details-self__btn")
            select_btn.click()
            time.sleep(2)
            print("Location set to Astana (attempted)")
        except:
            pass

        # Scroll down to load more items (WB lazy loads)
        for _ in range(10):
            driver.execute_script("window.scrollBy(0, 1000);")
            time.sleep(0.5)
        
        driver.execute_script("window.scrollTo(0, 0);")
        time.sleep(1)
        
        cards = driver.find_elements(By.CSS_SELECTOR, ".product-card")
        print(f"Found {len(cards)} cards on page.")
        
        for i, card in enumerate(cards):
            if len(products) >= limit:
                break
            try:
                link_el = card.find_element(By.CSS_SELECTOR, "a.product-card__link")
                href = link_el.get_attribute("href")
                nm_id = int(href.split("catalog/")[1].split("/")[0])
                
                try:
                    name = card.find_element(By.CSS_SELECTOR, ".product-card__name").text.strip()
                except:
                    name = "Unknown"
                    
                try:
                    brand = card.find_element(By.CSS_SELECTOR, ".product-card__brand").text.strip()
                except:
                    brand = ""
                    
                price_val = 0
                try:
                    price_el = card.find_element(By.CSS_SELECTOR, ".price__lower-price")
                    price_text = price_el.text.strip()
                    clean_price = "".join(filter(str.isdigit, price_text.replace("&nbsp;", "")))
                    if clean_price:
                        price_val = int(clean_price)
                except:
                    pass
                    
                delivery_text = ""
                try:
                    delivery_el = card.find_element(By.CSS_SELECTOR, ".product-card__delivery")
                    delivery_text = delivery_el.text.strip()
                except:
                    pass
                    
                rating = 0.0
                try:
                    rating_el = card.find_element(By.CSS_SELECTOR, ".address-rate-mini")
                    rating_text = rating_el.text.strip().replace(",", ".")
                    rating = float(rating_text)
                except:
                    pass
                    
                feedbacks = 0
                try:
                    feedbacks_el = card.find_element(By.CSS_SELECTOR, ".product-card__count")
                    feedbacks_text = feedbacks_el.text.strip()
                    feedbacks_digits = "".join(filter(str.isdigit, feedbacks_text))
                    feedbacks = int(feedbacks_digits) if feedbacks_digits else 0
                except:
                    pass

                image_url = ""
                try:
                    img_el = card.find_element(By.CSS_SELECTOR, "img.j-thumbnail")
                    image_url = img_el.get_attribute("src")
                except:
                    pass

                products.append({
                    'id': nm_id,
                    'name': name,
                    'brand': brand,
                    'price_val': price_val,
                    'image_url': image_url,
                    'rating': rating,
                    'feedbacks': feedbacks,
                    'delivery_text': delivery_text
                })
            except Exception as e:
                pass
                
    except Exception as e:
        print(f"Selenium search error: {e}")
    finally:
        driver.quit()
        
    return products

def get_product_details(nm_id):
    vol, part = get_basket_number(nm_id)
    details = {}
    host = None
    
    # Try to find host for card.json. Extended range based on discovery.
    for i in range(1, 41):
        h = f"basket-{i:02d}.wbbasket.ru"
        url = f"https://{h}/vol{vol}/part{part}/{nm_id}/info/ru/card.json"
        try:
            resp = requests.get(url, timeout=1)
            if resp.status_code == 200:
                details = resp.json()
                host = h
                break
        except:
            continue
            
    v4_url = f"https://card.wb.ru/cards/v4/detail?appType=1&curr=kzt&dest=82&nm={nm_id}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    try:
        v4_resp = requests.get(v4_url, headers=headers, timeout=5)
        if v4_resp.status_code == 200:
            v4_data = v4_resp.json()
            products = v4_data.get('data', {}).get('products', []) or v4_data.get('products', [])
            if products:
                p = products[0]
                details['v4_data'] = p
    except Exception as e:
        print(f"  Error fetching v4 details: {e}")
        
    return details if details else None, host

# Closed categories for Kaspi
CLOSED_CATEGORIES_KEYWORDS = [
    "лекарство", "аптека", "алкоголь", "водка", "вино", "пиво", "сигареты", "табак", 
    "оружие", "нож", "пистолет", "бад", "витамины", "химия", "ядохимикаты",
    "интим", "sex", "эротика", "порно", "реплика", "копия", "1:1", "replica",
    "золото", "серебро", "бриллиант", "брильянт", "колецо", "серьги", 
    "медицинский", "шприц", "игла", "ветеринар", "корм для", "пиротехника", "фейерверк",
    "духи", "парфюм", "туалетная вода", "одеколон", "parfum", "eau de", "fragrance"
]

def is_product_closed(name, brand, specs):
    text = (name + " " + brand + " " + str(specs)).lower()
    for kw in CLOSED_CATEGORIES_KEYWORDS:
        if kw in text:
            return True
    return False

def parse_and_save(query, limit=50, page=1):
    products = search_wb_selenium(query, limit, page)
    
    if not products:
        print("No products found.")
        return

    print(f"Processing {len(products)} products...")
    
    seen_ids = set()
    
    for i, p in enumerate(products):
        nm_id = p.get('id')
        if nm_id in seen_ids:
            continue
        seen_ids.add(nm_id)
        
        print(f"[{i+1}/{len(products)}] Processing {nm_id}...")
        
        details, host = get_product_details(nm_id)
        if not details: details = {}
            
        name = details.get('imt_name', p.get('name', 'Unknown'))
        brand = details.get('selling', {}).get('brand_name', p.get('brand', 'Unknown'))
        description = details.get('description', '')
        
        options = details.get('options', [])
        specs = {}
        for opt in options:
            specs[opt['name']] = opt['value']
        specs['description'] = description
        
        v4_data = details.get('v4_data', {})
        if v4_data:
            # Pricing Logic
            # salePriceU is usually the 'card price' in cents.
            # sizes -> price -> product is the actual price for that size in cents.
            price_kzt = 0
            
            # Try to get price from the first size (usually representative)
            sizes = v4_data.get('sizes', [])
            if sizes and 'price' in sizes[0]:
                # 'product' is the final price in cents (usually)
                price_cents = sizes[0]['price'].get('product', 0)
                if price_cents > 0:
                    price_kzt = price_cents // 100
            
            # Fallback to salePriceU if size price missing
            if price_kzt == 0:
                price_val = v4_data.get('salePriceU', 0)
                if price_val > 0:
                    price_kzt = price_val // 100
            
            # Fallback to selenium price if still 0
            if price_kzt == 0:
                price_kzt = p.get('price_val', 0)
            
            # Improved Delivery Logic from V4 API
            # dest=82 is Astana (usually). 
            # In V4, sizes -> stocks -> time (is usually unrelated to delivery days directly in hours, often needs interpretation)
            # But reliability is best from the Selenium 'delivery_text' or better yet, if we can parse it from 'sale' params.
            # Actually, the simplest way for 'time' is usually found in `qty` logic, but V4 is tricky.
            # Let's trust logic: if totalQuantity > 0 -> In Stock.
            
            # Stock Logic: User wants boolean only.
            stock = v4_data.get('totalQuantity', 0)
            in_stock = stock > 0
            
            # We will still save 'stock' in specs just in case, but rely on in_stock for UI.
            specs['stock'] = stock 
            
            # Images logic
            image_urls = []
            pics_count = v4_data.get('pics', 0)
            vol, part = get_basket_number(nm_id)
            max_images = min(max(pics_count, 1), 5)
            
            for i_img in range(1, max_images + 1):
                if host:
                    img_url = f"https://{host}/vol{vol}/part{part}/{nm_id}/images/big/{i_img}.webp"
                else:
                    # Generic structure as fallback
                    img_url = f"https://basket-11.wbbasket.ru/vol{vol}/part{part}/{nm_id}/images/big/{i_img}.webp"
                image_urls.append(img_url)
                
            image_url = image_urls[0] if image_urls else p.get('image_url', "")
            specs['image_urls'] = image_urls
        else:
            price_kzt = p.get('price_val', 0)
            in_stock = True
            stock = 0
            image_url = p.get('image_url', "")
            specs['image_urls'] = [image_url] if image_url else []

        # Refined Delivery Parsing
        # Try to use the selenium text first as it reflects the visual "delivered by..."
        delivery_text = p.get('delivery_text', "")
        delivery_days = 0 # Default unknown
        
        if delivery_text:
            dt = delivery_text.lower()
            if "завтра" in dt: 
                delivery_days = 1
            elif "послезавтра" in dt: 
                delivery_days = 2
            else:
                # Search for dates like "22 января"
                # This needs current date awareness, which is hard in isolated script.
                # Or search for "через 5 дней"
                match_days = re.search(r"(\d+)\s+д", dt) # "5 дн"
                if match_days:
                    delivery_days = int(match_days.group(1))
                else:
                    # Just generic number heuristic
                    nums = re.findall(r"\d+", dt)
                    if nums:
                        # If date "15 jan", calculating diff is hard without knowing month.
                        # User wants "Concrete days".
                        # If selenium failed to give "days", we might try to map "Dates" to "Days from now".
                        pass
        
        # Fallback: if V4 has valid delivery times? V4 is raw.
        # Let's stick to what we extract but format it cleaner.
        
        is_closed = is_product_closed(name, brand, specs)
        
        item = {
            "id": nm_id,
            "position": i + 1,
            "name": name,
            "brand": brand,
            "price_kzt": price_kzt,
            "in_stock": in_stock,
            "image_url": image_url,
            "product_url": f"https://www.wildberries.ru/catalog/{nm_id}/detail.aspx",
            "specs": specs,
            "delivery_days": delivery_days, # Numeric
            "delivery_date": delivery_text if delivery_text else "Уточняется", # Text representation
            "is_closed": is_closed,
            "query": query,
            "rating": p.get('rating', 0),
            "feedbacks": p.get('feedbacks', 0),
            "updated_at": "now()"
        }
        
        if supabase:
            try:
                supabase.table("wb_search_results").upsert(item).execute()
                print(f"  Saved {name} ({price_kzt} ₸)")
            except Exception as e:
                print(f"  Error saving DB: {e}")
        else:
            print(f"  [Dry Run] Would save: {name}")
            
        time.sleep(0.1)
    print("Done.")

def reparse_existing():
    if not supabase: return
    print("🔄 Starting reparse...")
    try:
        res = supabase.table("wb_search_results").select("id, query").execute()
        if not res.data: return
        print(f"Updating {len(res.data)} products...")
        
        for i, row in enumerate(res.data):
            nm_id = row['id']
            print(f"[{i+1}/{len(res.data)}] Updating {nm_id}...")
            details, host = get_product_details(nm_id)
            if not details: continue
                
            name = details.get('imt_name', 'Unknown')
            brand = details.get('selling', {}).get('brand_name', 'Unknown')
            
            v4_data = details.get('v4_data', {})
            price_kzt = 0
            stock = 0
            if v4_data:
                price_val = v4_data.get('salePriceU', 0)
                if price_val > 0: price_kzt = price_val // 100
                stock = v4_data.get('totalQuantity', 0)
            
            options = details.get('options', [])
            specs = {}
            for opt in options: specs[opt['name']] = opt['value']
            specs['description'] = details.get('description', '')
            specs['stock'] = stock

            is_closed = is_product_closed(name, brand, specs)
            
            # Form image URLs for update too
            vol, part = get_basket_number(nm_id)
            pics_count = v4_data.get('pics', 0)
            image_urls = []
            if host and pics_count:
                max_images = min(pics_count, 5)
                for i_img in range(1, max_images + 1):
                    image_urls.append(f"https://{host}/vol{vol}/part{part}/{nm_id}/images/big/{i_img}.webp")
            
            update_data = {
                "id": nm_id,
                "name": name,
                "brand": brand,
                "specs": specs,
                "is_closed": is_closed,
                "in_stock": stock > 0,
                "updated_at": "now()" 
            }
            if price_kzt > 0: update_data["price_kzt"] = price_kzt
            if image_urls:
                update_data["image_url"] = image_urls[0]
                update_data["specs"]["image_urls"] = image_urls

            try:
                supabase.table("wb_search_results").update(update_data).eq("id", nm_id).execute()
                print(f"  ✅ Updated {name}")
            except Exception as e:
                print(f"  ❌ Error: {e}")
            time.sleep(0.5)
    except Exception as e:
        print(f"Reparse error: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("query", nargs='?', help="Search query")
    parser.add_argument("--limit", type=int, default=40)
    parser.add_argument("--mode", choices=['search', 'top', 'reparse'], default='search')
    parser.add_argument("--page", type=int, default=1)
    args = parser.parse_args()
    
    if args.mode == 'reparse':
        reparse_existing()
    else:
        query = args.query
        if args.mode == 'top': query = "Хиты"
        if not query: exit(1)
        parse_and_save(query, args.limit, args.page)
