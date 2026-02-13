import re
import json
import os
import sys
from typing import Dict, List, Optional, Tuple


class KaspiCategoryMapper:
    """Maps products to Kaspi categories and generates required attributes."""
    
    # Restricted categories for Kaspi (Always blocked)
    RESTRICTED_KEYWORDS = [
        "алкоголь", "водка", "вино", "пиво", "сигареты", "табак", 
        "нож", "пистолет", "бад", "витамины", "химия", "ядохимикаты",
        "интим", "sex", "эротика", "порно", 
        "шприц", "игла", "ветеринар", "корм для", "пиротехника", "фейерверк"
    ]

    # Keywords that are blocked EXCEPT for specific categories like toys/cosmetics
    WARNING_KEYWORDS = ["реплика", "копия", "1:1", "replica", "золото", "серебро", "бриллиант", "брильянт", "меч", "лекарство"]

    # Category mappings based on keywords (use stems/roots for better matching)
    CATEGORY_MAP = {
        # Board games
        'настольн': ('Master - Board games', 'games'),
        'игра для комп': ('Master - Board games', 'games'),
        
        # Puzzles
        'пазл': ('Master - Board games', 'games'),

        # Mugs and cups
        'кружк': ('Master - Cups and saucers sets', 'mugs'),
        'чашк': ('Master - Cups and saucers sets', 'mugs'),
        'чаш': ('Master - Cups and saucers sets', 'mugs'),
        'стакан': ('Master - Cups and saucers sets', 'mugs'),
        'saucer': ('Master - Cups and saucers sets', 'mugs'),
        
        # Toys
        'плюш': ('Master - Stuffed toys', 'toys'),
        'медведь': ('Master - Stuffed toys', 'toys'),
        'мишка': ('Master - Stuffed toys', 'toys'),
        'акула': ('Master - Stuffed toys', 'toys'),
        'кот': ('Master - Stuffed toys', 'toys'),
        'котик': ('Master - Stuffed toys', 'toys'),
        'собак': ('Master - Stuffed toys', 'toys'),
        
        # Model Cars (Correct category for Hot Wheels etc)
        'hot wheels': ('Master - Play vehicles', 'model_cars'),
        'машинка металлическая': ('Master - Play vehicles', 'model_cars'),
        'коллекционная модель': ('Master - Play vehicles', 'model_cars'),
        'масштабная модель': ('Master - Play vehicles', 'model_cars'),
        'масштабная модель': ('Master - Play vehicles', 'model_cars'),
        'модель 1:': ('Master - Play vehicles', 'model_cars'),
        'трактор': ('Master - Play vehicles', 'model_cars'),
        'машинк': ('Master - Play vehicles', 'model_cars'),
        'машина': ('Master - Play vehicles', 'model_cars'),
        
        # General Toys (Fallback)
        'игруш': ('Master - Stuffed toys', 'toys'),
        'кукл': ('Master - Stuffed toys', 'toys'),
        'пупс': ('Master - Stuffed toys', 'toys'),
        'светофор': ('Master - Stuffed toys', 'toys'),
        'светофор': ('Master - Stuffed toys', 'toys'),
        'волчок': ('Master - Stuffed toys', 'toys'),
        'меч': ('Master - Stuffed toys', 'toys'),
        
        # Educational / hobby
        'набор для опыт': ('Master - Board games', 'games'), # or another relevant category
        'развивающ': ('Master - Stuffed toys', 'toys'), # Common for toys/games
        
        # Backpacks
        'рюкзак': ('Master - Backpacks', 'backpacks'),
        'сумка': ('Master - Backpacks', 'backpacks'),
        
        # Power banks
        'повербанк': ('Master - Power banks', 'powerbanks'),
        'power bank': ('Master - Power banks', 'powerbanks'),
        'аккумулятор': ('Master - Power banks', 'powerbanks'),
        
        # Socks
        'носк': ('Master - Men socks', 'socks'),
        'гольф': ('Master - Men socks', 'socks'),
        
        # Keychains
        'брелок': ('Master - Key wallets', 'keychains'),
        
        # Ab rollers
        'ролик для пресса': ('Master - Ab rollers', 'ab_rollers'),

        # Perfumes
        'духи': ('Master - Perfumes', 'perfumes'),
        'парфюм': ('Master - Perfumes', 'perfumes'),
        'туалетная вода': ('Master - Perfumes', 'perfumes'),
        'одеколон': ('Master - Perfumes', 'perfumes'),
        'аромат': ('Master - Perfumes', 'perfumes'),
        'пробник': ('Master - Perfumes', 'perfumes'),
        'распив': ('Master - Perfumes', 'perfumes'),
        'cologne': ('Master - Perfumes', 'perfumes'),
        'hermes': ('Master - Perfumes', 'perfumes'),
        'chanel': ('Master - Perfumes', 'perfumes'),
        'dior': ('Master - Perfumes', 'perfumes'),
        'versace': ('Master - Perfumes', 'perfumes'),
        'hugo': ('Master - Perfumes', 'perfumes'),
        'gucci': ('Master - Perfumes', 'perfumes'),
        'lanvin': ('Master - Perfumes', 'perfumes'),
        'paco': ('Master - Perfumes', 'perfumes'),
        'baccarat': ('Master - Perfumes', 'restricted_perfume'),
        'аромабокс': ('Master - Perfumes', 'perfumes'),
        'арома бокс': ('Master - Perfumes', 'perfumes'),
        'fragrance': ('Master - Perfumes', 'perfumes'),
        'tester': ('Master - Perfumes', 'perfumes'),
        'zara': ('Master - Perfumes', 'perfumes'),
        'lacoste': ('Master - Perfumes', 'perfumes'),
        'montale': ('Master - Perfumes', 'perfumes'),
        'tom ford': ('Master - Perfumes', 'perfumes'),
        'kilian': ('Master - Perfumes', 'perfumes'),
        'molecule': ('Master - Perfumes', 'perfumes'),
        'byredo': ('Master - Perfumes', 'perfumes'),
        'jo malone': ('Master - Perfumes', 'perfumes'),
        
        # Creative / Hobbies
        'набор для творчеств': ('Master - Drawing and coloring kits', 'drawing_kits'),
        'доски для выжигания': ('Master - Tools and craft kits', 'craft_kits'),
        'холст': ('Master - Canvases', 'canvases'),
        'картина по номер': ('Master - Paintings by numbers', 'paintings_numbers'),
        'бисер': ('Master - Beadwork and weaving kits', 'beadwork'),
        'слайм': ('Master - Kinetic sand and slime', 'slimes'),
        'лепка': ('Master - Modeling kits', 'modeling'),
        'пластилин': ('Master - Modeling kits', 'modeling'),
        'иглы': ('Master - Sewing needles', 'sewing'),
        'игл для': ('Master - Sewing needles', 'sewing'),
        'леденец': ('Master - Candies and lollipops', 'sweets'),
        'конфет': ('Master - Candies and lollipops', 'sweets'),
        'курс': ('Master - Educational materials', 'education'),
        'пакет': ('Master - Educational materials', 'education'),
        'инструкция': ('Master - Educational materials', 'education'),
        'онлайн': ('Master - Educational materials', 'education'),
        'видеоурок': ('Master - Educational materials', 'education'),
        'наклейк': ('Master - Decorative stickers', 'stickers'),
        'стикер': ('Master - Decorative stickers', 'stickers'),
        'эпоксидн': ('Master - Resin art kits', 'resinart'),
        'смола': ('Master - Resin art kits', 'resinart'),
        'чехол': ('Master - Cases for mobile phones', 'cases'),
        'стекло для': ('Master - Screen protectors for mobile phones', 'cases'),
        'пленка для': ('Master - Screen protectors for mobile phones', 'cases'),
        
        # Foundations and Cushions
        'кушон': ('Master - Foundation', 'foundation'),
        'тональн': ('Master - Foundation', 'foundation'),
        
        # Diapers and pads (Crucial for the user)
        'пеленк': ('Master - Pet underpads', 'pads'),
        'подкладк': ('Master - Pet underpads', 'pads'),
        'disposable pads': ('Master - Pet underpads', 'pads'),
        'diaper': ('Master - Pet underpads', 'pads'),
        
        # Strollers and Doll strollers
        'коляска для кукол': ('Master - Accessories for dolls', 'doll_accessories'),
        'коляск': ('Master - Buggies', 'strollers'),
        
        # Shoes (Added to avoid 'носки' conflict)
        'обувь': ('Master - Men shoes', 'shoes'),
        'кроссовк': ('Master - Men shoes', 'shoes'),
        'кеды': ('Master - Men shoes', 'shoes'),
        'сандал': ('Master - Men shoes', 'shoes'),
        'ботинок': ('Master - Men shoes', 'shoes'),
        'ботинки': ('Master - Men shoes', 'shoes'),
        'сапог': ('Master - Men shoes', 'shoes'),
        
        # Plasticine / Modeling
        'пластилин': ('Master - Artistic dough', 'modeling'),
        'лепка': ('Master - Artistic dough', 'modeling'),
        
        # Hoodies & Sweatshirts (Prioritized)
        'худи': ('Master - Women hoodies', 'hoodies'),
        'толстовка': ('Master - Women hoodies', 'hoodies'),
        'свитшот': ('Master - Women hoodies', 'hoodies'),
        'джемпер': ('Master - Women jumpers', 'hoodies'),
        'свитер': ('Master - Women jumpers', 'hoodies'),
    }
    
    @classmethod
    def detect_category(cls, name: str, description: str = "") -> Tuple[Optional[str], Optional[str]]:
        """Detects category based on name and description keywords."""
        text = f"{name} {description}".lower()
        
        # 0. Check for restricted categories first using word boundaries
        print(f"DEBUG: Detecting category for '{name}'...", file=sys.stderr)
        for restricted_kw in cls.RESTRICTED_KEYWORDS:
            # Use regex to match whole word only
            pattern = rf"\b{re.escape(restricted_kw)}\b"
            if re.search(pattern, text, re.IGNORECASE):
                # Special bypass for perfumes which might contain sensitive words in description
                if "perfume" in text or "духи" in text or "аромабокс" in text or "арома бокс" in text:
                    continue
                print(f"⚠️ Detected strictly restricted keyword: {restricted_kw}", file=sys.stderr)
                return cls.apply_policy(None, "no_cat", text)

        # Special check for perfumes (Recently allowed)
        if any(kw in text for kw in ['духи', 'парфюм', 'аромабокс', 'арома бокс', 'perfume', 'tester', 'fragrance']):
             print(f"⚠️ Allowing perfume category detection", file=sys.stderr)

        # 1. Manual keyword mapping (fast pass)
        print(f"DEBUG: Checking '{name}' against map (TITLE ONLY first)...", file=sys.stderr)
        sorted_keywords = sorted(cls.CATEGORY_MAP.keys(), key=len, reverse=True)
        
        # Pass 1: Check ONLY Title
        name_lower = name.lower()
        for keyword in sorted_keywords:
            cat_name, cat_type = cls.CATEGORY_MAP[keyword]
            pattern = rf"\b{re.escape(keyword)}"
            if re.search(pattern, name_lower):
                print(f"DEBUG: Found match '{keyword}' in TITLE -> {cat_name}", file=sys.stderr)
                return cls.apply_policy(cat_name, cat_type, text)
                
        # Pass 2: Check Description (but exclude strict categories like Socks)
        # Some categories are too sensitive to description noise (like Socks, Medicine keywords etc)
        STRICT_TITLE_ONLY_TYPES = ['socks', 'hoodies']
        
        print(f"DEBUG: Checking Description for non-strict categories...", file=sys.stderr)
        description_lower = description.lower()
        for keyword in sorted_keywords:
            cat_name, cat_type = cls.CATEGORY_MAP[keyword]
            
            if cat_type in STRICT_TITLE_ONLY_TYPES:
                continue
                
            pattern = rf"\b{re.escape(keyword)}"
            if re.search(pattern, description_lower):
                print(f"DEBUG: Found match '{keyword}' in DESCRIPTION -> {cat_name}", file=sys.stderr)
                return cls.apply_policy(cat_name, cat_type, text)
        
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
                    return cls.apply_policy(ai_code, "universal", text)
                elif potential_cats:
                    # Fallback to the best fuzzy match
                    best_cat = potential_cats[0]
                    print(f"⚠️ AI detection failed, falling back to top fuzzy match: {best_cat['title']} ({best_cat['code']})", file=sys.stderr)
                    return cls.apply_policy(best_cat['code'], "universal_fuzzy", text)
        except Exception as e:
            print(f"⚠️ Universal detection failed: {e}", file=sys.stderr)

        # Check warning keywords BEFORE returning the final result
        # EXCEPT for toys/model_cars
        final_cat_name, final_cat_type = None, None
        
        # Determine the best match from results above
        # (This is a bit simplified, ideally we'd pass it through)
        # Let's re-eval the logic below
        
        # Note: The logic above returns immediately if found. 
        # I need to wrap the return points to check for warning keywords.
        
        print(f"❌ No category detected for '{name}' after all checks.", file=sys.stderr)
        return None, None

    @classmethod
    def apply_policy(cls, category_name: str, category_type: str, text: str) -> Tuple[Optional[str], Optional[str]]:
        """Applies safety policy to detected category."""
        if not category_name:
            return None, None
            
        text_lower = text.lower()
        
        # Whitelisted categories can use WARNING_KEYWORDS freely
        whitelisted_types = ['toys', 'model_cars', 'games', 'foundation', 'cosmetics', 'perfumes']
        is_whitelisted = any(t in category_type for t in whitelisted_types)
        
        # 1. Check STRICTLY restricted keywords first (never allowed)
        for kw in cls.RESTRICTED_KEYWORDS:
            if kw in text_lower:
                # Special cases for whitelisted categories (e.g. "оружие", "лекарство" often used in toys/scripts)
                if is_whitelisted and kw in ["оружие", "лекарство", "медицинский"]:
                    continue # Treat as warning instead
                return f"restricted_{kw}", None

        # 2. Check WARNING keywords
        for kw in cls.WARNING_KEYWORDS:
            if kw in text_lower:
                if is_whitelisted:
                    return category_name, category_type # Allow!
                return f"restricted_{kw}", None
                
        return category_name, category_type
            
        # For other categories, check warning keywords
        for warning_kw in cls.WARNING_KEYWORDS:
            pattern = rf"\b{re.escape(warning_kw)}\b"
            if re.search(pattern, text, re.IGNORECASE):
                print(f"⚠️ Detected warning keyword '{warning_kw}' in restricted category '{category_type}'", file=sys.stderr)
                return None, "restricted_warning"
                
        return category_name, category_type
    
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
            ],
            'model_cars': [
                'Play vehicles*Type',
                'Play vehicles*Vendor code',
                'Play vehicles*Model',
                'Toys*Age',
                'Toys*Gender',
                'Toys*Color',
                'Toys*Material'
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
            "Cups and saucers sets*Volume": 350,
            "Cups and saucers sets*Brand code": "нет", # Mandatory string field
        }
        
        text = (product_name + " " + product_description).lower()

        # Generate 'Cups and saucers sets*Type' attribute
        if any(word in text for word in ['набор', 'комплект']):
            attributes["Cups and saucers sets*Type"] = "набор кружек"
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
        # Default already set in initial dict
        
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

    @staticmethod
    def generate_attributes_for_toys(product_name: str, product_description: str = "") -> Dict[str, str]:
        """
        Generate Kaspi attributes for Stuffed Toys.
        """
        text = (product_name + " " + product_description).lower()
        
        attributes = {
            "Stuffed toys*Type": "мягкая игрушка",
            "Stuffed toys*Height": 35, # Default int
            "Stuffed toys*Filler": "синтепон",
            "Stuffed toys*Character": "Стич", 
            "Stuffed toys*View": ["дикие животные"], # List, lowercase
            "Toys*Age": ["3 года"], # List
            "Toys*Gender": "универсальный", # String
            "Toys*Color": ["синий"], # List
            "Toys*Material": ["текстиль"] # List
        }
        
        # Detect height
        height_match = re.search(r'(\d+)\s*(см|cm)', text)
        if height_match:
            try:
                attributes["Stuffed toys*Height"] = int(height_match.group(1))
            except:
                pass
            
        # Detect character
        if "стич" in text:
            attributes["Stuffed toys*Character"] = "Стич"
        elif "медведь" in text or "мишка" in text:
            attributes["Stuffed toys*Character"] = "Медведь"
        elif "пикачу" in text:
             attributes["Stuffed toys*Character"] = "Покемоны"
            
        # Detect color
        colors = {
            'синий': 'Синий', 'голубой': 'Голубой',
            'розовый': 'Розовый', 'белый': 'Белый', 'серый': 'Серый'
        }
        for k, v in colors.items():
            if k in text:
                attributes["Toys*Color"] = v
                break
                
        return attributes
    @classmethod
    def generate_attributes_for_games(cls, name: str, description: str = "") -> Dict[str, str]:
        """Generates required attributes for Board Games."""
        attrs_list = [
            {"code": "Board games*Type1", "value": ["развлекательные"]},
            {"code": "Board games*Vendor code", "value": "GAME-" + "".join(filter(str.isalnum, name[:10])).upper()},
            {"code": "Board games*Gender", "value": "универсальная"}, # String, correct spelling
            {"code": "Board games*Language", "value": ["русский"]},
            {"code": "Board games*Difficulty level", "value": 1},
            {"code": "Board games*Contents", "value": "карточки, правила"},
            {"code": "Board games*Size", "value": "стандарт"},
            {"code": "Party games*Number of participants", "value": ["3", "4"]}, # As list
            {"code": "Party games*Age", "value": "7 лет"} # As string, no prefix
        ]
        return {attr["code"]: attr["value"] for attr in attrs_list}

    @classmethod
    def generate_attributes(cls, product_name: str, product_description: str = "", 
                          category_type: str = None, category_code: str = None,
                          raw_attributes: Dict[str, str] = None) -> Dict[str, str]:
        """
        Generate Kaspi attributes based on product data and category.
        """
        if raw_attributes is None:
            raw_attributes = {}
            
        if category_code is None or category_type is None:
            category_code, category_type = cls.detect_category(product_name, product_description)
        
        # Hardcoded logic for common categories
        if category_type == 'mugs':
            return cls.generate_attributes_for_mugs(product_name, product_description)
        elif category_type == 'toys':
             return cls.generate_attributes_for_toys(product_name, product_description)
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
        elif category_type == 'model_cars':
            return cls.generate_attributes_for_model_cars(product_name, product_description)
        elif category_type == 'pads':
            return cls.generate_attributes_for_pads(product_name, product_description)
        elif category_type == 'strollers':
            return cls.generate_attributes_for_strollers(product_name, product_description)
        elif category_type == 'modeling':
            return cls.generate_attributes_for_modeling(product_name, product_description)
        elif category_type == 'hoodies':
            return cls.generate_attributes_for_hoodies(product_name, product_description, raw_attributes)
        
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
                         
                    # Fetch possible values for enums to help AI choose
                    for attr in mandatory_attrs:
                        if attr.get('type') == 'enum':
                            try:
                                print(f"🔍 Fetching values for enum: {attr['code']}", file=sys.stderr)
                                v_url = f"https://kaspi.kz/shop/api/products/classification/attribute/values?c={category_code}&a={attr['code']}"
                                v_resp = requests.get(v_url, headers=headers, timeout=10)
                                if v_resp.status_code == 200:
                                    attr['values'] = v_resp.json()
                            except Exception as e:
                                print(f"⚠️ Failed to fetch values for {attr['code']}: {e}", file=sys.stderr)

                    # Use AI to fill these attributes
                    ai_vals = fill_attributes_ai(product_name, product_description, mandatory_attrs, raw_attributes=raw_attributes)
                    print(f"DEBUG: Generated AI values: {ai_vals}", file=sys.stderr)
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
    def generate_attributes_for_model_cars(product_name: str, product_description: str = "") -> Dict[str, str]:
        """Generate Kaspi attributes for Play Vehicles (Model Cars)."""
        text = (product_name + " " + product_description).lower()
        
        # Determine strict type
        vehicle_type = "машина"
        if "hot wheels" in text or "гоночная" in text:
            vehicle_type = "гоночная машина"
        elif "грузовик" in text:
            vehicle_type = "грузовая"
        elif "трактор" in text:
            vehicle_type = "трактор"
            
        attributes = {
            "Play vehicles*Type": vehicle_type,
            "Play vehicles*Vendor code": "HW-" + "".join(filter(str.isalnum, product_name[:10])).upper(),
            "Play vehicles*Model": product_name[:50],
            "Toys*Age": ["3 года"],
            "Toys*Gender": "мальчик",
            "Toys*Color": ["мультиколор"],
            "Toys*Material": ["металл"]
        }
        
        # Detect Scale (Optional)
        scale_match = re.search(r'1:(\d+)', text)
        if scale_match:
            attributes["Play vehicles*Scale"] = f"1:{scale_match.group(1)}"
            
        # Detect Color
        if "черн" in text: attributes["Toys*Color"] = ["черный"]
        elif "красн" in text: attributes["Toys*Color"] = ["красный"]
        elif "син" in text: attributes["Toys*Color"] = ["синий"]
        elif "бел" in text: attributes["Toys*Color"] = ["белый"]
        
        return attributes

    @staticmethod
    def generate_attributes_for_pads(product_name: str, product_description: str = "") -> Dict[str, str]:
        """Generate Kaspi attributes for Pet underpads."""
        text = (product_name + " " + product_description).lower()
        attributes = {
            "Pet underpads*Type": "пеленки",
            "Pet underpads*Width": 60,
            "Pet underpads*Length": 40,
            "Pet underpads*Brand code": "нет",
            "Pet care*Material": ["целлюлоза"] # Standard
        }
        
        # Extract dimensions
        dim_match = re.search(r'(\d+)х(\d+)', text)
        if not dim_match:
            dim_match = re.search(r'(\d+)x(\d+)', text)
            
        if dim_match:
            attributes["Pet underpads*Width"] = int(dim_match.group(1))
            attributes["Pet underpads*Length"] = int(dim_match.group(2))
            
        return attributes

    @staticmethod
    def generate_attributes_for_strollers(product_name: str, product_description: str = "") -> Dict[str, str]:
        """Generate Kaspi attributes for Baby Strollers."""
        attributes = {
            "Buggy*Type": "коляска-книжка",
            "Buggy*Material": "текстиль",
            "Babies*Age": "0+",
            "Babies*Gender": "унисекс"
        }
        return attributes

    @staticmethod
    def generate_attributes_for_modeling(product_name: str, product_description: str = "") -> Dict[str, str]:
        """Generate Kaspi attributes for Modeling clay."""
        attributes = {
            "Modeling kits*Type": "пластилин",
            "Modeling kits*Number of colors": 12,
            "Toys*Age": ["3 года"]
        }
        # Extract number of colors
        color_match = re.search(r'(\d+)\s*(цветов|цв)', product_name.lower())
        if color_match:
            attributes["Modeling kits*Number of colors"] = int(color_match.group(1))
            
        return attributes

    @classmethod
    def generate_attributes_for_hoodies(cls, product_name: str, product_description: str = "", raw_attributes: Dict = None) -> Dict[str, str]:
        """Generate Kaspi attributes for Hoodies, Sweatshirts, Jumpers."""
        text = (product_name + " " + product_description).lower()
        title_lower = product_name.lower()
        
        # 1. Determine Gender and Correct Category Code
        # Default to Women
        is_men = any(w in title_lower for w in ['мужск', 'мужчин', 'men', 'man'])
        
        attributes = {}
        
        # Dynamic Attribute Prefix based on gender match
        # Note: The mapping in detect_category returned 'Master - Women hoodies', 
        # but here we might need to adjust the actual output dictionary keys?
        # Kaspi Mapper usually expects the keys to match the category. 
        # If we return attributes for "Men hoodies" but the detected category was "Women hoodies", 
        # we need to make sure the Main Script updates the category_name validation too.
        # Ideally, this function should return both the attributes AND a corrected category name if possible?
        # For now, we assume the keys here will be merged, but the keys MUST match the category code.
        
        # Let's try to infer if we are "Women" or "Men" based on the call context?
        # Actually `generate_attributes` doesn't return the category code.
        # But we can try to guess the most likely attributes.
        
        prefix = "Women hoodies"
        if is_men:
            prefix = "Men hoodies"
            
        # Basic mapping
        attributes[f"{prefix}*Size"] = "42" # Default
        attributes[f"{prefix}*Color"] = "черный"
        
        # Extract Size
        # Try to find common sizes
        size_match = re.search(r'\b(xs|s|m|l|xl|xxl|xxxl|42|44|46|48|50|52|54|56)\b', text)
        if size_match:
            attributes[f"{prefix}*Size"] = size_match.group(1).upper()
            
        # Extract Color
        if "черн" in text: attributes[f"{prefix}*Color"] = "черный"
        elif "бел" in text: attributes[f"{prefix}*Color"] = "белый"
        elif "сер" in text: attributes[f"{prefix}*Color"] = "серый"
        elif "бежевый" in text: attributes[f"{prefix}*Color"] = "бежевый"
        elif "син" in text: attributes[f"{prefix}*Color"] = "синий"
        elif "зелен" in text: attributes[f"{prefix}*Color"] = "зеленый"
        elif "розовый" in text: attributes[f"{prefix}*Color"] = "розовый"
        
        # Composition (optional but good)
        if "хлопок" in text:
             attributes[f"{prefix}*Composition"] = "хлопок"
        elif "синтетика" in text or "полиэстер" in text:
             attributes[f"{prefix}*Composition"] = "полиэстер"
        else:
             attributes[f"{prefix}*Composition"] = "хлопок"

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
