import json
from bs4 import BeautifulSoup
import os

def extract_attributes(html_file):
    if not os.path.exists(html_file):
        return {"error": "File not found"}
        
    with open(html_file, "r", encoding="utf-8") as f:
        html = f.read()
        
    soup = BeautifulSoup(html, 'html.parser')
    specs = {}
    
    # Try the standard selector first
    items = soup.select(".specifications-list__item")
    if not items:
        # Try to find by text "Характеристики"
        header = soup.find(lambda tag: tag.name == "h2" and "Характеристики" in tag.text)
        if header:
            # Look for the next list
            container = header.find_next("div", class_="specifications-list")
            if container:
                items = container.select(".specifications-list__item")
    
    for item in items:
        key_el = item.select_one(".specifications-list__spec-term-text")
        val_el = item.select_one(".specifications-list__spec-definition-text")
        if key_el and val_el:
            key = key_el.get_text(strip=True)
            val = val_el.get_text(strip=True)
            specs[key] = val
            
    return specs

if __name__ == "__main__":
    specs = extract_attributes("kaspi_product_debug.html")
    print(json.dumps(specs, indent=2, ensure_ascii=False))
