import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
}) : null;

export async function POST(request) {
    try {
        const { style, image, product } = await request.json(); // Added 'product' to request body in frontend if needed, or assume it's passed
        console.log('API: generate-image called. Style:', style);

        if (!process.env.OPENAI_API_KEY) {
            // Fallback to Unsplash Mock
            console.log('OpenAI key missing, using Unsplash mock');
            await new Promise(resolve => setTimeout(resolve, 1500));

            let images = [];
            const randomSig = () => Math.floor(Math.random() * 1000);

            if (style.includes('Минимализм')) {
                images.push(`https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80&sig=${randomSig()}`);
                images.push(`https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80&sig=${randomSig()}`);
            } else {
                images.push(`https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&q=80&sig=${randomSig()}`);
                images.push(`https://images.unsplash.com/photo-1535378437323-9555f3e7f5bb?w=500&q=80&sig=${randomSig()}`);
            }
            return NextResponse.json({ images });
        }

        // If an image is provided, we might want to use it for variations (DALL-E 2 only) or just return it.
        // For now, let's focus on text-to-image generation using DALL-E 3.

        if (image) {
            // TODO: Implement image variations if needed. DALL-E 3 doesn't support variations of uploaded images directly in the same way.
            // For now, return the original to avoid breaking flow.
            return NextResponse.json({ images: [image] });
        }

        const prompt = `Professional product photography of ${product || 'a product'}, style: ${style}. High quality, studio lighting, 4k.`;

        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1024x1024",
        });

        const imageUrl = response.data[0].url;

        return NextResponse.json({ images: [imageUrl] });

    } catch (error) {
        console.error('OpenAI Image Error:', error);
        return NextResponse.json({ error: 'Failed to generate images: ' + error.message }, { status: 500 });
    }
}
