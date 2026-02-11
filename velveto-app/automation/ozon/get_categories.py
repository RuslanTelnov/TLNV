import requests
import json
import os
from dotenv import load_dotenv

import sys

# Load env from ozon-automation folder
load_dotenv(os.path.join(os.getcwd(), "ozon-automation", ".env.ozon"))

OZON_CLIENT_ID = os.getenv('OZON_CLIENT_ID')
OZON_API_KEY = os.getenv('OZON_API_KEY')

search_term = sys.argv[1] if len(sys.argv) > 1 else 'рюкзак'
print(f"🔍 Searching for: {search_term}")

headers = {
    'Client-Id': OZON_CLIENT_ID,
    'Api-Key': OZON_API_KEY,
    'Content-Type': 'application/json'
}

print(f"Client ID: {OZON_CLIENT_ID}")
print(f"API Key: {OZON_API_KEY[:5]}..." if OZON_API_KEY else "API Key: None")

# Get category tree to find correct category for backpacks
print("Getting category tree...", flush=True)
response = requests.post(
    "https://api-seller.ozon.ru/v1/description-category/tree",
    headers=headers,
    json={}
)

print(f"Status: {response.status_code}")

if response.status_code == 200:
    data = response.json()
    with open('category_tree.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print("✅ Saved category tree to category_tree.json")
    
    # Search for backpack/рюкзак categories
    def search_categories(categories, search_term, path="", parent_id=None):
        results = []
        current_cat_id = None
        # Try to find the category ID for the current level to pass as parent to children
        for cat in categories:
             if cat.get('description_category_id'):
                 current_cat_id = cat.get('description_category_id')
                 break
        
        for cat in categories:
            # Check both category_name and type_name
            name = cat.get('category_name') or cat.get('type_name') or ''
            cat_id = cat.get('description_category_id') or cat.get('type_id')
            
            # If this node has a description_category_id, it becomes the parent for its children
            # If it's a type, the parent is passed from above
            my_parent = parent_id
            if cat.get('description_category_id'):
                my_parent = cat.get('description_category_id') # This node IS a category
            
            # But wait, if I am a child type, my parent is the loop's parent_id
            # If I am a category, I don't need a parent_id usually, unless I am a sub-category?
            # Ozon structure: Category -> [Category...] -> [Type...]
            # Types need the ID of the *immediate* Category containing them.
            
            effective_parent = parent_id
            if cat.get('description_category_id'):
                 effective_parent = cat.get('description_category_id')

            if name and search_term.lower() in name.lower():
                results.append({
                    'path': path + "/" + name,
                    'id': cat_id,
                    'name': name,
                    'is_type': 'type_id' in cat,
                    'parent_id': parent_id if 'type_id' in cat else None
                })
            
            if 'children' in cat:
                # Pass down the correct parent ID
                # If this node is a category, pass its ID. If not, pass the current parent.
                next_parent = cat.get('description_category_id') if cat.get('description_category_id') else parent_id
                results.extend(search_categories(cat['children'], search_term, path + "/" + name, next_parent))
        return results
    
    found_cats = search_categories(data.get('result', []), search_term)
    print(f"\nFound {len(found_cats)} categories for '{search_term}':")
    for cat in found_cats[:20]:
        print(f"  - {cat['name']} (ID: {cat['id']}, Is Type: {cat['is_type']}, Parent ID: {cat['parent_id']})")
        print(f"    Path: {cat['path']}")
else:
    print(f"Error: {response.text}")
