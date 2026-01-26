import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    const VERSION = "1.3.0";
    console.log(`--- Settings API v${VERSION} Start ---`);

    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

        console.log("Supabase URL Status:", supabaseUrl ? "Present" : "Missing");

        let dbKeys = {};
        let dbError = null;
        let rowCount = 0;
        let columnsFound = [];

        if (supabaseUrl && supabaseKey) {
            try {
                const client = createClient(supabaseUrl, supabaseKey);
                console.log("Fetching ALL rows from client_configs for debugging...");

                // Switch to select() without single() to see why it might be failing
                const { data, error, count } = await client.from('client_configs').select('*');

                if (error) {
                    console.error("Supabase Error:", error.message);
                    dbError = error.message;
                } else if (data && data.length > 0) {
                    console.log(`Found ${data.length} rows in DB.`);
                    rowCount = data.length;
                    dbKeys = data[0]; // Take the first row
                    columnsFound = Object.keys(dbKeys);
                    console.log("First row columns:", columnsFound);
                } else {
                    console.warn("Table is empty or no access (RLS?).");
                    dbError = "Table empty or RLS restricted";
                }
            } catch (e) {
                console.error("DB Fetch Exception:", e.message);
                dbError = e.message;
            }
        } else {
            dbError = "Missing Supabase credentials in environment";
        }

        // Masking helper
        const mask = (val) => (val && val !== 'Not Set') ? `${val.substring(0, 8)}...` : 'Not Set';

        const keys = {
            DEBUG: {
                VERSION,
                TIMESTAMP: new Date().toISOString(),
                DB_CONNECTED: rowCount > 0,
                ROWS: rowCount,
                COLUMNS: columnsFound,
                ERROR: dbError,
                ENV_URL: supabaseUrl ? "OK" : "MISSING"
            },
            // Mapping with explicit mapping to existing DB columns
            REST_API_KEY: dbKeys.rest_api_key || process.env.REST_API_KEY || 'Not Set',
            SUPABASE_URL: supabaseUrl || 'Not Set',
            KASPI_BASE_XML_URL: dbKeys.kaspi_xml_url || process.env.KASPI_BASE_XML_URL || 'Not Set',
            RETAIL_DIVISOR: dbKeys.retail_divisor || process.env.RETAIL_DIVISOR || '0.3',
            MIN_PRICE_DIVISOR: dbKeys.min_price_divisor || process.env.MIN_PRICE_DIVISOR || '0.45',
            OPENAI_API_KEY: mask(dbKeys.openai_key || process.env.OPENAI_API_KEY),
            MOYSKLAD_LOGIN: dbKeys.moysklad_login || process.env.MOYSKLAD_LOGIN || 'Not Set',
            KASPI_API_TOKEN: (dbKeys.kaspi_token || process.env.KASPI_API_TOKEN) ? 'Connected ✅' : 'Not Set',
        };

        console.log("Settings mapping complete. Returning keys.");
        return NextResponse.json(keys, {
            headers: {
                'Cache-Control': 'no-store, max-age=0, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
    } catch (error) {
        console.error("Fatal Settings Error:", error);
        return NextResponse.json({ error: 'Server Error', version: VERSION, detail: error.message }, { status: 500 });
    }
}
