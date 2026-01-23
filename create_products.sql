CREATE TABLE IF NOT EXISTS public.products (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    moysklad_id text NOT NULL,
    name text,
    article text UNIQUE,
    price numeric,
    min_price numeric,
    cost_price numeric,
    stock integer DEFAULT 0,
    image_url text,
    brand text,
    rating numeric,
    feedbacks integer,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all access (since it's an admin dashboard for now, or match existing policies)
-- Adjust this based on your security needs. For now, public read/write for verified users or service role.
-- Assuming Anon Read is needed for the frontend?
CREATE POLICY "Public Read" ON public.products FOR SELECT USING (true);
CREATE POLICY "Authenticated Write" ON public.products FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Service Role Full Access" ON public.products FOR ALL USING (auth.role() = 'service_role');
