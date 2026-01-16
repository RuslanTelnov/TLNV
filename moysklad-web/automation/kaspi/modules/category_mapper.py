import re
import json
import os
import sys
from typing import Dict, List, Optional, Tuple


class KaspiCategoryMapper:
    """Maps products to Kaspi categories and generates required attributes."""
    
    # Restricted categories for Kaspi
    RESTRICTED_KEYWORDS = [
        "лекарство", "аптека", "алкоголь", "водка", "вино", "пиво", "сигареты", "табак", 
        "оружие", "нож", "пистолет", "бад", "витамины", "химия", "ядохимикаты",
        "интим", "sex", "эротика", "порно", "реплика", "копия", "1:1", "replica",
        "золото", "серебро", "бриллиант", "брильянт", "колецо", "серьги", 
        "медицинский", "шприц", "игла", "ветеринар", "корм для", "пиротехника", "фейерверк"
    ]

    # Category mappings based on keywords
    CATEGORY_MAP = {
        # Board games (Priority)
        'настольная игра': ('Master - Board games', 'games'),
        'настольные игры': ('Master - Board games', 'games'),
        'игра для компании': ('Master - Board games', 'games'),

        # Mugs and cups
        'кружка': ('Master - Cups and saucers sets', 'mugs'),
        'кружки': ('Master - Cups and saucers sets', 'mugs'),
        'чашка': ('Master - Cups and saucers sets', 'mugs'),
        'чашки': ('Master - Cups and saucers sets', 'mugs'),
        'стакан': ('Master - Cups and saucers sets', 'mugs'),
        'набор чашек': ('Master - Cups and saucers sets', 'mugs'),
        
        # Toys
        'игрушка': ('Master - Stuffed toys', 'toys'),
        'плюшевая': ('Master - Stuffed toys', 'toys'),
        'мягкая игрушка': ('Master - Stuffed toys', 'toys'),
        
        # Backpacks
        'рюкзак': ('Master - Backpacks', 'backpacks'),
        
        # Power banks
        'повербанк': ('Master - Power banks', 'powerbanks'),
        'power bank': ('Master - Power banks', 'powerbanks'),
        'внешний аккумулятор': ('Master - Power banks', 'powerbanks'),
        
        # Socks
        'носки': ('Master - Men socks', 'socks'),
        'socks': ('Master - Men socks', 'socks'),
        'набор носков': ('Master - Men socks', 'socks'),
        
        # Keychains
        'брелок': ('Master - Key wallets', 'keychains'),
        
        # Ab rollers
        'ролик для пресса': ('Master - Ab rollers', 'ab_rollers'),

        # Perfumes
        'духи': ('Master - Perfumes', 'perfumes'),
        'парфюм': ('Master - Perfumes', 'perfumes'),
        'туалетная вода': ('Master - Perfumes', 'perfumes'),
        'одеколон': ('Master - Perfumes', 'perfumes'),
        'parfum': ('Master - Perfumes', 'perfumes'),
        'fragrance': ('Master - Perfumes', 'perfumes'),
        'eau': ('Master - Perfumes', 'perfumes'),
        'edt': ('Master - Perfumes', 'perfumes'),
        'edp': ('Master - Perfumes', 'perfumes'),
        'аромат': ('Master - Perfumes', 'perfumes'),
        'пробник': ('Master - Perfumes', 'perfumes'),
        'распив': ('Master - Perfumes', 'perfumes'),
    }
    
    @classmethod
    def detect_category(cls, name: str, description: str = "") -> Tuple[Optional[str], Optional[str]]:
        """Detects category based on name and description keywords."""
        text = f"{name} {description}".lower()
        
        # Check for restricted categories first using word boundaries
        for restricted_kw in cls.RESTRICTED_KEYWORDS:
            # Use regex to match whole word only
            pattern = rf"\b{re.escape(restricted_kw)}\b"
            if re.search(pattern, text, re.IGNORECASE):
                print(f"⚠️ Detected restricted category keyword: {restricted_kw}", file=sys.stderr)
                return None, "restricted"

        # 1. Manual keyword mapping (fast pass)
        print(f"DEBUG: Checking '{text}' against map...", file=sys.stderr)
        for keyword, (cat_name, cat_type) in cls.CATEGORY_MAP.items():
            if keyword in text:
                print(f"DEBUG: Found match '{keyword}' -> {cat_name}", file=sys.stderr)
                return cat_name, cat_type
        
        # 2. Universal Search in kaspi_categories.json
        try:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            json_path = os.path.join(current_dir, '..', 'data', 'kaspi_categories.json')
            if os.path.exists(json_path):
                with open(json_path, 'r', encoding='utf-8') as f:
                    all_categories = json.load(f)
                
                # Improved filtering: score based on keyword matches (fuzzy)
                scored_cats = []
                keywords = [k for k in re.split(r'\W+', text) if len(k) > 3]
                for cat in all_categories:
                    cat_title = cat['title'].lower()
                    cat_words = re.split(r'\W+', cat_title)
                    score = 0
                    for kw in keywords:
                        kw_stem = kw[:4]
                        if any(cw.startswith(kw_stem) for cw in cat_words):
                            score += 1
                    
                    if score > 0:
                        scored_cats.append((score, cat))
                
                # Sort by score descending and take top 100
                scored_cats.sort(key=lambda x: x[0], reverse=True)
                potential_cats = [c for score, c in scored_cats[:100]]
                
                if not potential_cats:
                    # Fallback to some common ones
                    potential_cats = [c for c in all_categories if c['code'] in [
                        "Master - Cups and saucers sets", "Master - Backpacks", 
                        "Master - Board games", "Master - Household items"
                    ]]

                print(f"🤖 Universal AI classification for: {name} (Searching among {len(potential_cats)} candidates)", file=sys.stderr)
                from modules.ai_detector import detect_category_ai
                ai_code, ai_title = detect_category_ai(name, description, potential_cats)
                if ai_code:
                    return ai_code, "universal"
        except Exception as e:
            print(f"⚠️ Universal detection failed: {e}", file=sys.stderr)

        return None, None
    
    @staticmethod
    def get_required_attributes(category_type: str) -> List[str]:
        """
        Get list of required attributes for a category.
        """
        attribute_map = {
            'mugs': [
                'Cups and saucers sets*Type',
                'Cups and saucers sets*Volume',
                'Cups and saucers sets*Number of pieces',
                'Cups and saucers sets*Brand code',
                'Kitchenware*Color',
                'Kitchenware*Material',
            ],
            'toys': [
                'Stuffed toys*Type',
                'Stuffed toys*Height',
                'Stuffed toys*Filler',
                'Stuffed toys*Character',
                'Stuffed toys*View',
                'Toys*Age',
                'Toys*Gender',
                'Toys*Color',
                'Toys*Material',
            ],
            'backpacks': [
                'Backpacks*Material',
                'Backpacks*Clasp',
                'Backpacks*Style',
                'Backpacks*Depth',
                'Backpacks*Width',
                'Backpacks*Height',
                'Backpacks*Model',
                'Backpacks*Type',
                'Backpacks*Country',
                'Fashion accessories*Color',
                'Fashion accessories*For whom',
            ],
            'socks': [
                'Men socks*Type',
                'Men socks*Set',
                'Men socks*Manufacturer size',
                'Men socks*Fabric',
                'Men socks*Equipment',
                'Men socks*Notice1',
                'Clothes*Size',
                'Clothes*Colour',
                'Clothes*Manufacturer code',
            ],
            'powerbanks': [
                'Power banks*Capacity',
                'Power banks*Maximum output power',
                'Power banks*Outputs',
                'Power banks*Fast charge',
                'Power banks*Support wireless charging',
                'Power banks*Model',
                'Power banks*Color',
            ],
            'ab_rollers': [
                'Ab rollers*Wheels number',
                'Ab rollers*Max load',
                'Ab rollers*Wheels material',
                'Ab rollers*Material',
                'Ab rollers*Color',
                'Ab rollers*Vendor code',
            ],
            'perfumes': [
                'Perfumes*Tip', 'Perfumes*Perfume scent names', 'Perfumes*Family',
                'Perfumes*Gender', 'Perfumes*Notes', 'Perfumes*Middle notes',
                'Perfumes*Base notes', 'Perfumes*Size', 'Perfumes*Size1',
                'Perfumes*Country', 'Perfumes*Kind'
            ],
            'lipsticks': [
                'Lipsticks*Type', 'Lipsticks*Effect', 'Lipsticks*SPF',
                'Lipsticks*Colour', 'Lipsticks*Features', 'Lipsticks*Organic',
                'Lipsticks*Number of colours', 'Lipsticks*Shade number',
                'Lipsticks*Size', 'Lipsticks*Name', 'Decorative cosmetics*Country'
            ],
            'mascaras': [
                'Mascaras*Type', 'Mascaras*Effect', 'Mascaras*Colour',
                'Mascaras*Features', 'Decorative cosmetics*Country'
            ]
        }
        
        return attribute_map.get(category_type, [])
    
    @staticmethod
    def generate_attributes_for_mugs(product_name: str, product_description: str = "") -> Dict[str, str]:
        """
        Generate Kaspi attributes for mugs category.
        """
        attributes = {
            "Cups and saucers sets*Type": "кружка",
            "Cups and saucers sets*Number of pieces": 1,
            "Cups and saucers sets*Brand code": "нет", # Mandatory brand code, use "нет" if unknown
        }
        
        text = (product_name + " " + product_description).lower()

        # Generate 'Cups and saucers sets*Type' attribute
        if any(word in text for word in ['набор', 'комплект']):
            attributes["Cups and saucers sets*Type"] = "набор чашек"
            attributes["Cups and saucers sets*Number of pieces"] = 2 # Default to 2 for sets if not found
        
        text = (product_name + " " + product_description).lower()
        
        # Extract material
        if any(word in text for word in ['стекл', 'glass']):
            attributes["Kitchenware*Material"] = ["стекло"]
        elif any(word in text for word in ['керам', 'ceramic']):
            attributes["Kitchenware*Material"] = ["керамика"]
        elif any(word in text for word in ['фарф', 'porcelain']):
            attributes["Kitchenware*Material"] = ["фарфор"]
        else:
            attributes["Kitchenware*Material"] = ["керамика"]
        
        # Extract volume
        volume_match = re.search(r'(\d+)\s*(мл|ml)', text)
        if volume_match:
            attributes["Cups and saucers sets*Volume"] = int(volume_match.group(1))
        else:
            attributes["Cups and saucers sets*Volume"] = 350
        
        # Extract color
        colors = {
            'белый': 'белый', 'белая': 'белый',
            'черный': 'черный', 'черная': 'черный',
            'красный': 'красный', 'красная': 'красный',
            'синий': 'синий', 'синяя': 'синий',
        }
        
        found_color = "белый"
        for color_word, color_value in colors.items():
            if color_word in text:
                found_color = color_value
                break
        attributes["Kitchenware*Color"] = [found_color]
        
        return attributes
    
    @staticmethod
    def generate_attributes_for_socks(product_name: str, product_description: str = "") -> Dict[str, str]:
        """
        Generate Kaspi attributes for socks category.
        """
        attributes = {
            "Men socks*Type": ["носки"],
            "Men socks*Set": True,
            "Men socks*Manufacturer size": "36-41",
            "Men socks*Fabric": ["хлопок"],
            "Men socks*Equipment": "1 пара",
            "Men socks*Notice1": "не маломерят",
            "Clothes*Size": ["36-41"],
            "Clothes*Colour": ["черный"],
            "Clothes*Manufacturer code": "SOCKS-BK-01"
        }
        return attributes

    @staticmethod
    def generate_attributes_for_powerbanks(product_name: str, product_description: str = "") -> Dict[str, str]:
        """
        Generate Kaspi attributes for power banks.
        """
        attributes = {
            "Power banks*Capacity": 10000,
            "Power banks*Maximum output power": 20,
            "Power banks*Outputs": ["USB Type-C"],
            "Power banks*Fast charge": True,
            "Power banks*Support wireless charging": False,
            "Power banks*Model": "PowerBank-10",
            "Power banks*Color": ["черный"]
        }
        return attributes

    @staticmethod
    def generate_attributes_for_ab_rollers(product_name: str, product_description: str = "") -> Dict[str, str]:
        """
        Generate Kaspi attributes for ab rollers.
        """
        attributes = {
            "Ab rollers*Wheels number": "1",
            "Ab rollers*Max load": 100,
            "Ab rollers*Wheels material": ["пластик"],
            "Ab rollers*Material": ["металл", "пластик"],
            "Ab rollers*Color": "черный",
            "Ab rollers*Vendor code": "AB-ROLLER-01"
        }
        return attributes
    @classmethod
    def generate_attributes_for_games(cls, name: str, description: str = "") -> Dict[str, str]:
        """Generates required attributes for Board Games."""
        attrs_list = [
            {"code": "Board games*Type1", "value": ["развлекательные"]},
            {"code": "Board games*Vendor code", "value": "GAME-" + "".join(filter(str.isalnum, name[:10])).upper()},
            {"code": "Board games*Gender", "value": "унисекс"},
            {"code": "Board games*Language", "value": ["русский"]},
            {"code": "Board games*Difficulty level", "value": 1},
            {"code": "Board games*Contents", "value": "карточки, правила"},
            {"code": "Board games*Size", "value": "стандарт"},
            {"code": "Party games*Number of participants", "value": ["3-4"]},
            {"code": "Party games*Age", "value": "от 7 лет"}
        ]
        return {attr["code"]: attr["value"] for attr in attrs_list}

    @classmethod
    def generate_attributes(cls, product_name: str, product_description: str = "", 
                          category_type: str = None, category_code: str = None) -> Dict[str, str]:
        """
        Generate Kaspi attributes based on product data and category.
        """
        if category_code is None or category_type is None:
            category_code, category_type = cls.detect_category(product_name, product_description)
        
        # Hardcoded logic for common categories
        if category_type == 'mugs':
            return cls.generate_attributes_for_mugs(product_name, product_description)
        elif category_type == 'socks':
            return cls.generate_attributes_for_socks(product_name, product_description)
        elif category_type == 'powerbanks':
            return cls.generate_attributes_for_powerbanks(product_name, product_description)
        elif category_type == 'ab_rollers':
            return cls.generate_attributes_for_ab_rollers(product_name, product_description)
        elif category_type == 'games':
            return cls.generate_attributes_for_games(product_name, product_description)
        elif category_type == 'perfumes':
            return cls.generate_attributes_for_perfumes(product_name, product_description)
        
        # Universal AI filling for other categories
        if category_code:
            try:
                print(f"⚙️ Universal attribute filling for category: {category_code}", file=sys.stderr)
                import requests
                import config 
                from modules.ai_detector import fill_attributes_ai
                
                # Fetch required attributes from API
                url = f"https://kaspi.kz/shop/api/products/classification/attributes?c={category_code}"
                headers = {
                    "X-Auth-Token": config.KASPI_API_TOKEN,
                    "User-Agent": "Mozilla/5.0"
                }
                resp = requests.get(url, headers=headers, timeout=10)
                if resp.status_code == 200:
                    req_attrs = resp.json()
                    mandatory_attrs = [a for a in req_attrs if a.get('mandatory')]
                    
                    if not mandatory_attrs:
                         return {}
                         
                    # Use AI to fill these attributes
                    ai_vals = fill_attributes_ai(product_name, product_description, mandatory_attrs)
                    return ai_vals
            except Exception as e:
                print(f"⚠️ Universal attribute filling failed: {e}", file=sys.stderr)

        return {}
    
    @staticmethod
    def generate_attributes_for_perfumes(product_name: str, product_description: str = "") -> Dict[str, str]:
        """
        Generate Kaspi attributes for perfumes.
        """
        attributes = {
            "Perfumes*Tip": "парфюмерная вода",
            "Perfumes*Perfume scent names": "Chanel", # Placeholder, ideally detect
            "Perfumes*Family": ["цветочные"],
            "Perfumes*Gender": "женский", # Default
            "Perfumes*Notes": "жасмин", 
            "Perfumes*Middle notes": "роза",
            "Perfumes*Base notes": "мускус",
            "Perfumes*Size": "50 мл",
            "Perfumes*Size1": 50,
            "Perfumes*Country": "Франция",
            "Perfumes*Kind": "люкс"
        }
        
        text = (product_name + " " + product_description).lower()
        
        # Detect Gender
        if any(w in text for w in ['мужской', 'для мужчин', 'homme', 'men']):
            attributes["Perfumes*Gender"] = "мужской"
        elif any(w in text for w in ['унисекс', 'unisex']):
            attributes["Perfumes*Gender"] = "унисекс"
            
        # Detect Tip (Type)
        if 'туалетная вода' in text or 'toilette' in text:
             attributes["Perfumes*Tip"] = "туалетная вода"
        elif 'духи' in text or 'parfum' in text:
             attributes["Perfumes*Tip"] = "духи"
        elif 'одеколон' in text or 'cologne' in text:
             attributes["Perfumes*Tip"] = "одеколон"

        # Detect Volume
        vol_match = re.search(r'(\d+)\s*(мл|ml)', text)
        if vol_match:
            vol = int(vol_match.group(1))
            attributes["Perfumes*Size"] = f"{vol} мл"
            attributes["Perfumes*Size1"] = vol
            
        return attributes

    @staticmethod
    def validate_attributes(attributes: Dict[str, str], category_type: str) -> Tuple[bool, List[str]]:
        """
        Validate that all required attributes are present.
        """
        required = KaspiCategoryMapper.get_required_attributes(category_type)
        missing = [attr for attr in required if attr not in attributes]
        
        return len(missing) == 0, missing


if __name__ == "__main__":
    # Test the mapper
    test_cases = [
        "Кружка керамическая 350 мл белая",
        "Стеклянная чашка 250мл",
        "Игрушка плюшевая мишка",
        "Рюкзак школьный",
    ]
    
    for name in test_cases:
        category_id, category_type = KaspiCategoryMapper.detect_category(name)
        attributes = KaspiCategoryMapper.generate_attributes(name)
        print(f"\n{name}")
        print(f"  Category: {category_id} ({category_type})")
        print(f"  Attributes: {attributes}")
