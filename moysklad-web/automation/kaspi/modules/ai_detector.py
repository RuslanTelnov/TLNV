import os
import requests
import json
from dotenv import load_dotenv
import sys
from typing import List, Dict, Optional, Tuple, Any

# Load environment variables from the root .env.local if it exists
# We are currently in moysklad-web/automation/kaspi/modules/
# .env.local is in moysklad-web/.env.local
current_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(current_dir, '..', '..', '..', '.env.local')
load_dotenv(env_path)

def detect_category_ai(product_name, product_description, categories_list):
    """
    Uses Gemini API via HTTP to classify a product into one of the Kaspi categories.
    """
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("⚠️ GOOGLE_API_KEY not found in environment", file=sys.stderr)
        return None, None
    
    # Prepare categories text
    # categories_list is a list of {"code": "...", "title": "..."}
    cats_text = "\n".join([f"{c['code']} | {c['title']}" for c in categories_list])
    
    prompt = f"""
Вы - ассистент по классификации товаров для Kaspi.kz.
У вас есть список категорий Kaspi (код | название).
Ваша задача: определить наиболее подходящую категорию для товара.

Товар: {product_name}
Описание: {product_description}

Список категорий:
{cats_text}

Инструкции:
1. Выберите ОДИН код категории из списка выше, который наиболее точно описывает товар.
2. Ответьте ТОЛЬКО кодом категории.
3. Если подходящей категории совсем нет (даже общей по смыслу), ответьте "NONE".
4. Если товар - спортивная одежда (рашгард, топ, кофта), ищите 'Women hoodies', 'Women t-shirts' или 'Women sport suits'.
5. Если товар - парфюм (духи, туалетная вода), ищите категории со словом 'Perfumes'.

Ответ:"""

    # Try Gemini first
    if api_key:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key={api_key}"
        headers = {'Content-Type': 'application/json'}
        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }]
        }

        try:
            response = requests.post(url, headers=headers, json=payload)
            if response.status_code == 200:
                data = response.json()
                if 'candidates' in data and len(data['candidates']) > 0:
                    result = data['candidates'][0]['content']['parts'][0]['text'].strip()
                    print(f"DEBUG: AI raw response: {result}", file=sys.stderr)
                    # Check if result is a valid code
                    valid_codes = [c['code'] for c in categories_list]
                    if result in valid_codes:
                        for c in categories_list:
                            if c['code'] == result:
                                return result, c['title']
                    # Partial match
                    for code in valid_codes:
                        if code in result:
                            for c in categories_list:
                                if c['code'] == code:
                                    return code, c['title']
                else:
                    print(f"⚠️ AI returned no candidates: {data}", file=sys.stderr)
            else:
                print(f"⚠️ Gemini Error {response.status_code}: {response.text}", file=sys.stderr)
        except Exception as e:
            print(f"❌ Gemini Exception: {e}", file=sys.stderr)

    # Try OpenAI as fallback
    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key:
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {openai_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "gpt-4o",
            "messages": [{"role": "user", "content": prompt}]
        }
        try:
            response = requests.post(url, headers=headers, json=payload)
            if response.status_code == 200:
                data = response.json()
                result = data['choices'][0]['message']['content'].strip()
                valid_codes = [c['code'] for c in categories_list]
                for code in valid_codes:
                    if code in result:
                        for c in categories_list:
                            if c['code'] == code:
                                return code, c['title']
            else:
                print(f"⚠️ OpenAI Error {response.status_code}: {response.text}", file=sys.stderr)
        except Exception as e:
            print(f"❌ OpenAI Exception: {e}", file=sys.stderr)

    return None, None

def fill_attributes_ai(name: str, description: str, attributes: List[Dict]) -> Dict[str, any]:
    """
    Uses AI to fill attribute values based on product data.
    """
    prompt = f"""
I have a product:
Name: {name}
Description: {description}

I need to fill the following attributes for Kaspi.kz. 
For each attribute, provide a value.
- If it's 'enum', choose ONE value from the options. Respond ONLY with the value from 'options'.
- If it's 'string' or 'number', provide a suitable value.
- If it's 'boolean', return true or false.
- Respond ONLY with a JSON dictionary where keys are attribute codes and values are the chosen values.

Attributes to fill:
{json.dumps(attributes, ensure_ascii=False, indent=2)}

JSON Result:
"""
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
         return {}

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-lite-latest:generateContent?key={api_key}"
    headers = {'Content-Type': 'application/json'}
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "response_mime_type": "application/json"
        }
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        if response.status_code == 200:
            result = response.json()
            text = result['candidates'][0]['content']['parts'][0]['text']
            return json.loads(text)
    except Exception as e:
        print(f"Error in AI attribute filling: {e}", file=sys.stderr)
        
    return {}

if __name__ == "__main__":
    # Test
    test_name = "Духи Versace Pour Femme Dylan Turquoise"
    test_desc = "Оригинальный аромат для женщин."
    # Light test list
    test_cats = [
        {"code": "Master - Perfumes", "title": "Парфюмерия"},
        {"code": "Master - Lipsticks", "title": "Помады, контуры, блески"},
        {"code": "Master - Cups and saucers sets", "title": "Кружки и наборы"}
    ]
    code, title = detect_category_ai(test_name, test_desc, test_cats)
    print(f"Detected: {code} ({title})")
