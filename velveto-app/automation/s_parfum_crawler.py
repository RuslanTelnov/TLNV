import requests
from bs4 import BeautifulSoup
import json
import time
import re

def get_products():
    base_url = "https://s-parfum.kz/katalog/parfyumeriya?page="
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    all_products = []
    others = []
    
    # Pricing Grid
    PRICING = {
        "Classic": {
            "3 мл": 1500, "15 мл": 6500, "30 мл": 9500, "50 мл": 12500, "100 мл": 18500
        },
        "Selective/Author (Std)": {
            "3 мл": 2250, "15 мл": 9500, "30 мл": 12500, "50 мл": 16500, "100 мл": 26500
        },
        "Selective/Author (Prem)": {
            "3 мл": 2400, "15 мл": 10000, "30 мл": 13500, "50 мл": 17500
        }
    }

    for page in range(18):
        url = base_url + str(page)
        print(f"Scraping page {page}...")
        try:
            response = requests.get(url, headers=headers, timeout=15)
            if response.status_code != 200:
                print(f"Failed to load page {page}, status: {response.status_code}")
                continue
            
            soup = BeautifulSoup(response.text, 'html.parser')
            cards = soup.find_all('div', class_='products__card')
            
            for card in cards:
                name_tag = card.find('div', class_='products__name')
                if not name_tag: continue
                
                name = name_tag.text.strip()
                href = card.find('a')['href'] if card.find('a') else ""
                
                price_tag = card.find('div', class_='products__prices')
                price_text = price_tag.text.strip() if price_tag else "0"
                price_val = int(re.sub(r'[^\d]', '', price_text))
                
                # Identify if it's specialized product
                if any(word in name.lower() for word in ["свеча", "саше", "гель", "сыворотка", "соль", "мист"]):
                    others.append({
                        "name": name,
                        "price": price_val,
                        "logistics": 212 # Default logistics for small items
                    })
                    continue

                # Tier detection logic
                tier = "Classic"
                if price_val == 1500:
                    tier = "Classic"
                elif price_val == 2250:
                    tier = "Selective/Author (Std)"
                elif price_val == 2400:
                    tier = "Selective/Author (Prem)"
                elif price_val > 5000: # Starting with 15ml price
                    if price_val == 6500:
                        tier = "Classic"
                    elif price_val == 9500:
                        tier = "Selective/Author (Std)"
                    elif price_val == 10000:
                        tier = "Selective/Author (Prem)"
                
                # Get volume prices from grid
                volumes = {}
                grid = PRICING.get(tier, PRICING["Classic"])
                for vol, p in grid.items():
                    # Simple logistics mock based on price/vol
                    logistics = 212 if p < 5000 else 699 if p < 15000 else 750
                    volumes[vol] = {
                        "price": p,
                        "logistics": logistics
                    }
                
                all_products.append({
                    "name": name,
                    "tier": tier,
                    "volumes": volumes
                })
                
        except Exception as e:
            print(f"Error on page {page}: {e}")
            
        time.sleep(1)
        
    return all_products, others

if __name__ == "__main__":
    products, others = get_products()
    result = {
        "prices": products,
        "others": others
    }
    with open('data/s_parfum_full_catalog.json', 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=4)
    print(f"Saved {len(products)} perfumes and {len(others)} other items.")
