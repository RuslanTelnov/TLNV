import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const article = searchParams.get('article');

    if (!article) {
        return NextResponse.json({ error: 'Article parameter is required' }, { status: 400 });
    }

    const login = process.env.MOYSKLAD_LOGIN;
    const password = process.env.MOYSKLAD_PASSWORD;
    const auth = Buffer.from(`${login}:${password}`).toString('base64');

    try {
        const response = await fetch(`https://api.moysklad.ru/api/remap/1.2/entity/product?filter=article=${article}`, {
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`MoySklad API error: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.rows && data.rows.length > 0) {
            // Return the first match
            const product = data.rows[0];
            return NextResponse.json({
                id: product.id,
                name: product.name,
                article: product.article,
                code: product.code
            });
        } else {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
