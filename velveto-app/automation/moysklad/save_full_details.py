import os
import json
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL or SUPABASE_KEY not found")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Data extracted by browser subagent
full_data = [
  {
    "id": 200527396,
    "image_url": "https://basket-09.wbbasket.ru/vol1376/part137617/137617478/images/big/1.webp",
    "delivery_date": "12 декабря",
    "rating": 4.7,
    "feedbacks": 844,
    "specs": {
      "Количество предметов в упаковке": "1 шт.",
      "Материал посуды": "полистоун; нержавеющая сталь",
      "Объем (мл)": "400 мл",
      "Особенности кружки": "Подарок; необычный подарок; ненагревающиеся стенки",
      "Декоративные элементы": "Череп; рога; викинг",
      "Страна производства": "Китай"
    },
    "name": "Пивная кружка подарочная Викинг",
    "brand": "Conflate",
    "price": 834,
    "sale_price_u": 834,
    "url": "https://www.wildberries.ru/catalog/200527396/detail.aspx"
  },
  {
    "id": 114992813,
    "image_url": "https://basket-09.wbbasket.ru/vol1149/part114992/114992813/images/big/1.webp",
    "delivery_date": "12 декабря",
    "rating": 4.7,
    "feedbacks": 8420,
    "specs": {
      "Материал посуды": "стекло",
      "Декоративные элементы": "без элементов",
      "Страна производства": "Китай",
      "Комплектация": "стеклянная кружка с двойными стенками - 2шт",
      "Высота предмета": "10.5 см",
      "Вес товара с упаковкой (г)": "368 г"
    },
    "name": "Кружка с двойными стенками дном",
    "brand": "Good&Good",
    "price": 562,
    "sale_price_u": 562,
    "url": "https://www.wildberries.ru/catalog/114992813/detail.aspx"
  },
  {
    "id": 309265419,
    "image_url": "https://basket-09.wbbasket.ru/vol1785/part178542/178542709/images/big/1.webp",
    "delivery_date": "Завтра",
    "rating": 5,
    "feedbacks": 79,
    "specs": {
      "Количество предметов в упаковке": "1 шт.",
      "Материал посуды": "керамика",
      "Объем (мл)": "270 мл",
      "Особенности кружки": "подарочная коробка; ударопрочная; использование в посудомоечной машине",
      "Декоративные элементы": "принт; Ручная роспись; маргаритки",
      "Страна производства": "Китай"
    },
    "name": "Кружка для чая и кофе милая эстетичная керамическая чашка",
    "brand": "EARLY BIRD",
    "price": 623,
    "sale_price_u": 623,
    "url": "https://www.wildberries.ru/catalog/309265419/detail.aspx"
  },
  {
    "id": 179790764,
    "image_url": "https://basket-09.wbbasket.ru/vol1797/part179790/179790764/images/big/1.webp",
    "delivery_date": "Завтра",
    "rating": 4.9,
    "feedbacks": 1507,
    "specs": {
      "Количество предметов в упаковке": "1 шт",
      "Материал посуды": "керамика",
      "Объем (мл)": "330 мл",
      "Особенности кружки": "использование в СВЧ; эргономичная ручка",
      "Декоративные элементы": "с принтом; принт; с надписью",
      "Страна производства": "Россия"
    },
    "name": "Милая кружка для любимых с котиками люблю тебя",
    "brand": "CupCraft",
    "price": 350,
    "sale_price_u": 350,
    "url": "https://www.wildberries.ru/catalog/179790764/detail.aspx"
  },
  {
    "id": 124019598,
    "image_url": "https://basket-09.wbbasket.ru/vol1240/part124019/124019598/images/big/1.webp",
    "delivery_date": "Завтра",
    "rating": 4.9,
    "feedbacks": 96,
    "specs": {
      "Количество предметов в упаковке": "1",
      "Материал посуды": "каменная керамика",
      "Объем (мл)": "400 мл",
      "Особенности кружки": "использование в СВЧ; использование в посудомоечной машине; толстые стенки, сужающаяся к верху форма"
    },
    "name": "Кружка для чая кофе большая керамика 400 мл",
    "brand": "molti",
    "price": 643,
    "sale_price_u": 643,
    "url": "https://www.wildberries.ru/catalog/124019598/detail.aspx"
  }
]

print(f"Upserting {len(full_data)} products with full details...")

try:
    data = supabase.schema('Parser').table('wb_top_products').upsert(full_data).execute()
    print("Success!")
except Exception as e:
    print(f"Error saving to Supabase: {e}")
