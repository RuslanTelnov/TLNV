import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const search = searchParams.get('search');

        if (!supabase) {
            return NextResponse.json({ error: 'Supabase client not initialized' }, { status: 500 });
        }

        let query = supabase
            .from('wb_search_results')
            .select('id, name, updated_at, conveyor_status, conveyor_log, ms_created, stock_added, kaspi_created, image_url, price_kzt');

        if (status && status !== 'total') {
            if (status === 'idle') {
                query = query.or('conveyor_status.eq.idle,conveyor_status.is.null');
            } else {
                query = query.eq('conveyor_status', status);
            }
        }

        if (search) {
            const isNumeric = /^\d+$/.test(search);
            if (isNumeric) {
                // Search in name or exact ID match for numeric
                query = query.or(`name.ilike.%${search}%,id.eq.${search}`);
            } else {
                // Search only in name for text
                query = query.ilike('name', `%${search}%`);
            }
        }

        const { data, error } = await query
            .order('updated_at', { ascending: false })
            .limit(100);

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        console.error('Items API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
