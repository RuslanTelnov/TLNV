import os
import requests
import json
from dotenv import load_dotenv
import sys
from typing import List, Dict, Optional, Tuple, Any

# Load environment variables from the root .env.local if it exists
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

Ответ:"""

    # Try Gemini first
    if api_key:
        # Using gemini-flash-latest as discovered in list-models
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={api_key}"
        headers = {'Content-Type': 'application/json'}
        payload = {
            "contents": [{"parts": [{"text": prompt}]}]
        }

        try:
            response = requests.post(url, headers=headers, json=payload)
            if response.status_code == 200:
                data = response.json()
                if 'candidates' in data and len(data['candidates']) > 0:
                    result = data['candidates'][0]['content']['parts'][0]['text'].strip()
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
                print(f"⚠️ Gemini Error {response.status_code}: {response.text}", file=sys.stderr)
        except Exception as e:
            print(f"❌ Gemini Exception: {e}", file=sys.stderr)

    return None, None

def fill_attributes_ai(name: str, description: str, attributes: List[Dict], raw_attributes: Dict = None) -> Dict[str, any]:
    """
    Uses AI to fill attribute values based on product data, with robust fallbacks.
    """
    if raw_attributes is None:
        raw_attributes = {}
        
    # 1. Prepare Prompt
    raw_attrs_text = json.dumps(raw_attributes, ensure_ascii=False, indent=2)
    prompt = f"""
I have a product from Wildberries:
Name: {name}
Description: {description}

Full specifications from Wildberries:
{raw_attrs_text}

I need to fill the following attributes for Kaspi.kz. 
For each attribute, provide a value.
- If it's 'enum', choose ONE value from the options. Respond ONLY with the value from 'options'. Match the case and spelling exactly.
- If it's 'string' or 'number', provide a suitable value based on the specifications above. If unknown, use "Нет" or "Generic".
- If it's 'boolean', return true or false.
- Respond ONLY with a JSON dictionary where keys are attribute codes and values are the chosen values.

Attributes to fill:
{json.dumps(attributes, ensure_ascii=False, indent=2)}

JSON Result:
"""
    api_key = os.environ.get("GOOGLE_API_KEY")
    result_data = {}
    
    # 2. Call AI (if key exists)
    if api_key:
        # Using gemini-flash-latest as discovered in list-models
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={api_key}"
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
                data = response.json()
                if 'candidates' in data and data['candidates']:
                    text = data['candidates'][0]['content']['parts'][0]['text']
                    result_data = json.loads(text)
        except Exception as e:
            print(f"Error in AI attribute filling: {e}", file=sys.stderr)
    
    # 3. Fallback / Validation ensures we NEVER return empty for mandatory fields
    final_attributes = {}
    
    for attr in attributes:
        code = attr.get('code')
        attr_type = attr.get('type', 'string')
        mandatory = attr.get('mandatory', False)
        
        # Start with AI value
        val = result_data.get(code)
        
        # If AI gave nothing, apply fallback
        if val is None or val == "":
            if attr_type == 'enum' and 'values' in attr:
                # Pick first available option for enum
                options = []
                for v in attr['values']:
                    if isinstance(v, dict):
                        # Kaspi API is inconsistent: check title, name, or code
                        opt_val = v.get('title') or v.get('name') or v.get('code') or v.get('id')
                        if opt_val:
                            options.append(str(opt_val))
                    else:
                        options.append(str(v))
                
                if options:
                    val = options[0]
            elif attr_type == 'boolean':
                val = False
            elif attr_type in ['string', 'text']:
                val = "Нет" if mandatory else None
            elif attr_type in ['int', 'float', 'number']:
                val = 0 if mandatory else None
                
        if val is not None:
             final_attributes[code] = val
             
    return final_attributes
