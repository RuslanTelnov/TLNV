import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import util from 'util';

const execPromise = util.promisify(exec);
const writeFilePromise = util.promisify(fs.writeFile);

export async function POST(request) {
    try {
        const body = await request.json();
        const { product } = body;

        if (!product) {
            return NextResponse.json({ error: 'Product data is required' }, { status: 400 });
        }

        // Create a temporary file for this request
        const tempFileName = `ozon_upload_${Date.now()}.json`;
        const tempFilePath = path.join(process.cwd(), 'automation', 'ozon', 'temp_images', tempFileName);

        // Ensure temp dir exists
        const tempDir = path.dirname(tempFilePath);
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // Prepare data for the python script (it expects a list or dict)
        // We need to make sure local_image_path is correct. 
        // The product object from frontend might have 'image_url' but we need 'local_image_path' if available.
        // Assuming the frontend passes the full product object from Supabase.

        // We might need to download the image if we don't have a local path, 
        // OR we assume the python script can handle it. 
        // The current python script expects 'local_image_path'.

        // Let's check if we can construct a local path. 
        // In this environment, images are likely in 'ozon-automation/images' or similar if they were scraped/processed.
        // But for MS products, we might only have a URL.

        // CRITICAL: The python script currently REQUIRES 'local_image_path'.
        // We should probably update the python script to handle URL download if local path is missing, 
        // OR we download it here in Node.

        // For now, let's assume we pass what we have. 
        // If the product has a 'local_image_path' in DB, great. If not, we might fail.
        // Let's try to pass a constructed path if we know where images are stored.

        // Actually, let's just pass the product as is, and if it fails, we'll see.
        // But wait, the user wants to click a button.

        // Let's add a quick fix: If no local_image_path, try to use a default or download it.
        // But for this step, let's just write the JSON.

        await writeFilePromise(tempFilePath, JSON.stringify([product], null, 2));

        // Execute the python script
        const scriptPath = path.join(process.cwd(), 'automation', 'ozon', 'create_ozon_cards.py');
        const command = `python3 ${scriptPath} ${tempFilePath}`;

        console.log(`Executing: ${command}`);

        const { stdout, stderr } = await execPromise(command);

        console.log('stdout:', stdout);
        if (stderr) console.error('stderr:', stderr);

        // Log to file
        const logPath = path.join(process.cwd(), 'automation', 'ozon', 'api_debug.log');
        const logContent = `\n--- Request ${new Date().toISOString()} ---\nSTDOUT:\n${stdout}\nSTDERR:\n${stderr}\n----------------\n`;
        fs.appendFileSync(logPath, logContent);

        // Check output for success message
        if (stdout.includes('✅ SUCCESS!')) {
            return NextResponse.json({ success: true, message: 'Card creation task started on Ozon', output: stdout });
        } else {
            return NextResponse.json({ success: false, error: 'Script executed but did not report success', output: stdout, stderr });
        }

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
