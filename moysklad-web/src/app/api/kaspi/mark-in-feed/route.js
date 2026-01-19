import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
    try {
        const body = await request.json();
        const { productId } = body;

        if (!productId) {
            return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
        }

        // Update kaspi_created in wb_search_results
        const { error } = await supabase
            .from('wb_search_results')
            .update({
                kaspi_created: true,
                conveyor_status: 'in_feed'
            })
            .eq('id', productId);

        if (error) throw error;

        return NextResponse.json({ success: true, message: 'Added to XML feed bridge' });
    } catch (error) {
        console.error('Mark In Feed Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
