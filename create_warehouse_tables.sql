-- Create Warehouses table
CREATE TABLE IF NOT EXISTS public.warehouses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    moysklad_id text UNIQUE NOT NULL,
    name text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Create Product Stocks table (Many-to-Many via product & warehouse)
CREATE TABLE IF NOT EXISTS public.product_stocks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
    warehouse_id uuid REFERENCES public.warehouses(id) ON DELETE CASCADE,
    stock integer DEFAULT 0,
    updated_at timestamptz DEFAULT now(),
    UNIQUE(product_id, warehouse_id)
);

-- RLS Policies
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_stocks ENABLE ROW LEVEL SECURITY;

-- Public Read
CREATE POLICY "Public Read Warehouses" ON public.warehouses FOR SELECT USING (true);
CREATE POLICY "Public Read Stocks" ON public.product_stocks FOR SELECT USING (true);

-- Anon Write (for sync script)
CREATE POLICY "Anon Insert Warehouses" ON public.warehouses FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon Update Warehouses" ON public.warehouses FOR UPDATE USING (true);

CREATE POLICY "Anon Insert Stocks" ON public.product_stocks FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon Update Stocks" ON public.product_stocks FOR UPDATE USING (true);
CREATE POLICY "Anon Delete Stocks" ON public.product_stocks FOR DELETE USING (true);
