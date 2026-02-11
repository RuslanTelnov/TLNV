import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import path from 'path';
import { validateApiKey } from '@/lib/api-auth';

export async function POST(request) {
    const authError = await validateApiKey(request);
    if (authError) return authError;
    try {
        const body = await request.json();
        const { title, price, imageUrl } = body;

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        // Paths
        // Assuming the project root is two levels up from moysklad-web
        // We need to be careful with paths. 
        // The node process runs in moysklad-web directory usually.
        const projectRoot = process.cwd();
        const scriptPath = path.join(projectRoot, 'automation', 'root_scripts', 'run_scout_cli.py');
        const pythonCommand = 'python3';

        console.log('Executing Market Scout...');
        console.log('Python:', pythonPath);
        console.log('Script:', scriptPath);
        console.log('Args:', { title, price, imageUrl });

        const args = [
            scriptPath
        ];

        if (title) args.push('--title', title);
        if (price) args.push('--price', String(price || 0));
        if (body.msName) args.push('--ms_name', body.msName);

        if (imageUrl) {
            args.push('--image_url', imageUrl);
        }

        return new Promise((resolve) => {
            execFile(pythonCommand, args, { cwd: projectRoot }, (error, stdout, stderr) => {
                if (error) {
                    console.error('Error executing script:', error);
                    console.error('Stderr:', stderr);
                    resolve(NextResponse.json({ error: 'Failed to execute search', details: stderr }, { status: 500 }));
                    return;
                }

                try {
                    // Extract JSON between markers
                    const jsonStart = stdout.indexOf('JSON_START');
                    const jsonEnd = stdout.indexOf('JSON_END');

                    if (jsonStart !== -1 && jsonEnd !== -1) {
                        const jsonStr = stdout.substring(jsonStart + 10, jsonEnd).trim();
                        const results = JSON.parse(jsonStr);
                        resolve(NextResponse.json({ results }));
                    } else {
                        // Fallback for backward compatibility or errors
                        console.warn('JSON markers not found, attempting full parse');
                        const results = JSON.parse(stdout);
                        resolve(NextResponse.json({ results }));
                    }
                } catch (parseError) {
                    console.error('Error parsing JSON:', parseError);
                    console.log('Stdout:', stdout);
                    resolve(NextResponse.json({ error: 'Invalid response from scraper', raw: stdout }, { status: 500 }));
                }
            });
        });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
