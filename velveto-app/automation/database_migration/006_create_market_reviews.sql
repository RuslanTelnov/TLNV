-- Migration: Create market_reviews table
CREATE TABLE IF NOT EXISTS "Parser".market_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marketplace TEXT NOT NULL CHECK (marketplace IN ('wb', 'kaspi')),
    product_id TEXT NOT NULL,
    external_review_id TEXT,
    text TEXT,
    rating INTEGER,
    pros TEXT,
    cons TEXT,
    user_name TEXT,
    review_date TIMESTAMP WITH TIME ZONE,
    sentiment TEXT, -- positive, negative, neutral
    category TEXT, -- Quality, Logistics, Packaging, Price, etc.
    pain_points JSONB, -- List of specific complaints
    is_analyzed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON "Parser".market_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_marketplace ON "Parser".market_reviews(marketplace);
CREATE INDEX IF NOT EXISTS idx_reviews_is_analyzed ON "Parser".market_reviews(is_analyzed);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_market_reviews_updated_at
    BEFORE UPDATE ON "Parser".market_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
