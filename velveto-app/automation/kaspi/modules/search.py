import requests
from bs4 import BeautifulSoup
import urllib.parse
import sys
import os

# Add parent directory to path to import config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config

def find_product_url_by_article(article):
    """
    Searches for a product on Kaspi by article/SKU.
    Returns the URL of the first matching product.
    """
    encoded_article = urllib.parse.quote(str(article))
    search_url = config.KASPI_SEARCH_URL.format(encoded_article)
    
    print(f"Searching for article: {article}")
    print(f"URL: {search_url}")
    
    headers = {
        "User-Agent": config.USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
    }
    
    try:
        response = requests.get(search_url, headers=headers)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Kaspi search results usually list items. 
        # We need to find the first item link.
        # Selectors might need adjustment based on actual Kaspi HTML structure.
        
        # Common selector for product card link in Kaspi
        # Try multiple potential selectors
        item_link = soup.select_one('a.item-card__name-link')
        
        if not item_link:
             item_link = soup.select_one('a.item-card__image-wrapper')
             
        if item_link:
            href = item_link.get('href')
            if href:
                if not href.startswith('http'):
                    return config.KASPI_BASE_URL + href
                return href
                
        print("No products found for this article.")
        print("Response preview:", response.text[:500]) # Debug: See what we got
        return None
        
    except Exception as e:
        print(f"Error searching for product: {e}")
        return None

if __name__ == "__main__":
    # Test with a dummy article if run directly
    test_article = "150510865" # Example
    url = find_product_url_by_article(test_article)
    if url:
        print(f"Found URL: {url}")
    else:
        print("Not found.")
