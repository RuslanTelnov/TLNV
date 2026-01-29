-- Add status columns to wb_search_results
ALTER TABLE "Parser".wb_search_results 
ADD COLUMN IF NOT EXISTS conveyor_status TEXT DEFAULT 'idle',
ADD COLUMN IF NOT EXISTS ms_created BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stock_added BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS kaspi_created BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS conveyor_log TEXT;
