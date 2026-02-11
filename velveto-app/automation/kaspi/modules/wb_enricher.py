"""
Wildberries Product Data Enricher

This module fetches full product details from Wildberries public API
to enrich basic product data with attributes, specifications, and other details.
"""

import requests
import json
import sys
import os
from typing import Dict, Optional, List


class WBEnricher:
    """Enriches WB product data by fetching from public API."""
    
    @staticmethod
    def get_basket_number(nm_id):
        vol = nm_id // 100000
        part = nm_id // 1000
        return vol, part

    @staticmethod
    def fetch_wb_product_details(nm_id: int) -> Optional[Dict]:
        """
        Fetch full product details from WB using fast JSON APIs.
        """
        vol, part = WBEnricher.get_basket_number(nm_id)
        details = {}
        host = None
        
        print(f"🔍 Fetching details for {nm_id} via JSON API...", file=sys.stderr)
        
        # 1. Fetch info/ru/card.json (Basic info & Attributes)
        for i in range(1, 41):
            h = f"basket-{i:02d}.wbbasket.ru"
            url = f"https://{h}/vol{vol}/part{part}/{nm_id}/info/ru/card.json"
            try:
                resp = requests.get(url, timeout=2)
                if resp.status_code == 200:
                    details = resp.json()
                    host = h
                    break
            except:
                continue
        
        # 2. Fetch v4/detail (Pricing, Images count, etc.)
        v4_url = f"https://card.wb.ru/cards/v4/detail?appType=1&curr=kzt&dest=82&nm={nm_id}"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        try:
            v4_resp = requests.get(v4_url, headers=headers, timeout=5)
            if v4_resp.status_code == 200:
                v4_data = v4_resp.json()
                products = v4_data.get('data', {}).get('products', []) or v4_data.get('products', [])
                if products:
                    details['v4_data'] = products[0]
                    
                    # Ensure images are available
                    pics_count = products[0].get('pics', 0)
                    image_urls = []
                    # Try to use host found earlier or fallback
                    active_host = host or "basket-01.wbbasket.ru"
                    for i_img in range(1, min(max(pics_count, 1), 6)):
                        image_urls.append(f"https://{active_host}/vol{vol}/part{part}/{nm_id}/images/big/{i_img}.webp")
                    details['image_urls'] = image_urls
                    
                    # Store name and description if not already in details
                    if 'imt_name' not in details and products[0].get('name'):
                         details['imt_name'] = products[0].get('name')
        except Exception as e:
            print(f"  ⚠️ Error fetching v4 details: {e}", file=sys.stderr)
            
        if details:
            print(f"✅ Successfully fetched data from API for {nm_id}", file=sys.stderr)
            return details
        return None
    
    @staticmethod
    def extract_attributes(wb_data: Dict) -> Dict[str, str]:
        """
        Extract and structure attributes from WB product data.
        """
        attributes = {}
        
        # Extract from options (main attributes)
        if 'options' in wb_data:
            for option in wb_data['options']:
                name = option.get('name', '')
                value = option.get('value', '')
                if name and value:
                    attributes[name] = value
        
        # Extract description
        if 'description' in wb_data:
            attributes['Описание'] = wb_data['description']
        
        return attributes
    
    @staticmethod
    def enrich_product_data(basic_product: Dict) -> Dict:
        """
        Enrich basic product data with full WB details.
        """
        nm_id = basic_product.get('id')
        if not nm_id:
            print("❌ No product ID provided", file=sys.stderr)
            return basic_product
        
        print(f"🔍 Fetching details for WB product {nm_id}...", file=sys.stderr)
        wb_data = WBEnricher.fetch_wb_product_details(nm_id)
        
        if not wb_data:
            print(f"⚠️  Could not fetch WB details, using basic data", file=sys.stderr)
            return basic_product
        
        # Extract attributes
        attributes = WBEnricher.extract_attributes(wb_data)
        
        # Merge with basic product data
        enriched = basic_product.copy()
        enriched['attributes'] = attributes
        enriched['wb_full_data'] = wb_data  # Keep full data for reference
        
        if 'imt_name' in wb_data:
             enriched['name'] = wb_data['imt_name']
             
        if 'image_urls' in wb_data and wb_data['image_urls']:
             enriched['image_url'] = wb_data['image_urls'][0]
             if 'specs' not in enriched or not isinstance(enriched['specs'], dict):
                  enriched['specs'] = {}
             enriched['specs']['image_urls'] = wb_data['image_urls']
        elif wb_data.get('v4_data', {}).get('pics') == 0:
             print(f"⚠️  No images found for WB product {nm_id}", file=sys.stderr)

        print(f"✅ Enriched product with {len(attributes)} attributes", file=sys.stderr)
        return enriched


def main():
    """CLI interface for testing."""
    if len(sys.argv) < 2:
        print("Usage: python wb_enricher.py <nm_id>")
        sys.exit(1)
    
    nm_id = int(sys.argv[1])
    
    # Fetch details
    details = WBEnricher.fetch_wb_product_details(nm_id)
    if details:
        print(json.dumps(details, indent=2, ensure_ascii=False))
    else:
        print("Failed to fetch product details")
        sys.exit(1)


if __name__ == "__main__":
    main()
