import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { validateApiKey } from '@/lib/api-auth';

export async function GET(request) {
    const authError = await validateApiKey(request);
    if (authError) return authError;

    // Use current URL to construct the feed link
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host');
    const feedUrl = `${protocol}://${host}/api/kaspi/xml-feed`;

    try {
        const { count, error } = await supabase
            .from('wb_search_results')
            .select('*', { count: 'exact', head: true })
            .eq('kaspi_created', true);

        if (error) throw error;

        return NextResponse.json({
            xml_feed_url: feedUrl,
            products_in_feed: count,
            status: 'active'
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    // Manually trigger Kaspi creation for a product
    const authError = await validateApiKey(request);
    if (authError) return authError;

    try {
        const { id } = await request.json();
        if (!id) return NextResponse.json({ error: 'Product ID required' }, { status: 400 });

        // Insert into wb_search_results or update flag? 
        // Usually, card creation is handled by the worker if 'kaspi_created' is false but intended.
        // For simplicity, we can just trigger the existing card creation route if it exists, 
        // or update the DB to let the conveyor pick it up.

        const { error } = await supabase
            .from('wb_search_results')
            .update({ kaspi_created: false, conveyor_status: 'idle' }) // Force retry
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ message: 'Product queued for Kaspi creation', id });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
