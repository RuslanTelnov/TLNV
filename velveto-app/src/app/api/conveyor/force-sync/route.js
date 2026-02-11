import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req) {
    try {
        const { id } = await req.json();

        if (!id) {
            return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
        }

        if (!supabase) {
            return NextResponse.json({ error: 'Supabase client not initialized' }, { status: 500 });
        }

        // Reset status to idle so the conveyor picks it up again
        // We also reset the creation flags to allow a full cycle if needed
        const { error } = await supabase
            .from('wb_search_results')
            .update({
                conveyor_status: 'idle',
                ms_created: false,
                stock_added: false,
                kaspi_created: false,
                conveyor_log: 'Force Sync triggered from Dashboard at ' + new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            console.error('Supabase update error:', error);
            throw error;
        }

        return NextResponse.json({ success: true, id });
    } catch (error) {
        console.error('Force Sync API Exception:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
