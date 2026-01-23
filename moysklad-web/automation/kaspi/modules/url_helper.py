import re
from typing import Optional

def extract_wb_article(input_str: str) -> Optional[str]:
    """
    Extracts Wildberries Article ID (nm_id) from a string or URL.
    
    Supported formats:
    - 195676297
    - https://www.wildberries.ru/catalog/195676297/detail.aspx
    - https://wildberries.ru/catalog/195676297/detail.aspx
    - https://by.wildberries.ru/catalog/195676297/detail.aspx
    - /catalog/195676297/detail.aspx
    """
    if not input_str:
        return None
        
    input_str = input_str.strip()
    
    # 1. Check if it's already a clean ID
    if input_str.isdigit():
        return input_str
        
    # 2. Try to extract from URL
    # Match pattern: /catalog/(\d+)/
    match = re.search(r'/catalog/(\d+)/', input_str)
    if match:
        return match.group(1)
        
    # 3. Try to extract first sequence of digits that looks like a WB ID (usually 7-9 digits)
    # This is a bit risky but helpful for messy inputs
    match = re.search(r'(\d{7,10})', input_str)
    if match:
        return match.group(1)
        
    return None

if __name__ == "__main__":
    # Test cases
    test_cases = [
        "195676297",
        "https://www.wildberries.ru/catalog/195676297/detail.aspx",
        "https://wildberries.ru/catalog/1234567/detail.aspx?targetUrl=GP",
        "/catalog/88888888/detail.aspx",
        "Product link: https://www.wildberries.ru/catalog/9999999/detail.aspx"
    ]
    
    for tc in test_cases:
        print(f"Input: {tc} -> Extracted: {extract_wb_article(tc)}")
