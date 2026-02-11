from .backends import WBBackend, OzonBackend, MockBackend
from .image_matcher import ImageMatcher
import concurrent.futures

class MarketScout:
    def __init__(self, use_mock=False):
        if use_mock:
            self.backends = [MockBackend()]
        else:
            self.backends = [WBBackend(), OzonBackend()]
            
        self.matcher = ImageMatcher()

    def find_matches(self, product_title, product_price, product_image_url, threshold=0.8):
        """
        Finds matching products for a given item.
        Returns a list of matches with confidence scores.
        """
        print(f"Scouting for: {product_title}")
        
        # 1. Search (Parallel execution for speed)
        candidates = []
        
        # Helper to run search safely
        def run_search(backend):
            try:
                return backend.search(product_title)
            except Exception as e:
                print(f"Backend error: {e}")
                return []

        with concurrent.futures.ThreadPoolExecutor(max_workers=len(self.backends)) as executor:
            future_to_backend = {executor.submit(run_search, b): b for b in self.backends}
            for future in concurrent.futures.as_completed(future_to_backend):
                try:
                    results = future.result()
                    candidates.extend(results)
                except Exception:
                    pass
        
        print(f"Found {len(candidates)} candidates.")
        
        matches = []
        
        # 2. Verify
        if not product_image_url:
            print("No target image provided. Skipping verification.")
            # If no image, return all candidates but mark as unverified
            for c in candidates:
                c['match_score'] = 0.0
            return candidates

        if product_image_url.startswith("http"):
            target_image = self.matcher.load_image_from_url(product_image_url)
        else:
            target_image = self.matcher.load_image_from_path(product_image_url)
            
        if target_image is None:
            print("Could not load target image. Skipping verification.")
            return []

        for cand in candidates:
            print(f"Verifying candidate ({cand.get('source')}): {cand['title']}")
            
            # Price Check (optional)
            if cand['price'] > 0 and product_price > 0:
                price_diff = abs(cand['price'] - product_price)
                price_ratio = price_diff / product_price
                if price_ratio > 0.5: 
                    print(f"Price mismatch: {cand['price']} vs {product_price}")
                    pass
            
            # Image Check
            if cand['image_url']:
                cand_image = self.matcher.load_image_from_url(cand['image_url'])
                score = self.matcher.compare_images(target_image, cand_image)
                print(f"Image Score: {score:.2f}")
                
                if score >= threshold:
                    cand['match_score'] = score
                    matches.append(cand)
            else:
                print("No image URL for candidate.")
                pass
                
        # Sort by score
        matches.sort(key=lambda x: x['match_score'], reverse=True)
        
        # Calculate Lowest Price among matches
        lowest_price = float('inf')
        best_deal = None
        
        for m in matches:
            if m['price'] > 0 and m['price'] < lowest_price:
                lowest_price = m['price']
                best_deal = m
                
        # Mark the best deal
        if best_deal:
            best_deal['is_best_price'] = True
            
        return matches

    def close(self):
        for b in self.backends:
            if hasattr(b, 'close'):
                b.close()
