CREATE TABLE IF NOT EXISTS "Parser".sourcing_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moysklad_id TEXT NOT NULL,
    product_name TEXT,
    image_url TEXT,
    wb_price INTEGER,
    wb_link TEXT,
    ozon_price INTEGER,
    ozon_link TEXT,
    best_price INTEGER,
    best_source TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sourcing_moysklad_id ON "Parser".sourcing_recommendations(moysklad_id);
