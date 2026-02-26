import requests
from bs4 import BeautifulSoup
import json
import time
import re
from urllib.parse import urljoin

def get_product_details(session, url):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    try:
        response = session.get(url, headers=headers, timeout=10)
        if response.status_code != 200:
            return None, None
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Article/SKU
        articul_tag = soup.select_one('.product__articul')
        articul = articul_tag.text.replace('Артикул:', '').strip() if articul_tag else "N/A"
        
        # Image
        img_tag = soup.select_one('.product__big-slide')
        img_url = ""
        if img_tag:
            img_path = img_tag.get('href') or ""
            img_url = urljoin("https://s-parfum.kz", img_path) if img_path else ""
        
        return articul, img_url
    except Exception as e:
        print(f"Error fetching details for {url}: {e}")
        return None, None

def get_products():
    base_url = "https://s-parfum.kz/katalog/parfyumeriya?page="
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    session = requests.Session()
    all_products = []
    others = []
    
    # Updated pricing grids based on subagent research
    PRICING = {
        "Classic": {
            "3 мл": 1500, "15 мл": 6500, "30 мл": 8500, "50 мл": 11500, "100 мл": 18500
        },
        "Author": {
            "3 мл": 2250, "15 мл": 9500, "30 мл": 12500, "50 мл": 17000, "100 мл": 26500
        },
        "Exclusive": {
            "3 мл": 2700, "15 мл": 11500, "30 мл": 15000, "50 мл": 24000, "100 мл": 26500
        }
    }

    # First pass: Collect all URLs
    temp_list = []
    for page in range(18):
        url = base_url + str(page)
        print(f"Scraping catalog page {page}...")
        try:
            response = session.get(url, headers=headers, timeout=15)
            if response.status_code != 200:
                continue
            
            soup = BeautifulSoup(response.text, 'html.parser')
            cards = soup.find_all('div', class_='products__card')
            
            for card in cards:
                name_tag = card.find('div', class_='products__name')
                if not name_tag: continue
                
                name = name_tag.text.strip()
                link_tag = card.find('a')
                href = urljoin("https://s-parfum.kz", link_tag['href']) if link_tag else ""
                
                price_tag = card.find('div', class_='products__prices')
                price_text = price_tag.text.strip() if price_tag else "0"
                price_val = int(re.sub(r'[^\d]', '', price_text))
                
                temp_list.append({
                    "name": name,
                    "link": href,
                    "starting_price": price_val
                })
        except Exception as e:
            print(f"Error on page {page}: {e}")
        time.sleep(0.3)

    print(f"Collected {len(temp_list)} products. Now fetching details...")

    # Second pass: Fetch details for each
    for i, item in enumerate(temp_list):
        if i % 10 == 0:
            print(f"Processing item {i}/{len(temp_list)}...")
        
        name = item['name']
        price_val = item['starting_price']
        href = item['link']

        sku, img = get_product_details(session, href)
        
        # Detection logic refined
        tier = "Classic"
        if price_val == 1500:
            tier = "Classic"
        elif price_val == 2250:
            tier = "Author"
        elif price_val == 2700:
            tier = "Exclusive"
        elif price_val > 5000:
            if price_val == 6500:
                tier = "Classic"
            elif price_val == 9500:
                tier = "Author"
            elif price_val == 11500:
                tier = "Exclusive"

        # Special handling for "other" items
        if any(word in name.lower() for word in ["свеча", "саше", "гель", "сыворотка", "соль", "мист", "диффузор", "автопарфюм"]):
            others.append({
                "name": name,
                "sku": sku,
                "image": img,
                "link": href,
                "price": price_val,
                "logistics": 212
            })
            continue

        volumes = {}
        grid = PRICING.get(tier, PRICING["Classic"])
        for vol, p in grid.items():
            logistics = 212 if p < 5000 else 699 if p < 15000 else 750
            volumes[vol] = {"price": p, "logistics": logistics}

        all_products.append({
            "name": name,
            "sku": sku,
            "image": img,
            "link": href,
            "tier": tier,
            "volumes": volumes
        })
        time.sleep(0.1)

    return all_products, others

if __name__ == "__main__":
    products, others = get_products()
    result = {"prices": products, "others": others}
    with open('data/s_parfum_full_catalog.json', 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=4)
    print(f"Final: Saved {len(products)} perfumes and {len(others)} other items with links and tiers.")
