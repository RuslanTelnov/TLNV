import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/settings-service';

export const revalidate = 60; // Revalidate every 60 seconds

export async function GET() {
    try {
        const settings = await getSettings();

        return NextResponse.json(settings, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
            }
        });
    } catch (error) {
        console.error('Settings API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

