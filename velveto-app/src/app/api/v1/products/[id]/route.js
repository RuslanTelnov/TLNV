import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { validateApiKey } from '@/lib/api-auth';

export async function GET(request, { params }) {
    const authError = await validateApiKey(request);
    if (authError) return authError;

    const { id } = params;

    try {
        const { data, error } = await supabase
            .from('wb_search_results')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!data) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(request, { params }) {
    const authError = await validateApiKey(request);
    if (authError) return authError;

    const { id } = params;
    const body = await request.json();

    // Whitelist allowed fields for update
    const allowedFields = ['price_kzt', 'brand', 'name', 'kaspi_created', 'ms_created', 'stock_added'];
    const updateData = {};

    Object.keys(body).forEach(key => {
        if (allowedFields.includes(key)) {
            updateData[key] = body[key];
        }
    });

    if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ error: 'No valid fields provided for update' }, { status: 400 });
    }

    try {
        const { data, error } = await supabase
            .from('wb_search_results')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ message: 'Product updated successfully', data });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
