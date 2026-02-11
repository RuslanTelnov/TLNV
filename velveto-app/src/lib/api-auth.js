import { NextResponse } from 'next/server';
import { getSettings } from './settings-service';

/**
 * Validates the X-API-KEY header against the REST_API_KEY in settings (DB or ENV).
 * @param {Request} request 
 * @returns {Promise<null|Response>} Returns a 401 response if invalid, null if valid.
 */
export async function validateApiKey(request) {
    const apiKey = request.headers.get('x-api-key');

    try {
        const settings = await getSettings();
        const validKey = settings.REST_API_KEY;

        if (!validKey || validKey === 'Not Set') {
            console.error('REST_API_KEY is not set in settings');
            return NextResponse.json({ error: 'System configuration error: REST_API_KEY not set' }, { status: 500 });
        }

        if (!apiKey || apiKey !== validKey) {
            return NextResponse.json({ error: 'Unauthorized: Invalid API Key' }, { status: 401 });
        }

        return null;
    } catch (error) {
        console.error('Auth check error:', error);
        return NextResponse.json({ error: 'Authentication service error' }, { status: 500 });
    }
}
