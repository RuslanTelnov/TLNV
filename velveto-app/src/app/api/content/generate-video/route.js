import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import { promisify } from 'util';
import fs from 'fs';

const execAsync = promisify(exec);

export async function POST(request) {
    try {
        const { image, product, text } = await request.json();

        if (!image) {
            return NextResponse.json({ error: 'Image is required' }, { status: 400 });
        }

        const videoId = Date.now();
        const outputFilename = `video_${videoId}.mp4`;
        const publicDir = path.join(process.cwd(), 'public', 'videos');
        const outputPath = path.join(publicDir, outputFilename);

        // Ensure directory exists
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
        }

        // generate_video.py is in the parent directory of the Next.js app
        const scriptPath = path.join(process.cwd(), '..', 'generate_video.py');

        let command = `python3 "${scriptPath}" --image "${image}" --output "${outputPath}"`;

        if (text) {
            // Escape double quotes for shell
            const escapedText = text.replace(/"/g, '\\"');
            command += ` --text "${escapedText}"`;
        } else if (product) {
            const escapedProduct = product.replace(/"/g, '\\"');
            command += ` --product "${escapedProduct}"`;
        }

        console.log(`[API] Generating video for ${product || 'image'}...`);
        console.log(`[API] Command: ${command}`);

        const { stdout, stderr } = await execAsync(command);

        if (stderr && stderr.includes('Error')) {
            console.error('[API] Python Script Error:', stderr);
        }

        console.log('[API] Script Output:', stdout);

        // Check if file was actually created
        if (!fs.existsSync(outputPath)) {
            throw new Error('Video file was not created by the script');
        }

        return NextResponse.json({
            success: true,
            videoUrl: `/videos/${outputFilename}`,
            slogan: text || 'Generated'
        });

    } catch (error) {
        console.error('[API] Video Generation Error:', error);
        return NextResponse.json({ error: 'Failed to generate video: ' + error.message }, { status: 500 });
    }
}
