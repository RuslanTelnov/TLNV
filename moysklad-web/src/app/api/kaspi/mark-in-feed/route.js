
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
    try {
        const { id, is_in_feed } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        // 1. Get current specs
        const { data: currentData } = await supabase
            .from('wb_search_results')
            .select('specs')
            .eq('id', id)
            .single();

        const specs = currentData?.specs || {};
        specs.is_in_feed = is_in_feed;

        // 2. Update specs
        const { error } = await supabase
            .from('wb_search_results')
            .update({
                specs: specs,
                kaspi_created: is_in_feed // Also update legacy flag if true
            })
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true, is_in_feed });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
