import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        if (!supabase) {
            return NextResponse.json({ error: 'Supabase client not initialized' }, { status: 500 });
        }

        // Fetch counts for different statuses
        const { data, error } = await supabase
            .from('wb_search_results')
            .select('conveyor_status');

        if (error) throw error;

        const stats = {
            total: data.length,
            idle: data.filter(item => item.conveyor_status === 'idle' || !item.conveyor_status).length,
            processing: data.filter(item => item.conveyor_status === 'processing').length,
            done: data.filter(item => item.conveyor_status === 'done').length,
            error: data.filter(item => item.conveyor_status === 'error').length,
            success_rate: 0
        };

        if (stats.total > 0) {
            stats.success_rate = Math.round((stats.done / stats.total) * 100);
        }

        return NextResponse.json(stats);
    } catch (error) {
        console.error('Stats API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
