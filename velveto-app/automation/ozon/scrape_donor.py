from playwright.sync_api import sync_playwright
import json
import re

def scrape_ozon_product(url):
    """
    Scrape product data from Ozon product page
    """
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        )
        page = context.new_page()
        
        print(f"Loading {url}...")
        page.goto(url, timeout=60000)
        page.wait_for_load_state('networkidle')
        
        # Extract data from page
        data = {}
        
        # Try to get product name
        try:
            data['name'] = page.locator('h1').first.inner_text()
        except:
            data['name'] = None
        
        # Try to get price
        try:
            price_text = page.locator('[data-widget="webPrice"]').first.inner_text()
            data['price'] = price_text
        except:
            data['price'] = None
        
        # Get page content to extract JSON data
        content = page.content()
        
        # Look for __NEXT_DATA__ or similar JSON with product info
        json_match = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', content, re.DOTALL)
        if json_match:
            try:
                next_data = json.loads(json_match.group(1))
                # Save for analysis
                with open('donor_next_data.json', 'w', encoding='utf-8') as f:
                    json.dump(next_data, f, indent=2, ensure_ascii=False)
                print("✅ Saved __NEXT_DATA__ to donor_next_data.json")
            except:
                pass
        
        # Take screenshot for debugging
        page.screenshot(path='donor_product_page.png')
        print("✅ Saved screenshot to donor_product_page.png")
        
        # Save full HTML
        with open('donor_product_page.html', 'w', encoding='utf-8') as f:
            f.write(content)
        print("✅ Saved HTML to donor_product_page.html")
        
        browser.close()
        
        return data

if __name__ == "__main__":
    url = "https://www.ozon.ru/product/ryukzak-kapibara-igrushka-myagkaya-30sm-2138320565/"
    data = scrape_ozon_product(url)
    print(f"\nExtracted data: {json.dumps(data, indent=2, ensure_ascii=False)}")
