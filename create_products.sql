CREATE TABLE IF NOT EXISTS "Parser".products (
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
ALTER TABLE "Parser".products ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all access (since it's an admin dashboard for now, or match existing policies)
-- Adjust this based ON "Parser".your security needs. For now, public read/write for verified users or service role.
-- Assuming AnON "Parser".Read is needed for the frontend?
CREATE POLICY "Public Read" ON "Parser".products FOR SELECT USING (true);
CREATE POLICY "Authenticated Write" ON "Parser".products FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Service Role Full Access" ON "Parser".products FOR ALL USING (auth.role() = 'service_role');
