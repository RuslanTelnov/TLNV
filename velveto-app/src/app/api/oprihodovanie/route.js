import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import path from 'path';
import { validateApiKey } from '@/lib/api-auth';

export async function POST(request) {
    const authError = await validateApiKey(request);
    if (authError) return authError;
    try {
        const body = await request.json();
        const { product, quantity } = body;

        if (!product) {
            return NextResponse.json({ error: 'Product data is required' }, { status: 400 });
        }

        const projectRoot = process.cwd();
        const scriptPath = path.join(projectRoot, 'automation', 'moysklad', 'oprihodovanie.py');
        const pythonCommand = 'python3';

        // We use the WB ID as article
        const args = [
            scriptPath,
            '--article', String(product.id),
            '--name', product.name,
            '--quantity', String(quantity || 1),
            '--price', String(product.price_kzt || 0)
        ];

        console.log('Executing Oprihodovanie...');

        return new Promise((resolve) => {
            execFile(pythonCommand, args, { cwd: path.join(projectRoot, 'automation', 'moysklad') }, (error, stdout, stderr) => {
                if (error) {
                    console.error('Error executing script:', error);
                    resolve(NextResponse.json({ error: 'Failed to execute oprihodovanie', details: stderr }, { status: 500 }));
                    return;
                }

                console.log('Script output:', stdout);

                try {
                    const jsonStart = stdout.indexOf('JSON_START');
                    const jsonEnd = stdout.indexOf('JSON_END');
                    if (jsonStart !== -1 && jsonEnd !== -1) {
                        const jsonStr = stdout.substring(jsonStart + 10, jsonEnd).trim();
                        const result = JSON.parse(jsonStr);
                        if (result.success) {
                            resolve(NextResponse.json({ success: true, data: result.data }));
                        } else {
                            resolve(NextResponse.json({ error: result.error }, { status: 500 }));
                        }
                    } else {
                        resolve(NextResponse.json({ error: 'Invalid script output' }, { status: 500 }));
                    }
                } catch (e) {
                    resolve(NextResponse.json({ error: 'Parse error', details: e.message }, { status: 500 }));
                }
            });
        });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
