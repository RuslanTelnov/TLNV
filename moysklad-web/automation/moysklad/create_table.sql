CREATE TABLE IF NOT EXISTS "Parser".wb_top_products (
    id BIGINT PRIMARY KEY, -- WB Article ID (nmId)
    name TEXT,
    brand TEXT,
    price INTEGER, -- Sale price in cents or raw value
    sale_price_u INTEGER, -- Usually the actual price in kopecks
    rating DECIMAL,
    feedbacks INTEGER,
    delivery_date TEXT, -- Estimated delivery
    specs JSONB, -- Flexible storage for characteristics
    url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
