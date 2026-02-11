
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

console.log('--- Checking Environment Variables ---');
const hasNextPublicUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
const hasNextPublicKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const hasUrl = !!process.env.SUPABASE_URL;
const hasKey = !!process.env.SUPABASE_KEY;

console.log('NEXT_PUBLIC_SUPABASE_URL exists:', hasNextPublicUrl);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY exists:', hasNextPublicKey);
console.log('SUPABASE_URL exists:', hasUrl);
console.log('SUPABASE_KEY exists:', hasKey);

if (!hasNextPublicUrl && !hasUrl) {
    console.error('❌ CRITICAL: No Supabase URL found!');
}
if (!hasNextPublicKey && !hasNextPublicKey) {
    console.error('❌ CRITICAL: No Supabase Key found!');
}

if (!hasNextPublicUrl || !hasNextPublicKey) {
    console.warn('⚠️ WARNING: Missing NEXT_PUBLIC_ prefix. These variables will NOT be available in the browser!');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log('\n--- Checking Data Access ---');

    // Check 'products'
    const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .limit(1);

    if (productsError) {
        console.error('❌ Error fetching "products":', productsError.message);
    } else {
        console.log('✅ Successfully fetched "products". Row count:', products.length);
    }

    // Check 'wb_search_results'
    const { data: wb, error: wbError } = await supabase
        .from('wb_search_results')
        .select('*')
        .limit(1);

    if (wbError) {
        console.error('❌ Error fetching "wb_search_results":', wbError.message);
    } else {
        console.log('✅ Successfully fetched "wb_search_results". Row count:', wb.length);
    }

    // Check 'warehouses'
    const { data: wh, error: whError } = await supabase
        .from('warehouses')
        .select('*')
        .limit(1);

    if (whError) {
        console.error('❌ Error fetching "warehouses":', whError.message);
    } else {
        console.log('✅ Successfully fetched "warehouses".');
    }

    // Check 'product_stocks'
    const { data: ps, error: psError } = await supabase
        .from('product_stocks')
        .select('*')
        .limit(1);

    if (psError) {
        console.error('❌ Error fetching "product_stocks":', psError.message);
    } else {
        console.log('✅ Successfully fetched "product_stocks".');
    }
}

checkData();
