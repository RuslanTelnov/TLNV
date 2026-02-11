import sys
import os
import json
import argparse
from modules.requests_scraper import search_product_requests, scrape_product_requests
from modules.creator import prepare_card_payload, create_card
import publish_offer
import config

def main():
    parser = argparse.ArgumentParser(description="Kaspi Card Automation")
    parser.add_argument("article", help="Article/SKU to search for")
    parser.add_argument("--create", action="store_true", help="Attempt to create the card via API")
    parser.add_argument("--title", help="Override the product title")
    parser.add_argument("--price", type=int, help="Price to set (activates offer)")
    parser.add_argument("--stock", type=int, default=10, help="Stock quantity (default: 10)")
    parser.add_argument("--preorder", action="store_true", help="Set preorder mode (30 days)")
    args = parser.parse_args()
    
    article = args.article
    print(f"--- Starting Automation for Article: {article} ---")
    
    # 1. Search
    print("\n[1] Searching for product...")
    product_url = search_product_requests(article)
    
    if not product_url:
        print("❌ Product not found.")
        return
        
    print(f"✅ Found URL: {product_url}")
    
    # 2. Scrape
    print("\n[2] Scraping product details...")
    scraped_data = scrape_product_requests(product_url)
    
    if not scraped_data:
        print("❌ Failed to scrape product.")
        return
        
    # Override title if provided
    if args.title:
        print(f"✏️  Overriding title: '{scraped_data.get('title')}' -> '{args.title}'")
        scraped_data['title'] = args.title
        
    print("✅ Scraped Data:")
    print(f"   Title: {scraped_data.get('title')}")
    print(f"   Images: {len(scraped_data.get('images', []))}")
    print(f"   Attributes: {len(scraped_data.get('attributes', {}))}")
    
    # Save to file
    output_file = os.path.join(config.DATA_DIR, f"{article}_scraped.json")
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(scraped_data, f, indent=2, ensure_ascii=False)
    print(f"💾 Saved scraped data to {output_file}")
    
    # 3. Prepare Payload
    print("\n[3] Preparing creation payload...")
    payload = prepare_card_payload(scraped_data, article)
    
    payload_file = os.path.join(config.DATA_DIR, f"{article}_payload.json")
    with open(payload_file, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)
    print(f"💾 Saved payload to {payload_file}")
    
    # 4. Create (Optional)
    if args.create:
        print("\n[4] Creating card on Kaspi...")
        if create_card(payload):
            print("✅ Card creation initiated successfully.")
        else:
            print("❌ Card creation failed.")
            
    # 5. Publish Offer (Price/Stock)
    # Always try to publish offer if create was requested, or if explicit price/preorder flags are used
    if args.create or args.price or args.preorder:
        print("\n[5] Publishing Offer (Price & Stock)...")
        # If price is not provided, publish_offer will try to fetch it
        if publish_offer.publish_offer(article, args.price, args.stock, args.preorder):
             print("✅ Offer published successfully. Product should be active.")
        else:
             print("❌ Failed to publish offer.")
    else:
        print("\nℹ️  Run with --create to perform API call.")

if __name__ == "__main__":
    main()
