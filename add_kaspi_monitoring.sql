
ALTER TABLE public.wb_search_results 
ADD COLUMN IF NOT EXISTS kaspi_upload_id text,
ADD COLUMN IF NOT EXISTS kaspi_upload_status text,
ADD COLUMN IF NOT EXISTS kaspi_upload_errors jsonb;
