import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import path from 'path';

export async function POST(request) {
    try {
        const projectRoot = path.resolve(process.cwd(), '..');
        // Use dynamic path to avoid Turbopack build-time validation of symlinks
        const venvPath = ['.venv', 'bin', 'python'].join(path.sep);
        const pythonPath = path.join(projectRoot, 'moysklad-automation', venvPath);
        const scriptPath = path.join(projectRoot, 'moysklad-automation', 'update_wb_search_results.py');

        console.log('Executing WB Search Results Updater...');

        return new Promise((resolve) => {
            execFile(pythonPath, [scriptPath], { cwd: path.join(projectRoot, 'moysklad-automation') }, (error, stdout, stderr) => {
                if (error) {
                    console.error('Error executing script:', error);
                    console.error('Stderr:', stderr);
                    resolve(NextResponse.json({ error: 'Failed to update products', details: stderr }, { status: 500 }));
                    return;
                }

                console.log('Updater output:', stdout);
                resolve(NextResponse.json({ success: true, message: 'Products updated successfully', output: stdout }));
            });
        });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
