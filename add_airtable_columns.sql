ALTER TABLE "Parser"."wb_search_results" ADD COLUMN IF NOT EXISTS "airtable_id" TEXT;
ALTER TABLE "Parser"."wb_search_results" ADD COLUMN IF NOT EXISTS "airtable_fix_id" TEXT;
ALTER TABLE "Parser"."wb_search_results" ADD COLUMN IF NOT EXISTS "airtable_rejected_id" TEXT;
