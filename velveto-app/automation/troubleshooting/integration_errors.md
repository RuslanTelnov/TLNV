# Ошибки Интеграции (MoySklad, Kaspi, Node.js API)

## 1. MoySklad: "Invalid script output" при Оприходовании

**Симптомы:**
- При попытке оприходовать товар через веб-интерфейс появляется ошибка `Invalid script output`.
- В логах сервера (`route.js`) видно, что скрипт упал или ничего не вернул.

**Причина:**
Node.js (API Route) ожидает от Python-скрипта JSON, обернутый в маркеры `JSON_START` и `JSON_END`.
Если в Python-скрипте происходит исключение (Exception) до того, как эти маркеры напечатаны, Node.js не может распарсить ответ.

**Решение (`oprihodovanie.py`):**
Всегда оборачивайте `main()` в блок `try...except` и гарантируйте вывод JSON даже при фатальных ошибках.

```python
try:
    # Логика...
    print(f"JSON_START{json.dumps({'success': True, ...})}JSON_END")
except Exception as e:
    # ОБЯЗАТЕЛЬНО выводим JSON с ошибкой
    print(f"JSON_START{json.dumps({'success': False, 'error': str(e)})}JSON_END")
```

**Примечание:** Также проверьте синтаксис (например, `False` в Python пишется с большой буквы, в отличие от JS `false`).

## 2. Kaspi: "500 Internal Server Error" при создании товара

**Симптомы:**
- Запрос на `https://kaspi.kz/shop/api/products/import` возвращает 500 ошибку.
- Сообщение "Content type 'application/json' not supported".

**Причина:**
Данный конкретный эндпоинт Kaspi требует заголовок `Content-Type: text/plain`, даже если тело запроса — это JSON-структура.

**Решение:**
При отправке запроса (в Python `requests` или JS `fetch`) явно указывайте хедер:

```python
headers = {
    'X-Auth-Token': TOKEN,
    'Content-Type': 'text/plain' # Важно!
}
requests.post(url, headers=headers, json=payload) # json=payload сам сериализует, но хедер переопределит тип
```

## 3. OpenAI/Image Gen: 404 Not Found

**Симптомы:**
- Запрос к `/api/content/generate-image` возвращает 404.

**Причина:**
- Файл `route.js` лежит не в той папке.
- В Next.js App Router (v13+) маршруты должны быть в папке, соответствующей URL, в файле `route.js`.
- Например: `src/app/api/content/generate-image/route.js`.

**Решение:**
Переместите файл в корректную директорию. Перезапустите dev-сервер, так как иногда новые маршруты не подхватываются на лету.

## 4. Kaspi: "Product not found" или ошибки маппинга

**Симптомы:**
- При нажатии "Создать в Kaspi" появляется ошибка "Product ... not found in Supabase".
- Скрипт падает с ошибкой маппинга категорий.

**Причина:**
1. Товар еще не синхронизирован из `wb_search_results` (парсинг) в `products` (внутренняя база).
2. Скрипт не может определить категорию товара по названию.

**Решение:**
1. **Fallback Logic:** В скрипте `create_from_ms.py` реализован механизм поиска товара сначала в таблице `products`, а затем (при неудаче) в `wb_search_results`.
2. **Category Mapper:** Использовать `KaspiCategoryMapper` с динамическим определением категории и атрибутов. Если категория не определена, скрипт возвращает ошибку, которую нужно обработать (добавить маппинг в `CATEGORY_MAP`).
