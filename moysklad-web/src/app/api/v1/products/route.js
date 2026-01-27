import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { validateApiKey } from '@/lib/api-auth';

export const revalidate = 60;

export async function GET(request) {
    // 1. Authenticate
    const authError = await validateApiKey(request);
    if (authError) return authError;

    // 2. Parse Query Params
    const { searchParams } = new URL(request.url);
    const brand = searchParams.get('brand');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    try {
        let query = supabase
            .from('wb_search_results')
            .select('*', { count: 'exact' })
            .order('updated_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (brand) {
            query = query.ilike('brand', `%${brand}%`);
        }

        const { data, error, count } = await query;

        if (error) throw error;

        return NextResponse.json({
            data,
            pagination: {
                total: count,
                limit,
                offset
            }
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
            }
        });
    } catch (error) {
        console.error('API Products Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
