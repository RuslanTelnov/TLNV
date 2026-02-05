import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');

        if (!supabase) {
            return NextResponse.json({ error: 'Supabase client not initialized' }, { status: 500 });
        }

        let query = supabase
            .from('wb_search_results')
            .select('id, name, updated_at, conveyor_status, conveyor_log, ms_created, stock_added, kaspi_created');

        if (status && status !== 'total') {
            if (status === 'idle') {
                // Handle idle which can be null or 'idle'
                query = query.or('conveyor_status.eq.idle,conveyor_status.is.null');
            } else {
                query = query.eq('conveyor_status', status);
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
