import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'moysklad-web', 'automation', 'kaspi'))
from modules.category_mapper import KaspiCategoryMapper

names = [
    "Набор носков", 
    "Lanvin d arpege eclat Ланвин",
    "Кроссовки женские серые",
    "Серьги жемчуг"
]

for name in names:
    cat, type_ = KaspiCategoryMapper.detect_category(name)
    print(f"Name: '{name}' -> Cat: {cat}, Type: {type_}")
