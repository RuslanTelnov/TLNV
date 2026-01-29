
-- Restore products table for MoySklad sync
CREATE TABLE IF NOT EXISTS "Parser".products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moysklad_id TEXT,
    name TEXT,
    article TEXT UNIQUE,
    descriptiON text,
    price NUMERIC,
    min_price NUMERIC,
    cost_price NUMERIC,
    stock NUMERIC DEFAULT 0,
    image_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE "Parser".products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON "Parser".products FOR ALL USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_article ON "Parser".products(article);
CREATE INDEX IF NOT EXISTS idx_products_moysklad_id ON "Parser".products(moysklad_id);
