import sys
import json
import argparse
import os
from market_scout import MarketScout

def main():
    parser = argparse.ArgumentParser(description='Market Scout CLI')
    parser.add_argument('--title', help='Product title to search (optional if using --ms_name)')
    parser.add_argument('--price', type=float, default=0, help='Target price')
    parser.add_argument('--image_url', help='Target image URL (http or local path)')
    parser.add_argument('--ms_name', help='Search product in MoySklad by name')
    
    args = parser.parse_args()
    
    try:
        scout = MarketScout()
        
        target_title = args.title
        target_price = args.price
        img_url = args.image_url
        
        # 1. Handle MS Search
        if args.ms_name:
            from market_scout.ms_search import MSSearch
            ms = MSSearch()
            print(f"Searching MoySklad for: {args.ms_name}...")
            ms_prod = ms.search_product(args.ms_name)
            
            if ms_prod:
                print(f"Found in MS: {ms_prod['name']}")
                # Use MS name if no title provided
                if not target_title:
                    target_title = ms_prod['name']
                
                # Get Image
                fetched_img = ms.get_product_image(ms_prod['id'])
                if fetched_img:
                    print(f"Got image from MS: {fetched_img}")
                    img_url = fetched_img
                else:
                    print("No image found in MS for this product.")
            else:
                print(f"Product '{args.ms_name}' not found in MoySklad.")
                if not target_title:
                     print("No title provided and MS search failed. Exiting.")
                     sys.exit(1)

        if not target_title:
            print("Error: Product title is required (either via --title or found via --ms_name)")
            sys.exit(1)

        # Handle image URL (local path resolution)
        if img_url and not img_url.startswith('http'):
            if not os.path.isabs(img_url):
                img_url = os.path.abspath(img_url)
        
        matches = scout.find_matches(
            product_title=target_title,
            product_price=target_price,
            product_image_url=img_url,
            threshold=0.0 # Return all for now
        )
        
        # Output pure JSON to stdout
        # We might have printed debug info, so we need to be careful if this is consumed by API.
        # The API currently captures stdout. We should probably silence debug prints or separate them.
        # For now, let's just print the JSON at the end.
        print("JSON_START")
        print(json.dumps(matches, ensure_ascii=False))
        print("JSON_END")
        
    except Exception as e:
        # Output error as JSON
        error_response = {"error": str(e)}
        print("JSON_START")
        print(json.dumps(error_response, ensure_ascii=False))
        print("JSON_END")
        sys.exit(1)
    finally:
        if 'scout' in locals():
            scout.close()

if __name__ == "__main__":
    main()
