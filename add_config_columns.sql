ALTER TABLE "Parser"."client_configs" ADD COLUMN IF NOT EXISTS "airtable_base_id" TEXT;
ALTER TABLE "Parser"."client_configs" ADD COLUMN IF NOT EXISTS "airtable_table_name" TEXT;
ALTER TABLE "Parser"."client_configs" ADD COLUMN IF NOT EXISTS "airtable_fix_table" TEXT;
ALTER TABLE "Parser"."client_configs" ADD COLUMN IF NOT EXISTS "airtable_rejected_table" TEXT;
ALTER TABLE "Parser"."client_configs" ADD COLUMN IF NOT EXISTS "airtable_api_key" TEXT;
