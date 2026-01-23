
import pandas as pd
import os

def generate_excel():
    # Define Data
    data = {
        "Артикул": ["472069784-K"],      # A
        "Название": ["Мягкая игрушка Стич 35см"], # B
        "Бренд": ["Generic"],            # C
        "Цена": [3999],                  # D
        "Space_E": [""],                # E (Spacer)
        "Наличие": ["yes"],              # F (Availability)
        "Space_G": [""],                # G (Spacer)
        "Space_H": [""],                # H (Spacer)
        "Space_I": [""],                # I (Spacer)
        "Предзаказ": [0],                # J (Preorder)
        
        "Категория": ["Master - Stuffed toys"], # K
        "Описание": ["Качественная мягкая игрушка Стич, высота 35 см. Гипоаллергенный наполнитель."], # L
        "Ссылка на фото": ["https://ir.ozone.ru/s3/multimedia-q/wc1000/608707482.jpg"], # M
        
        # Attributes
        "Тип": ["Мягкая игрушка"],
        "Высота": [35],
        "Наполнитель": ["Синтепон"],
        "Персонаж": ["Стич"],
        "Вид": ["Животные"],
        "Возраст": ["От 3 лет"],
        "Пол": ["Унисекс"],
        "Цвет": ["Синий"],
        "Материал": ["Текстиль"]
    }
    
    # Enforce column order explicitly in DataFrame
    cols = ["Артикул", "Название", "Бренд", "Цена", "Space_E", "Наличие", "Space_G", "Space_H", "Space_I", "Предзаказ",
            "Категория", "Описание", "Ссылка на фото",
            "Тип", "Высота", "Наполнитель", "Персонаж", "Вид", "Возраст", "Пол", "Цвет", "Материал"]
    
    df = pd.DataFrame(data)
    df = df[cols]
    
    # Rename spacer columns to empty strings in the header (Export step)
    # Actually, pandas writes header from df columns.
    # We should map them to generic names if we don't know them, OR empty.
    # Kaspi might verify valid headers?
    # If headers are ignored (index based), Spacers work.
    # If headers are checked, we are guessing.
    # Given the error "In cell J2...", it validates *Cells* (Values), not Headers primarily?
    # Let's try empty headers for spacers?
    df.rename(columns={"Space_E": "", "Space_G": "", "Space_H": "", "Space_I": ""}, inplace=True)
    
    # Save
    output_path = "/home/wik/kaspi_upload_manual.xlsx"
    df.to_excel(output_path, index=False)
    print(f"Generated {output_path}")

if __name__ == "__main__":
    generate_excel()
