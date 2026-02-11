import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        if (!supabase) {
            return NextResponse.json({ running: false, logs: 'Supabase not configured.' });
        }

        // Get the most recent job
        const { data, error } = await supabase
            .from('parser_queue')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json({ running: false, logs: 'Error fetching status.' });
        }

        if (!data || data.length === 0) {
            return NextResponse.json({ running: false, logs: 'No active jobs found.' });
        }

        const job = data[0];
        // Consider it "running" if it's pending or processing
        const isRunning = job.status === 'pending' || job.status === 'processing';

        // Format a log message to display in the UI
        let logMessage = `[${new Date(job.created_at).toLocaleTimeString()}] Job #${job.id}\n`;
        logMessage += `Target: ${job.mode === 'top' ? 'TOP 100' : job.query}\n`;
        logMessage += `Status: ${job.status.toUpperCase()}\n`;

        if (job.log) {
            logMessage += `Details: ${job.log}`;
        } else if (job.status === 'pending') {
            logMessage += `Waiting for worker...`;
        } else if (job.status === 'processing') {
            logMessage += `Worker is processing...`;
        }

        return NextResponse.json({
            running: isRunning,
            logs: logMessage
        });

    } catch (error) {
        console.error('Status fetch error:', error);
        return NextResponse.json({ error: 'Failed to read status' }, { status: 500 });
    }
}
