import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export async function GET(request) {
    const path = request.nextUrl.searchParams.get('path');

    if (!path) {
        return NextResponse.json(
            { message: 'Missing path param' },
            { status: 400 }
        );
    }

    try {
        revalidatePath(path);
        return NextResponse.json({ revalidated: true, now: Date.now() });
    } catch (err) {
        return NextResponse.json(
            { message: 'Error revalidating', error: err.message },
            { status: 500 }
        );
    }
}
