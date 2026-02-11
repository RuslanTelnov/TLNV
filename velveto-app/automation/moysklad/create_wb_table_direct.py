import psycopg2
from psycopg2 import sql

# Default local Supabase credentials
DB_PARAMS = {
    "dbname": "postgres",
    "user": "postgres",
    "password": "your-super-secret-and-long-postgres-password", # Default for `supabase start` often, or "postgres"
    "host": "127.0.0.1",
    "port": "54322" # Default pooler port, or 5432
}

# Try default password for local dev
try:
    conn = psycopg2.connect(**DB_PARAMS)
    conn.autocommit = True
    cur = conn.cursor()
    
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
    
    cur.execute(create_table_query)
    print("Table 'wb_top_products' created successfully.")
    
    cur.close()
    conn.close()
except Exception as e:
    print(f"Failed to connect or create table: {e}")
    # Fallback: Print instructions or try another port/password
