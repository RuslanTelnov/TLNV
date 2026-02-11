import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export async function POST(request) {
    try {
        const { sku } = await request.json();

        if (!sku) {
            return NextResponse.json({ error: 'SKU is required' }, { status: 400 });
        }

        // 1. Fetch Kaspi Product
        // 1. Fetch Kaspi Product
        const kaspiScript = path.join(process.cwd(), '..', 'kaspi-automation', 'fetch_kaspi_product.py');
        // Use the venv python executable
        const pythonPath = path.join(process.cwd(), '..', '.venv', 'bin', 'python');
        const kaspiCmd = `"${pythonPath}" "${kaspiScript}" "${sku}"`;

        console.log(`Running Kaspi script: ${kaspiCmd}`);
        const { stdout: kaspiStdout, stderr: kaspiStderr } = await execAsync(kaspiCmd);

        if (kaspiStderr && !kaspiStdout) {
            console.error('Kaspi Script Error:', kaspiStderr);
            return NextResponse.json({ error: 'Failed to fetch Kaspi product' }, { status: 500 });
        }

        let kaspiData;
        try {
            kaspiData = JSON.parse(kaspiStdout);
        } catch (e) {
            console.error('Failed to parse Kaspi output:', kaspiStdout);
            return NextResponse.json({ error: 'Invalid response from Kaspi fetcher' }, { status: 500 });
        }

        if (kaspiData.error) {
            return NextResponse.json({ error: kaspiData.error }, { status: 404 });
        }

        let wbData = {};
        let finalResults = [];

        // 2. Search WB by Image (only if image exists)
        if (kaspiData.image_url) {
            const wbScript = path.join(process.cwd(), '..', 'wb_image_search_service.py');
            const wbCmd = `"${pythonPath}" "${wbScript}" "${kaspiData.image_url}"`;

            console.log(`Running WB script: ${wbCmd}`);
            const { stdout: wbStdout, stderr: wbStderr } = await execAsync(wbCmd);

            if (wbStderr && !wbStdout) {
                console.error('WB Script Error:', wbStderr);
                // Continue to text search
            } else {
                try {
                    wbData = JSON.parse(wbStdout);
                    finalResults = wbData.results || [];
                } catch (e) {
                    console.error('Failed to parse WB output:', wbStdout);
                }
            }
        } else {
            console.log('Kaspi product has no image. Skipping image search.');
        }



        // Fallback to text search if no results or error
        if (finalResults.length === 0) {
            console.log('WB Image Search failed, skipped, or returned no results. Falling back to text search...');
            const textScript = path.join(process.cwd(), '..', 'run_scout_cli.py');
            // Use Kaspi title, escape quotes
            let title = kaspiData.title;
            if (title) {
                // Clean title for better search results
                // Remove "1 шт", "набор", domain names, special chars
                title = title.replace(/\d+\s*шт/gi, '')
                    .replace(/brelki\.kz/gi, '')
                    .replace(/\.kz/gi, '')
                    .replace(/[^\w\sа-яё]/gi, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();

                const escapedTitle = title.replace(/"/g, '\\"');
                const textCmd = `"${pythonPath}" "${textScript}" --title "${escapedTitle}"`;

                console.log(`Running Text Search script: ${textCmd}`);
                try {
                    const { stdout: textStdout } = await execAsync(textCmd);
                    // Parse JSON from stdout (between JSON_START and JSON_END)
                    const jsonStart = textStdout.indexOf('JSON_START');
                    const jsonEnd = textStdout.indexOf('JSON_END');
                    if (jsonStart !== -1 && jsonEnd !== -1) {
                        const jsonStr = textStdout.substring(jsonStart + 10, jsonEnd).trim();
                        const textResults = JSON.parse(jsonStr);
                        if (Array.isArray(textResults)) {
                            console.log(`Text search found ${textResults.length} results.`);
                            finalResults = textResults;
                        }
                    }
                } catch (err) {
                    console.error('Text search fallback failed:', err);
                }
            }
        }

        return NextResponse.json({
            kaspi: kaspiData,
            wb: finalResults
        });

    } catch (error) {
        console.error('Arbitrage API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
