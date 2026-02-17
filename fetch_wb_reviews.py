import requests
import json
import os
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client

def get_imt_id(nm_id):
    """
    Finds the imt_id (group id) for a given nm_id (product id)
    """
    vol = int(nm_id) // 100000
    part = int(nm_id) // 1000
    for i in range(1, 41):
        h = f"basket-{i:02d}.wbbasket.ru"
        url = f"https://{h}/vol{vol}/part{part}/{nm_id}/info/ru/card.json"
        try:
            resp = requests.get(url, timeout=1)
            if resp.status_code == 200:
                return resp.json().get('imt_id')
        except:
            continue
    return None

def fetch_public_reviews(nm_id):
    """
    Fetches public reviews for a WB product without needing a token.
    """
    imt_id = get_imt_id(nm_id)
    if not imt_id:
        print(f"Could not find imt_id for {nm_id}")
        return None
        
    print(f"Found imt_id {imt_id} for product {nm_id}")
    url = f"https://feedbacks1.wb.ru/feedbacks/v1/{imt_id}"
    
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Failed to fetch reviews for {nm_id}. Status: {response.status_code}")
            return None
    except Exception as e:
        print(f"Error fetching reviews for {nm_id}: {e}")
        return None

def save_reviews_to_supabase(reviews_data, product_id):
    load_dotenv('.env')
    load_dotenv('temp_tlnv_parser/velveto-app/.env.local')
    
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")
    
    if not url or not key:
        print("Missing Supabase credentials")
        return

    supabase = create_client(url, key)
    
    feedbacks = reviews_data.get('feedbacks', [])
    if not feedbacks:
        print(f"No feedbacks found for {product_id}")
        return

    to_insert = []
    for fb in feedbacks:
        # Check if feedback is for our specific nm_id if multiple in imt
        fb_nm_id = fb.get('nmId')
        if fb_nm_id and str(fb_nm_id) != str(product_id):
            continue
            
        to_insert.append({
            "marketplace": "wb",
            "product_id": str(product_id),
            "external_review_id": str(fb.get('id')),
            "text": fb.get('text'),
            "pros": fb.get('pros'),
            "cons": fb.get('cons'),
            "rating": fb.get('productValuation'),
            "user_name": fb.get('wbUserDetails', {}).get('name'),
            "review_date": fb.get('createdDate'),
            "is_analyzed": False
        })
    
    if to_insert:
        try:
            # upsert based on marketplace + external_review_id would be better if we had a constraint
            # for now just insert
            res = supabase.table('market_reviews').insert(to_insert).execute()
            print(f"✅ Inserted {len(to_insert)} reviews for {product_id}")
        except Exception as e:
            print(f"❌ Error saving reviews: {e}")

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python3 fetch_wb_reviews.py <nm_id>")
    else:
        nm = sys.argv[1]
        data = fetch_public_reviews(nm)
        if data:
            save_reviews_to_supabase(data, nm)
