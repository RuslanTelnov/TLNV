import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
    try {
        const body = await request.json();
        const { query, mode, page } = body;

        console.log('Queuing WB Top Parser Job:', { query, mode, page });

        // Insert job into queue
        const { data, error } = await supabase
            .from('parser_queue')
            .insert([
                {
                    mode: mode || 'search',
                    query: query || '',
                    page: page || 1,
                    status: 'pending'
                }
            ])
            .select();

        if (error) {
            console.error('Queue Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Job queued successfully', job: data[0] });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
