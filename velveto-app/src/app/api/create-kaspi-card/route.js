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

        const projectRoot = process.cwd();
        const venvPath = ['.venv', 'bin', 'python'].join(path.sep);
        const scriptPath = path.join(projectRoot, 'automation', 'kaspi', 'create_from_ms.py');
        // Note: We expect python to be in PATH on Vercel or locally. 
        // Using a hardcoded .venv path is not reliable on Vercel.
        const pythonCommand = 'python3';

        const args = [
            scriptPath,
            '--article', String(product.id)
        ];

        console.log('Executing Kaspi Card Creation...');

        return new Promise((resolve) => {
            execFile(pythonCommand, args, { cwd: path.join(projectRoot, 'automation', 'kaspi') }, (error, stdout, stderr) => {
                if (error) {
                    console.error('Error executing script:', error);
                    resolve(NextResponse.json({ error: 'Failed to execute Kaspi creation', details: stderr }, { status: 500 }));
                    return;
                }

                console.log('Script output:', stdout);

                if (stdout.includes('Successfully created Kaspi card')) {
                    resolve(NextResponse.json({ success: true, output: stdout }));
                } else {
                    console.error('Kaspi Creation Failed. Stdout:', stdout);
                    console.error('Stderr:', stderr); // Log stderr

                    // Extract specific error from stderr or stdout
                    let errorMessage = 'Failed to create Kaspi card';
                    const errorLine = (stderr + stdout).split('\n').find(line => line.includes('❌'));
                    if (errorLine) {
                        errorMessage = errorLine.replace('❌', '').trim();
                    }

                    resolve(NextResponse.json({
                        error: errorMessage,
                        details: stdout,
                        stderr: stderr
                    }, { status: 500 }));
                }
            });
        });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
