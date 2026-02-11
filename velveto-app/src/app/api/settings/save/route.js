import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { clearSettingsCache } from '@/lib/settings-service';

export async function POST(req) {
    try {
        const body = await req.json();
        const {
            REST_API_KEY,
            KASPI_BASE_XML_URL,
            RETAIL_DIVISOR,
            MIN_PRICE_DIVISOR,
            MOYSKLAD_LOGIN,
            MOYSKLAD_PASSWORD,
            KASPI_API_TOKEN,
            OPENAI_API_KEY
        } = body;

        if (!supabase) {
            return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
        }

        // Map UI names to DB column names
        const updateData = {
            updated_at: new Date().toISOString()
        };

        // Only update fields if they are provided and not "Not Set"
        const setIfValid = (dbField, uiValue) => {
            if (uiValue !== undefined && uiValue !== null && uiValue !== 'Not Set' && uiValue !== '') {
                updateData[dbField] = uiValue;
            }
        };

        setIfValid('rest_api_key', REST_API_KEY);
        setIfValid('kaspi_xml_url', KASPI_BASE_XML_URL);
        setIfValid('moysklad_login', MOYSKLAD_LOGIN);

        if (RETAIL_DIVISOR !== undefined && RETAIL_DIVISOR !== 'Not Set' && RETAIL_DIVISOR !== '') {
            updateData.retail_divisor = parseFloat(RETAIL_DIVISOR);
        }
        if (MIN_PRICE_DIVISOR !== undefined && MIN_PRICE_DIVISOR !== 'Not Set' && MIN_PRICE_DIVISOR !== '') {
            updateData.min_price_divisor = parseFloat(MIN_PRICE_DIVISOR);
        }

        // Only update sensitive fields if they are provided (not masking string)
        if (MOYSKLAD_PASSWORD &&
            !MOYSKLAD_PASSWORD.includes('***') &&
            MOYSKLAD_PASSWORD !== 'Not Set' &&
            MOYSKLAD_PASSWORD !== '') {
            updateData.moysklad_password = MOYSKLAD_PASSWORD;
        }
        if (KASPI_API_TOKEN &&
            !KASPI_API_TOKEN.includes('Connected') &&
            KASPI_API_TOKEN !== 'Not Set' &&
            KASPI_API_TOKEN !== '') {
            updateData.kaspi_token = KASPI_API_TOKEN;
        }
        if (OPENAI_API_KEY &&
            !OPENAI_API_KEY.includes('...') &&
            !OPENAI_API_KEY.includes('Connected') &&
            OPENAI_API_KEY !== 'Not Set' &&
            OPENAI_API_KEY !== '') {
            updateData.openai_api_key = OPENAI_API_KEY; // Corrected column name
        }

        // Airtable
        setIfValid('airtable_api_key', body.AIRTABLE_API_KEY);
        setIfValid('airtable_base_id', body.AIRTABLE_BASE_ID);
        setIfValid('airtable_table_name', body.AIRTABLE_TABLE_NAME);

        // Autonomous Mode (ensure boolean)
        if (body.IS_AUTONOMOUS_MODE !== undefined) {
            updateData.is_autonomous_mode = !!body.IS_AUTONOMOUS_MODE;
        }

        console.log('Updating settings with fields:', Object.keys(updateData));

        const { data, error } = await supabase
            .from('client_configs')
            .update(updateData)
            .eq('company_name', 'VELVETO');

        if (error) {
            console.error('Supabase Update Error:', error);
            throw error;
        }

        // Clear settings cache so next GET fetch gets fresh data
        clearSettingsCache();

        return NextResponse.json({ success: true, updatedFields: Object.keys(updateData) });
    } catch (error) {
        console.error('Save Settings Exception:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
