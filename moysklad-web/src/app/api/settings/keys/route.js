import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Try to fetch from Supabase if envs are missing (for Vercel persistence)
        let dbKeys = {};
        try {
            const { supabase } = require('@/lib/supabase');
            const { data } = await supabase.table('client_configs').select('*').limit(1).single();
            if (data) dbKeys = data;
        } catch (e) {
            // Table might not exist yet
        }

        const keys = {
            REST_API_KEY: process.env.REST_API_KEY || dbKeys.rest_api_key || 'Not Set',
            SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not Set',
            KASPI_BASE_XML_URL: process.env.KASPI_BASE_XML_URL || dbKeys.kaspi_xml_url || 'Not Set',
            RETAIL_DIVISOR: process.env.RETAIL_DIVISOR || dbKeys.retail_divisor || '0.3',
            MIN_PRICE_DIVISOR: process.env.MIN_PRICE_DIVISOR || dbKeys.min_price_divisor || '0.45',
            // Mask sensitive ones and use CORRECT column names from DB
            OPENAI_API_KEY: (process.env.OPENAI_API_KEY || dbKeys.openai_key) ? `${(process.env.OPENAI_API_KEY || dbKeys.openai_key).substring(0, 8)}...` : 'Not Set',
            MOYSKLAD_LOGIN: (process.env.MOYSKLAD_LOGIN || dbKeys.moysklad_login) || 'Not Set',
            KASPI_API_TOKEN: (process.env.KASPI_API_TOKEN || dbKeys.kaspi_token) ? 'Connected ✅' : 'Not Set',
        };

        return NextResponse.json(keys);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}
