ALTER TABLE "Parser".client_configs 
ADD COLUMN IF NOT EXISTS is_autonomous_mode BOOLEAN DEFAULT FALSE;
