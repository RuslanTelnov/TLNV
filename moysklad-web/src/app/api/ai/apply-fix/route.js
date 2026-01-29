import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; // Using the singleton client

export async function POST(req) {
    try {
        const { productId, actionType, payload } = await req.json();

        if (!productId || !actionType || !payload) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (actionType === 'update_field') {
            const { field, value } = payload;

            // Validate allowed fields
            const allowedFields = ['name', 'description', 'brand', 'kaspi_category_id'];
            if (!allowedFields.includes(field)) {
                return NextResponse.json({ error: `Field '${field}' is not allowed for AI updates` }, { status: 400 });
            }

            let updateData = {
                kaspi_status: 'pending', // Reset status for UI
                kaspi_created: false,   // Allow conveyor to re-trigger creation
                kaspi_details: null,    // Clear previous error
                conveyor_status: 'idle' // Reset conveyor
            };

            // Fetch current data to increment retries
            const { data: currentItem } = await supabase
                .schema('Parser')
                .table('wb_search_results')
                .select('moderation_retries')
                .eq('id', productId)
                .single();

            updateData.moderation_retries = (currentItem?.moderation_retries || 0) + 1;

            // Handle virtual fields (store in specs)
            if (field === 'kaspi_category_id') {
                // Fetch current specs first
                const { data: currentData } = await supabase
                    .schema('Parser')
                    .table('wb_search_results')
                    .select('specs')
                    .eq('id', productId)
                    .single();

                const currentSpecs = currentData?.specs || {};
                updateData.specs = { ...currentSpecs, kaspi_category_id: value };
            } else {
                // Update real column
                updateData[field] = value;
            }

            // Update database
            const { error } = await supabase
                .schema('Parser')
                .table('wb_search_results')
                .update(updateData)
                .eq('id', productId);

            if (error) throw error;

            return NextResponse.json({ success: true, message: 'Fix applied successfully' });
        }

        return NextResponse.json({ error: 'Unknown action type' }, { status: 400 });

    } catch (error) {
        console.error('Apply Fix Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
