import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import path from 'path';

export async function POST(request) {
    try {
        const body = await request.json();
        const { product } = body;

        if (!product) {
            return NextResponse.json({ error: 'Product data is required' }, { status: 400 });
        }

        // Map WB Top product to internal 'products' table schema
        const newProduct = {
            name: product.name,
            article: String(product.id),
            price: (product.price_kzt || 0) * 100,
            min_price: (product.price_kzt || 0) * 100,
            cost_price: 0,
            stock: 0,
            image_url: product.image_url,
            created_at: new Date().toISOString()
        };

        // Insert into Supabase
        const { data, error } = await supabase
            .from('products')
            .insert([newProduct])
            .select();

        if (error) {
            console.error('Supabase insert error:', error);
            if (error.code === '23505') {
                return NextResponse.json({ error: 'Товар уже существует в базе данных' }, { status: 409 });
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // --- SYNC TO MOYSKLAD ---
        let syncResult = { success: false, message: 'Not attempted' };

        try {
            const projectRoot = process.cwd();
            const scriptPath = path.join(projectRoot, 'automation', 'moysklad', 'create_single_product_in_ms.py');
            const pythonCommand = 'python3';

            const args = [
                scriptPath,
                '--name', product.name,
                '--article', String(product.id),
                '--price', String(product.price_kzt || 0),
            ];

            if (product.specs && product.specs.image_urls && Array.isArray(product.specs.image_urls)) {
                args.push('--image_urls', ...product.specs.image_urls);
            } else if (product.image_url) {
                args.push('--image_urls', product.image_url);
            }

            console.log('Syncing to MoySklad...');
            console.log('Command:', pythonCommand);

            await new Promise((resolve) => {
                execFile(pythonCommand, args, { cwd: path.join(projectRoot, 'automation', 'moysklad') }, async (err, stdout, stderr) => {
                    if (err) {
                        console.error('Python script error:', err);
                        console.error('Stderr:', stderr);
                        console.error('Stdout:', stdout); // Log stdout too
                        syncResult = { success: false, error: err.message, stderr, stdout };
                        resolve();
                        return;
                    }

                    try {
                        const jsonStart = stdout.indexOf('JSON_START');
                        const jsonEnd = stdout.indexOf('JSON_END');
                        if (jsonStart !== -1 && jsonEnd !== -1) {
                            const jsonStr = stdout.substring(jsonStart + 10, jsonEnd).trim();
                            const result = JSON.parse(jsonStr);

                            if (result.success && result.id) {
                                console.log('MoySklad ID:', result.id);
                                // Update Supabase with MS ID
                                await supabase
                                    .from('products')
                                    .update({ moysklad_id: result.id })
                                    .eq('article', String(product.id));
                                syncResult = { success: true, id: result.id };
                            } else {
                                console.error('MoySklad sync failed:', result.error);
                                syncResult = { success: false, error: result.error };
                            }
                        } else {
                            syncResult = { success: false, error: 'Invalid output format', stdout };
                        }
                    } catch (parseErr) {
                        console.error('Error parsing Python output:', parseErr);
                        syncResult = { success: false, error: 'JSON parse error', details: parseErr.message };
                    }
                    resolve();
                });
            });

        } catch (syncErr) {
            console.error('Sync error:', syncErr);
            syncResult = { success: false, error: syncErr.message };
        }

        // --- SYNC TO KASPI ---
        // --- SYNC TO KASPI (DISABLED FOR NOW to avoid double creation) ---
        let kaspiResult = { success: false, message: 'Disabled' };
        /* 
        if (syncResult.success) {
            try {
                // ... (Kaspi sync logic removed for brevity)
            } catch (kaspiErr) {
                console.error('Kaspi sync error:', kaspiErr);
                kaspiResult = { success: false, error: kaspiErr.message };
            }
        }
        */

        return NextResponse.json({
            success: true,
            data,
            sync: syncResult,
            kaspi: kaspiResult
        });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
