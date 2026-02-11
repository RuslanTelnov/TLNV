import psycopg2
from psycopg2 import sql
import time

# List of potential configs
CONFIGS = [
    {"user": "postgres", "password": "your-super-secret-and-long-postgres-password", "port": "54322", "host": "127.0.0.1"},
    {"user": "postgres", "password": "your-super-secret-and-long-postgres-password", "port": "5432", "host": "127.0.0.1"},
    {"user": "postgres", "password": "postgres", "port": "54322", "host": "127.0.0.1"},
    {"user": "postgres", "password": "postgres", "port": "5432", "host": "127.0.0.1"},
    {"user": "postgres", "password": "password", "port": "54322", "host": "127.0.0.1"},
    {"user": "postgres", "password": "password", "port": "5432", "host": "127.0.0.1"},
]

create_table_query = """
CREATE TABLE IF NOT EXISTS wb_top_products (
    id BIGINT PRIMARY KEY,
    name TEXT,
    brand TEXT,
    price INTEGER,
    sale_price_u INTEGER,
    rating DECIMAL,
    feedbacks INTEGER,
    delivery_date TEXT,
    specs JSONB,
    url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
"""

for config in CONFIGS:
    print(f"Trying config: user={config['user']}, port={config['port']}, password=***")
    try:
        conn = psycopg2.connect(dbname="postgres", **config)
        conn.autocommit = True
        cur = conn.cursor()
        cur.execute(create_table_query)
        print("SUCCESS! Table 'wb_top_products' created.")
        cur.close()
        conn.close()
        exit(0)
    except Exception as e:
        print(f"Failed: {e}")

print("All attempts failed.")
exit(1)
