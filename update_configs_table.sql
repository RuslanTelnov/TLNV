-- Add missing columns to existing client_configs table
ALTER TABLE "Parser".client_configs 
ADD COLUMN IF NOT EXISTS rest_api_key TEXT,
ADD COLUMN IF NOT EXISTS kaspi_xml_url TEXT,
ADD COLUMN IF NOT EXISTS retail_divisor FLOAT DEFAULT 0.3,
ADD COLUMN IF NOT EXISTS min_price_divisor FLOAT DEFAULT 0.45;

-- Rename openai_key to openai_api_key if needed? 
-- No, I'll just map it in the code.
