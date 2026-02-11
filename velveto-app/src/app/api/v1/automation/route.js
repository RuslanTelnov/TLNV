import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { validateApiKey } from '@/lib/api-auth';

export async function GET(request) {
    const authError = await validateApiKey(request);
    if (authError) return authError;

    try {
        const { data, error } = await supabase
            .from('parser_queue')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) throw error;

        return NextResponse.json({
            queue: data,
            status: data.length > 0 ? data[0].status : 'idle'
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    const authError = await validateApiKey(request);
    if (authError) return authError;

    try {
        const body = await request.json();
        const { action, query, mode, page } = body;

        let job = {};

        if (action === 'parse') {
            job = {
                mode: mode || 'search',
                query: query || '',
                page: page || 1,
                status: 'pending'
            };
        } else if (action === 'conveyor_start') {
            job = {
                mode: 'top',
                query: 'Хиты',
                status: 'pending',
                log: 'Queued via REST API'
            };
        } else {
            return NextResponse.json({ error: 'Invalid action. Use "parse" or "conveyor_start"' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('parser_queue')
            .insert([job])
            .select();

        if (error) throw error;

        return NextResponse.json({ success: true, message: 'Job queued successfully', job: data[0] });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    const authError = await validateApiKey(request);
    if (authError) return authError;

    try {
        const { error } = await supabase
            .from('parser_queue')
            .update({ status: 'stopped', log: 'Cancelled via REST API' })
            .eq('status', 'pending');

        if (error) throw error;

        return NextResponse.json({ message: 'Queue cleared' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
