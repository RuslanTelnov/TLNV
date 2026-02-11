-- 1. Enable autonomous mode
UPDATE "Parser".client_configs SET is_autonomous_mode = true WHERE id = 1;

-- 2. Reset stuck jobs (older than 1 hour in 'processing' status)
UPDATE "Parser".parser_queue 
SET status = 'error', log = 'Stuck job reset' 
WHERE status = 'processing' AND created_at < NOW() - INTERVAL '1 hour';
