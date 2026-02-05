import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        if (!supabase) {
            return NextResponse.json({ error: 'Supabase client not initialized' }, { status: 500 });
        }

        const { data, error } = await supabase
            .from('wb_search_results')
            .select('id, name, updated_at, conveyor_log')
            .eq('conveyor_status', 'error')
            .order('updated_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        console.error('Errors API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
