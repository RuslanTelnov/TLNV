import { supabase } from './supabase';

let cachedSettings = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60000; // 1 minute

export async function getSettings(forceRefresh = false) {
    const now = Date.now();

    if (!forceRefresh && cachedSettings && (now - lastFetchTime < CACHE_DURATION)) {
        return cachedSettings;
    }

    if (!supabase) {
        throw new Error('Supabase configuration missing');
    }

    const { data, error } = await supabase.from('client_configs').select('*').limit(1).single();

    if (error && error.code !== 'PGRST116') {
        throw new Error(`Database error: ${error.message}`);
    }

    const dbKeys = data || {};

    const settings = {
        REST_API_KEY: dbKeys.rest_api_key || process.env.REST_API_KEY || 'Not Set',
        SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not Set',
        KASPI_BASE_XML_URL: dbKeys.kaspi_xml_url || process.env.KASPI_BASE_XML_URL || 'Not Set',
        RETAIL_DIVISOR: dbKeys.retail_divisor || process.env.RETAIL_DIVISOR || '0.3',
        MIN_PRICE_DIVISOR: dbKeys.min_price_divisor || process.env.MIN_PRICE_DIVISOR || '0.45',
        OPENAI_API_KEY: dbKeys.openai_api_key || process.env.OPENAI_API_KEY || 'Not Set',
        AIRTABLE_API_KEY: dbKeys.airtable_api_key || process.env.AIRTABLE_API_KEY || '',
        AIRTABLE_BASE_ID: dbKeys.airtable_base_id || process.env.AIRTABLE_BASE_ID || '',
        AIRTABLE_TABLE_NAME: dbKeys.airtable_table_name || process.env.AIRTABLE_TABLE_NAME || 'Products',
        IS_AUTONOMOUS_MODE: dbKeys.is_autonomous_mode || false,
        MOYSKLAD_LOGIN: dbKeys.moysklad_login || process.env.MOYSKLAD_LOGIN || 'Not Set',
        MOYSKLAD_PASSWORD: dbKeys.moysklad_password || process.env.MOYSKLAD_PASSWORD || 'Not Set',
        KASPI_API_TOKEN: dbKeys.kaspi_token || process.env.KASPI_API_TOKEN || 'Not Set',
    };

    cachedSettings = settings;
    lastFetchTime = now;

    return settings;
}

export function clearSettingsCache() {
    cachedSettings = null;
    lastFetchTime = 0;
}
