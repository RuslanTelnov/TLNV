from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import os

def research_wb_search():
    print("Starting WB Image Search Research...")
    
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    # Add user agent to avoid bot detection
    chrome_options.add_argument("user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    try:
        driver.get("https://www.wildberries.ru")
        print("Page loaded.")
        
        # Wait for search bar
        wait = WebDriverWait(driver, 10)
        
        # Try to find file input
        # It might be hidden, so we look for input[type='file']
        try:
            file_input = driver.find_element(By.CSS_SELECTOR, "input[type='file']")
            print("Found file input!")
        except:
            print("File input not found directly. Dumping page source to find it...")
            with open("wb_source.html", "w", encoding="utf-8") as f:
                f.write(driver.page_source)
            print("Saved wb_source.html")
            
            # Try to click the camera button to trigger input creation?
            # The camera button usually has a class like 'search-catalog__btn--photo' or similar
            try:
                # Try a more generic selector or look for aria-label
                camera_btn = driver.find_element(By.CSS_SELECTOR, "button[aria-label='Поиск по фото']")
                camera_btn.click()
                print("Clicked camera button.")
                time.sleep(1)
                file_input = driver.find_element(By.CSS_SELECTOR, "input[type='file']")
                print("Found file input after click!")
            except Exception as e:
                print(f"Could not find/click camera button: {e}")
                return

        # Upload file
        img_path = os.path.abspath("kaspi-automation/data/images/test_hat.jpg")
        print(f"Uploading {img_path}...")
        file_input.send_keys(img_path)
        
        # Wait for URL change
        print("Waiting for results...")
        time.sleep(10)
        
        print(f"Current URL: {driver.current_url}")
        
        # Check for products
        products = driver.find_elements(By.CSS_SELECTOR, ".product-card")
        print(f"Found {len(products)} products.")
        
        if len(products) > 0:
            print("First product link: " + products[0].find_element(By.TAG_NAME, "a").get_attribute("href"))

    except Exception as e:
        print(f"Error: {e}")
    finally:
        driver.quit()

if __name__ == "__main__":
    research_wb_search()
