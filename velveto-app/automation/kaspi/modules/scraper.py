import requests
from bs4 import BeautifulSoup
import json
import sys
import os
import re

# Add parent directory to path to import config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config

def scrape_product_details(product_url):
    """
    Scrapes product details from a Kaspi product page.
    Returns a dictionary with product data.
    """
    print(f"Scraping URL: {product_url}")
    
    headers = {
        "User-Agent": config.USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Referer": "https://kaspi.kz/shop/search/",
    }
    
    try:
        response = requests.get(product_url, headers=headers)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        product_data = {
            "title": "",
            "description": "",
            "images": [],
            "attributes": {},
            "category_id": None,
            "source_url": product_url
        }
        
        # 1. Title
        title_elem = soup.select_one('h1.item__heading')
        if title_elem:
            product_data["title"] = title_elem.text.strip()
            
        # 2. Description
        desc_elem = soup.select_one('.item__description-text')
        if desc_elem:
            product_data["description"] = desc_elem.text.strip()
            
        # 3. Images
        # Images are often in a gallery script or specific containers
        image_elems = soup.select('.item__slider-pic')
        for img in image_elems:
            src = img.get('src')
            if src:
                product_data["images"].append(src)
                
        # Fallback for images: look for JSON-LD or script data
        if not product_data["images"]:
            scripts = soup.find_all('script')
            for script in scripts:
                if script.string and 'galleryImages' in script.string:
                    # Try to extract image URLs from script content using regex
                    urls = re.findall(r'"large":"(https://[^"]+)"', script.string)
                    if urls:
                        product_data["images"].extend(urls)
                        
        # 4. Attributes / Specifications
        specs_table = soup.select('.specifications-list__item')
        for spec in specs_table:
            key_elem = spec.select_one('.specifications-list__spec-term-text')
            val_elem = spec.select_one('.specifications-list__spec-definition-text')
            
            if key_elem and val_elem:
                key = key_elem.text.strip()
                val = val_elem.text.strip()
                product_data["attributes"][key] = val
                
        # 5. Category ID (Often hidden in scripts or breadcrumbs)
        # This might require more specific logic based on actual page source
        
        return product_data

    except Exception as e:
        print(f"Error scraping product: {e}")
        return None

if __name__ == "__main__":
    # Test with a dummy URL if run directly
    test_url = "https://kaspi.kz/shop/p/samsung-galaxy-a55-5g-8-gb-256-gb-temno-sinii-117420207/" # Example
    data = scrape_product_details(test_url)
    if data:
        print(json.dumps(data, indent=2, ensure_ascii=False))
    else:
        print("Failed to scrape.")
