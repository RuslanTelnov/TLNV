
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSettings() {
    console.log('--- Checking client_configs ---');
    const { data, error } = await supabase
        .from('client_configs')
        .select('*');

    if (error) {
        console.error('❌ Error fetching "client_configs":', error.message);
        if (error.code === 'PGRST116') {
            console.log('Table exists but is empty or single-row constraint failed.');
        }
    } else {
        console.log('✅ Successfully fetched "client_configs". Row count:', data.length);
        console.log('Data:', JSON.stringify(data, null, 2));
    }
}

checkSettings();
