-- Run this in your Supabase SQL Editor to enable persistent settings storage
-- This table allows you to save your API keys and configuration directly in the database,
-- so they persist across Vercel deployments and redeploys.

CREATE TABLE IF NOT EXISTS client_configs (
    id SERIAL PRIMARY KEY,
    rest_api_key TEXT,
    kaspi_xml_url TEXT,
    kaspi_token TEXT,
    ms_login TEXT,
    ms_password TEXT,
    openai_api_key TEXT,
    retail_divisor FLOAT DEFAULT 0.3,
    min_price_divisor FLOAT DEFAULT 0.45,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optional: Initial seed with default values
-- INSERT INTO client_configs (retail_divisor, min_price_divisor) VALUES (0.3, 0.45);

-- Security Recommendation: Enable Row Level Security (RLS)
-- ALTER TABLE client_configs ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all for internal dashboard" ON client_configs FOR ALL USING (true);
