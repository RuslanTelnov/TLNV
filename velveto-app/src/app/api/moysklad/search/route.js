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
        const response = await fetch(`https://api.moysklad.ru/api/remap/1.2/entity/product?filter=article=${article}&expand=images`, {
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
            const product = data.rows[0];

            // Extract image URL if available
            let imageUrl = null;
            if (product.images && product.images.rows && product.images.rows.length > 0) {
                // MoySklad image download URL usually requires auth, but sometimes they provide a public mini
                // For our script, we need the direct link. 
                // In MoySklad API v1.2, images.rows[0].meta.downloadHref is the common way
                imageUrl = product.images.rows[0].meta.downloadHref;
            }

            return NextResponse.json({
                id: product.id,
                name: product.name,
                article: product.article,
                code: product.code,
                imageUrl: imageUrl,
                description: product.description || ''
            });
        } else {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
