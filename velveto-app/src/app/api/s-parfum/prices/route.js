import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    const jsonPath = path.join(process.cwd(), 'data', 's_parfum_full_catalog.json');

    if (fs.existsSync(jsonPath)) {
        try {
            const fileData = fs.readFileSync(jsonPath, 'utf8');
            return NextResponse.json(JSON.parse(fileData));
        } catch (error) {
            console.error('Error reading S-Parfum JSON:', error);
            return NextResponse.json({ error: 'Failed to parse data', prices: [], others: [] }, { status: 500 });
        }
    }

    // Fallback or empty state if file not found
    return NextResponse.json({ prices: [], others: [] });
}
