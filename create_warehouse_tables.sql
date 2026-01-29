-- Create Warehouses table
CREATE TABLE IF NOT EXISTS "Parser".warehouses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    moysklad_id text UNIQUE NOT NULL,
    name text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Create Product Stocks table (Many-to-Many via product & warehouse)
CREATE TABLE IF NOT EXISTS "Parser".product_stocks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id uuid REFERENCES "Parser".products(id) ON "Parser".DELETE CASCADE,
    warehouse_id uuid REFERENCES "Parser".warehouses(id) ON "Parser".DELETE CASCADE,
    stock integer DEFAULT 0,
    updated_at timestamptz DEFAULT now(),
    UNIQUE(product_id, warehouse_id)
);

-- RLS Policies
ALTER TABLE "Parser".warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Parser".product_stocks ENABLE ROW LEVEL SECURITY;

-- Public Read
CREATE POLICY "Public Read Warehouses" ON "Parser".warehouses FOR SELECT USING (true);
CREATE POLICY "Public Read Stocks" ON "Parser".product_stocks FOR SELECT USING (true);

-- AnON "Parser".Write (for sync script)
CREATE POLICY "AnON "Parser".Insert Warehouses" ON "Parser".warehouses FOR INSERT WITH CHECK (true);
CREATE POLICY "AnON "Parser".UPDATE "Parser".Warehouses" ON "Parser".warehouses FOR UPDATE "Parser".USING (true);

CREATE POLICY "AnON "Parser".Insert Stocks" ON "Parser".product_stocks FOR INSERT WITH CHECK (true);
CREATE POLICY "AnON "Parser".UPDATE "Parser".Stocks" ON "Parser".product_stocks FOR UPDATE "Parser".USING (true);
CREATE POLICY "AnON "Parser".Delete Stocks" ON "Parser".product_stocks FOR DELETE USING (true);
