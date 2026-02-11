
import json
import io
import os
import sys
from collections import Counter

def analyze_categories():
    json_path = os.path.join(os.path.dirname(__file__), 'data', 'kaspi_categories.json')
    
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            categories = json.load(f)
            
        total = len(categories)
        print(f"Total Categories: {total}")
        
        # Analyze distribution
        words = []
        for cat in categories:
            title = cat.get('title', '').lower()
            # Split by simple space to get main words
            w = title.split(' ')
            words.extend([x for x in w if len(x) > 3])
            
        counter = Counter(words)
        print("\nTop 50 common words in Category Titles:")
        for word, count in counter.most_common(50):
            print(f"{word}: {count}")
            
        print("\nSample Categories (First 10):")
        for c in categories[:10]:
            print(f"- {c['title']} ({c['code']})")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    analyze_categories()
