import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    const VERSION = "1.2.0";
    console.log(`--- Settings API v${VERSION} Start ---`);

    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

        console.log("Supabase URL Status:", supabaseUrl ? "Present" : "Missing");

        let dbKeys = {};

        if (supabaseUrl && supabaseKey) {
            try {
                // Initialize client locally every time to avoid stale or null global client
                const client = createClient(supabaseUrl, supabaseKey);
                console.log("Fetching from client_configs...");
                const { data, error } = await client.table('client_configs').select('*').limit(1).single();

                if (error) {
                    console.error("Supabase Error:", error.message);
                } else if (data) {
                    console.log("DB Data Loaded:", data.id);
                    dbKeys = data;
                }
            } catch (e) {
                console.error("DB Fetch Exception:", e.message);
            }
        }

        const keys = {
            VERSION,
            BUILD_TIME: "26.01.2026 18:55",
            REST_API_KEY: dbKeys.rest_api_key || process.env.REST_API_KEY || 'Not Set',
            SUPABASE_URL: supabaseUrl || 'Not Set',
            KASPI_BASE_XML_URL: dbKeys.kaspi_xml_url || process.env.KASPI_BASE_XML_URL || 'Not Set',
            RETAIL_DIVISOR: dbKeys.retail_divisor || process.env.RETAIL_DIVISOR || '0.3',
            MIN_PRICE_DIVISOR: dbKeys.min_price_divisor || process.env.MIN_PRICE_DIVISOR || '0.45',
            OPENAI_API_KEY: (dbKeys.openai_key || process.env.OPENAI_API_KEY) ? `${(dbKeys.openai_key || process.env.OPENAI_API_KEY).substring(0, 8)}...` : 'Not Set',
            MOYSKLAD_LOGIN: dbKeys.moysklad_login || process.env.MOYSKLAD_LOGIN || 'Not Set',
            KASPI_API_TOKEN: (dbKeys.kaspi_token || process.env.kaspi_token || process.env.KASPI_API_TOKEN) ? 'Connected ✅' : 'Not Set',
        };

        return NextResponse.json(keys, {
            headers: {
                'Cache-Control': 'no-store, max-age=0, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
    } catch (error) {
        console.error("Fatal Settings Error:", error);
        return NextResponse.json({ error: 'Server Error', version: VERSION }, { status: 500 });
    }
}
