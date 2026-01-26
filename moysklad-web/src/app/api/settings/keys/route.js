import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        // Try to fetch from Supabase if envs are missing (for Vercel persistence)
        let dbKeys = {};
        try {
            console.log("Fetching client_configs from Supabase...");
            const { data, error } = await supabase.table('client_configs').select('*').limit(1).single();
            if (error) {
                console.error("Supabase fetch error:", error);
            } else if (data) {
                console.log("Successfully fetched dbKeys:", Object.keys(data));
                dbKeys = data;
            } else {
                console.warn("No data found in client_configs table.");
            }
        } catch (e) {
            console.error("Settings Exception:", e);
        }

        const keys = {
            REST_API_KEY: dbKeys.rest_api_key || process.env.REST_API_KEY || 'Not Set',
            SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not Set',
            KASPI_BASE_XML_URL: dbKeys.kaspi_xml_url || process.env.KASPI_BASE_XML_URL || 'Not Set',
            RETAIL_DIVISOR: dbKeys.retail_divisor || process.env.RETAIL_DIVISOR || '0.3',
            MIN_PRICE_DIVISOR: dbKeys.min_price_divisor || process.env.MIN_PRICE_DIVISOR || '0.45',
            OPENAI_API_KEY: (dbKeys.openai_key || process.env.OPENAI_API_KEY) ? `${(dbKeys.openai_key || process.env.OPENAI_API_KEY).substring(0, 8)}...` : 'Not Set',
            MOYSKLAD_LOGIN: (dbKeys.moysklad_login || process.env.MOYSKLAD_LOGIN) || 'Not Set',
            KASPI_API_TOKEN: (dbKeys.kaspi_token || process.env.KASPI_API_TOKEN) ? 'Connected ✅' : 'Not Set',
        };

        return NextResponse.json(keys);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}
