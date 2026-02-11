from abc import ABC, abstractmethod
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import time
import random
import urllib.parse
from curl_cffi import requests as crequests
from bs4 import BeautifulSoup
import re

class SearchBackend(ABC):
    @abstractmethod
    def search(self, query):
        """
        Search for a query and return a list of results.
        Each result should be a dict:
        {
            'title': str,
            'price': float,
            'url': str,
            'image_url': str,
            'source': str ('wb' or 'ozon')
        }
        """
        pass

class SeleniumBackend(SearchBackend):
    def __init__(self, headless=True):
        self.headless = headless
        self.driver = None

    def _init_driver(self):
        if self.driver:
            return
        
        chrome_options = Options()
        if self.headless:
            chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_argument("user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        
        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service, options=chrome_options)

    def close(self):
        if self.driver:
            self.driver.quit()
            self.driver = None

class WBBackend(SeleniumBackend):
    def search(self, query):
        self._init_driver()
        results = []
        try:
            # Wildberries Search
            print(f"Searching WB for: {query}")
            encoded_query = urllib.parse.quote(query)
            url = f"https://www.wildberries.ru/catalog/0/search.aspx?search={encoded_query}"
            
            self.driver.get(url)
            
            # Wait for results
            wait = WebDriverWait(self.driver, 15)
            wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".product-card")))
            
            # Parse results (top 5)
            cards = self.driver.find_elements(By.CSS_SELECTOR, ".product-card")
            for card in cards[:5]:
                try:
                    # Title
                    try:
                        title_el = card.find_element(By.CSS_SELECTOR, ".product-card__name")
                        title = title_el.text.strip()
                    except:
                        title = card.get_attribute("aria-label") or "Unknown Title"

                    # Price
                    try:
                        price_el = card.find_element(By.CSS_SELECTOR, ".price__lower-price")
                        price_text = price_el.text.replace("₽", "").replace(" ", "").strip()
                        price = float(price_text)
                    except:
                        price = 0.0

                    # Link
                    link_el = card.find_element(By.TAG_NAME, "a")
                    link = link_el.get_attribute("href")
                    
                    # Image
                    try:
                        img_el = card.find_element(By.CSS_SELECTOR, "img.j-thumbnail")
                        img_url = img_el.get_attribute("src")
                    except:
                        img_url = None

                    results.append({
                        'title': title,
                        'price': price,
                        'url': link,
                        'image_url': img_url,
                        'source': 'wb'
                    })
                except Exception as e:
                    print(f"Error parsing card: {e}")
                    continue

        except Exception as e:
            print(f"Search error: {e}")
            pass
            
        return results

class OzonBackend(SearchBackend):
    def search(self, query):
        results = []
        try:
            print(f"Searching Ozon (via curl_cffi) for: {query}")
            encoded_query = urllib.parse.quote(query)
            url = f"https://www.ozon.ru/search/?text={encoded_query}&from_global=true"
            
            # Impersonate Chrome to bypass bot protection
            response = crequests.get(
                url, 
                impersonate="chrome120",
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                    "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
                    "Referer": "https://www.ozon.ru/"
                },
                timeout=30
            )
            
            if response.status_code != 200:
                print(f"Ozon returned status code: {response.status_code}")
                return []

            # Parse HTML
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Debug: Check title
            page_title = soup.title.string if soup.title else "No Title"
            # print(f"Ozon Page Title: {page_title}")
            
            if "Доступ ограничен" in page_title or "Access denied" in page_title:
                print("Ozon blocked the request.")
                return []

            # Ozon structure is complex. We look for tiles.
            # Strategy: Find elements that contain price and image.
            # Ozon often uses 'tile-root' or similar, but classes are obfuscated.
            # We'll look for <a> tags that have an <img> and some text with '₽' nearby.
            
            # Find all links
            links = soup.find_all('a', href=True)
            
            count = 0
            seen_urls = set()
            
            for link in links:
                if count >= 5:
                    break
                    
                href = link['href']
                if '/product/' not in href:
                    continue
                    
                # Clean URL (remove query params)
                if '?' in href:
                    clean_href = href.split('?')[0]
                else:
                    clean_href = href
                
                # Make absolute
                if not clean_href.startswith('http'):
                    clean_href = "https://www.ozon.ru" + clean_href
                    
                if clean_href in seen_urls:
                    continue
                    
                # Check if this link or its children has an image
                img = link.find('img')
                if not img:
                    continue
                    
                img_src = img.get('src')
                if not img_src:
                    continue
                    
                # Try to find title and price
                title = img.get('alt') or "Unknown Ozon Product"
                
                # Price is harder. It's usually in a span with '₽'
                # We need to look at the parent container of the link to find the price
                price = 0.0
                try:
                    parent = link.parent
                    # Go up a few levels
                    for _ in range(3):
                        if parent:
                            parent = parent.parent
                    
                    if parent:
                        text = parent.get_text()
                        # Match 1 234 ₽ or 1234 ₽
                        price_match = re.search(r'([\d\s]+)\s*₽', text)
                        if price_match:
                            price_str = price_match.group(1).replace(' ', '').replace('\u2009', '')
                            price = float(price_str)
                except:
                    pass
                
                if price > 0: # Only add if we found a price
                    seen_urls.add(clean_href)
                    results.append({
                        'title': title,
                        'price': price,
                        'url': clean_href,
                        'image_url': img_src,
                        'source': 'ozon'
                    })
                    count += 1

        except Exception as e:
            print(f"Ozon Search error: {e}")
            
        return results

class MockBackend(SearchBackend):
    def search(self, query):
        return [
            {
                'title': f"Mock Result for {query}",
                'price': 1000.0,
                'url': "http://example.com",
                'image_url': "http://example.com/image.jpg",
                'source': 'mock'
            }
        ]
