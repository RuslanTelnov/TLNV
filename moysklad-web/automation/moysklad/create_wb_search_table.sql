-- CREATE TABLE "Parser".for WB Search Results
CREATE TABLE IF NOT EXISTS "Parser".wb_search_results (
    id bigint primary key, -- WB Product ID (nm_id)
    positiON integer,
    name text,
    brand text,
    price_kzt numeric,
    in_stock boolean,
    image_url text,
    product_url text,
    specs jsonb, -- Full characteristics
    delivery_days integer,
    query text, -- The search query used to find this
    rating numeric,
    feedbacks integer,
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS (optional, but good practice)
alter table "Parser".wb_search_results enable row level security;

-- Create policy to allow all access (since this is internal tool)
create policy "Allow all access" on "Parser".wb_search_results for all using (true) with check (true);
