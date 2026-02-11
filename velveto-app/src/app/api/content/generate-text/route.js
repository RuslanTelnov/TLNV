import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
}) : null;

export async function POST(request) {
    try {
        const { keywords, tone, product } = await request.json();

        if (!process.env.OPENAI_API_KEY) {
            // Fallback to Mock Generation
            console.log('OpenAI key missing, using mock generation');
            await new Promise(resolve => setTimeout(resolve, 1000));

            const keywordList = keywords ? keywords.split(',').map(k => k.trim()) : [];
            const featuresList = keywordList.length > 0
                ? keywordList.map(k => `- ${k.charAt(0).toUpperCase() + k.slice(1)}`).join('\n')
                : '- Высокое качество\n- Надежность\n- Стильный дизайн';

            let intro = "", body = "", conclusion = "";

            if (tone === 'Профессиональный') {
                intro = `Представляем вашему вниманию ${product} — решение, разработанное для профессионалов.`;
                body = `Данный продукт отличается исключительными характеристиками и надежностью.`;
                conclusion = `Выбирая ${product}, вы инвестируете в качество.`;
            } else if (tone === 'Дружелюбный') {
                intro = `Привет! Взгляни на ${product}! Это именно то, что тебе нужно.`;
                body = `Мы сделали всё, чтобы ${product} радовал тебя каждый день.`;
                conclusion = `Попробуй ${product} и убедись сам! 😉`;
            } else {
                intro = `Эксклюзивное предложение на ${product}.`;
                body = `Непревзойденное качество и стиль.`;
                conclusion = `Заказывайте прямо сейчас.`;
            }

            const mockText = `
${intro}

Ключевые особенности:
${featuresList}

${body}

${conclusion}
            `.trim();

            return NextResponse.json({ text: mockText });
        }

        const systemPrompt = `You are a professional copywriter for an e-commerce store. 
        Your task is to write a product description in Russian.
        Tone: ${tone || 'Neutral'}
        Structure:
        1. Catchy Title
        2. Engaging Introduction
        3. Key Features (bullet points)
        4. Detailed Body Paragraph
        5. Call to Action (Conclusion)
        
        Format the output as a JSON object with the following keys: title, intro, features (array of strings), body, conclusion.`;

        const userPrompt = `Product: ${product}
        Keywords: ${keywords || 'General'}`;

        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            model: "gpt-4o",
            response_format: { type: "json_object" },
        });

        const content = JSON.parse(completion.choices[0].message.content);

        // Format into a single string for the frontend (or keep JSON if frontend supports it, but current frontend expects text)
        // The previous mock returned a single string 'text'. Let's construct it.

        const formattedText = `
${content.title}

${content.intro}

Ключевые особенности:
${content.features.map(f => `- ${f}`).join('\n')}

${content.body}

${content.conclusion}
        `.trim();

        return NextResponse.json({ text: formattedText });

    } catch (error) {
        console.error('OpenAI Error:', error);
        return NextResponse.json({ error: 'Failed to generate text: ' + error.message }, { status: 500 });
    }
}
