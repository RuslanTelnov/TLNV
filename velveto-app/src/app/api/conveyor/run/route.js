import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { validateApiKey } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    const authError = await validateApiKey(request);
    if (authError) return authError;
    try {
        if (!supabase) {
            return NextResponse.json({ error: 'Supabase not configured.' }, { status: 500 });
        }

        // Insert a new job for "Top Hits"
        // This effectively "Starts the Parser"
        const job = {
            mode: 'top',
            query: 'Хиты',
            status: 'pending',
            log: 'Queued via Dashboard'
        };

        const { data, error } = await supabase
            .from('parser_queue')
            .insert(job)
            .select();

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json({ error: 'Failed to queue job: ' + error.message }, { status: 500 });
        }

        return NextResponse.json({
            message: 'Parser started! (Job Queued)',
            status: 'running',
            job: data[0]
        });

    } catch (error) {
        console.error('Run error:', error);
        return NextResponse.json({ error: 'Failed to start parser' }, { status: 500 });
    }
}

export async function DELETE(request) {
    const authError = await validateApiKey(request);
    if (authError) return authError;
    // Logic to "Stop" - we can't easily kill the remote worker process for the CURRENT job,
    // but we can clear any PENDING jobs so they don't start.
    try {
        if (!supabase) {
            return NextResponse.json({ error: 'Supabase not configured.' }, { status: 500 });
        }

        // Update all 'pending' jobs to 'stopped'
        const { error } = await supabase
            .from('parser_queue')
            .update({ status: 'stopped', log: 'Cancelled by user' })
            .eq('status', 'pending');

        if (error) {
            return NextResponse.json({ error: 'Failed to stop queue' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Queue cleared. Active job will finish soon.' });

    } catch (error) {
        return NextResponse.json({ error: 'Failed to stop' }, { status: 500 });
    }
}
