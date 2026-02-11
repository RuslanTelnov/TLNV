import pandas as pd

file_path = '/home/wik/Рабочий стол/заказ 5.12.xlsx'
try:
    df = pd.read_excel(file_path, nrows=5)
    print("Columns:", df.columns.tolist())
    print(df.head())
except Exception as e:
    print(f"Error reading excel: {e}")
