from market_scout import MarketScout
import os

def run_demo():
    print("Initializing Market Scout...")
    scout = MarketScout()
    
    # Test Product: A generic item we expect to find
    # Using the local test image we have
    img_path = os.path.abspath("kaspi-automation/data/images/test_hat.jpg")
    
    product = {
        "title": "Панама", # Broad search to ensure results
        "price": 5000,     # Arbitrary price
        "image_url": img_path
    }
    
    try:
        matches = scout.find_matches(
            product_title=product["title"],
            product_price=product["price"],
            product_image_url=product["image_url"],
            threshold=0.0
        )
        
        print("\n--- Match Results ---")
        for m in matches:
            print(f"Title: {m['title']}")
            print(f"Price: {m['price']}")
            print(f"Score: {m['match_score']:.2f}")
            print(f"URL: {m['url']}")
            print("---")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        scout.close()

if __name__ == "__main__":
    run_demo()
