from bs4 import BeautifulSoup
import re

def analyze():
    with open('selenium_source_kzt.html', 'r', encoding='utf-8') as f:
        html = f.read()
    
    soup = BeautifulSoup(html, 'html.parser')
    
    # 1. Search for price elements by common classes
    print("--- Searching for price elements ---")
    price_classes = [
        'price-block__final-price', 
        'price-block__wallet-price', 
        'price-block__old-price',
        'product-page__price-block'
    ]
    
    for cls in price_classes:
        elements = soup.find_all(class_=cls)
        for el in elements:
            print(f"Found class '{cls}': {el.get_text(strip=True)}")
            
    # 2. Search for any text containing '2 500' or '2500'
    print("\n--- Searching for price value '2500' ---")
    # Regex for 2500 with optional spaces/non-breaking spaces
    price_regex = re.compile(r'2\s*500')
    for text in soup.find_all(string=price_regex):
        print(f"Found text match: {text.strip()} in <{text.parent.name}>")

    # 3. Search for currency symbols
    print("\n--- Searching for currency symbols ---")
    currencies = ['₸', 'KZT', 'rub', '₽']
    for curr in currencies:
        found = soup.find_all(string=re.compile(re.escape(curr)))
        if found:
            print(f"Found currency '{curr}': {len(found)} times")
            for f in found[:3]:
                print(f"  - {f.strip()} in <{f.parent.name}>")

    # 4. Search for JSON data (SSR state)
    print("\n--- Searching for JSON data ---")
    scripts = soup.find_all('script')
    for script in scripts:
        if script.string and ('price' in script.string or 'currency' in script.string):
            print(f"Found script with price/currency data (first 100 chars): {script.string[:100]}...")

if __name__ == "__main__":
    analyze()
