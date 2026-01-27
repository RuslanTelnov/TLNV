const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkQueue() {
    console.log('Checking parser_queue...');
    const { data, error } = await supabase
        .from('parser_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching queue:', error);
        return;
    }

    console.log('Recent jobs in queue:');
    console.table(data.map(job => ({
        id: job.id,
        mode: job.mode,
        query: job.query,
        status: job.status,
        created_at: job.created_at,
        updated_at: job.updated_at
    })));

    const activeJobs = data.filter(j => j.status === 'processing' || j.status === 'pending');
    if (activeJobs.length > 0) {
        console.log(`\nFound ${activeJobs.length} active/pending jobs.`);
    } else {
        console.log('\nNo active or pending jobs found in the last 5 entries.');
    }
}

checkQueue();
