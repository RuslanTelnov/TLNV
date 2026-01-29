import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSettings } from '@/lib/settings-service';

export async function POST(req) {
    try {
        const { productId, rejectionReason, productData } = await req.json();

        if (!productId || !rejectionReason) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const settings = await getSettings();
        const openaiApiKey = settings.OPENAI_API_KEY;
        const googleApiKey = process.env.GOOGLE_API_KEY;

        const systemPrompt = `
        You are an expert Kaspi Marketplace moderator assistant.
        Your goal is to help a merchant fix a rejected product.
        
        Analyze the Rejection Reason and the Product Data.
        Provide a JSON response with:
        1. "analysis": A short, clear explanation of why it was rejected (in Russian).
        2. "actions": A list of suggested fixes. Each action must have:
           - "label": Button text (e.g., "Переименовать в X", "Сменить категорию") (in Russian).
           - "type": "update_field".
           - "payload": { "field": "name" | "description" | "kaspi_category_id", "value": "New Value" }.
        
        Common Rejections & Fixes:
        - "Некорректная категория": Suggest a better category ID based on the product name/description.
        - "Некорректное описание": Suggest removing prohibited words (Instagram, phone numbers, "best quality", etc.).
        - "Некорректное название": Suggest a cleaner name (Brand + Model + Type).
        
        If you cannot determine a specific fix, suggest cleaning up the description.
        Return raw JSON.
        `;

        const userPrompt = `
        Product ID: ${productId}
        Name: ${productData.name || productData.brand}
        Description: ${productData.description}
        Current Category ID: ${productData.kaspi_category_id}
        
        Rejection Reason: ${rejectionReason}
        `;

        // 1. Try OpenAI
        if (openaiApiKey && openaiApiKey !== 'Not Set') {
            try {
                const openai = new OpenAI({ apiKey: openaiApiKey });
                const completion = await openai.chat.completions.create({
                    model: "gpt-4o",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userPrompt }
                    ],
                    response_format: { type: "json_object" },
                    temperature: 0.3,
                });
                const result = JSON.parse(completion.choices[0].message.content);
                return NextResponse.json({ ...result, provider: 'openai' });
            } catch (err) {
                console.error('OpenAI Error:', err);
                // Fallthrough to Gemini
            }
        }

        // 2. Try Gemini
        let geminiErrors = [];
        if (googleApiKey) {
            // Priority: Lite models (separate quota/unused) -> Flash -> Pro
            const modelsToTry = [
                "gemini-flash-lite-latest",
                "gemini-2.5-flash-lite",
                "gemini-1.5-flash-8b",
                "gemini-flash-latest"
            ];

            for (const modelName of modelsToTry) {
                try {
                    const genAI = new GoogleGenerativeAI(googleApiKey);

                    const config = { responseMimeType: "application/json" };

                    const model = genAI.getGenerativeModel({
                        model: modelName,
                        generationConfig: config
                    });

                    const result = await model.generateContent(`${systemPrompt}\n\n${userPrompt}`);
                    const response = result.response;
                    let text = response.text();

                    // Cleanup markdown code blocks if any
                    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

                    const json = JSON.parse(text);
                    return NextResponse.json({ ...json, provider: `gemini (${modelName})` });
                } catch (err) {
                    console.error(`Gemini Error (${modelName}):`, err.message);
                    geminiErrors.push(`${modelName}: ${err.message}`);
                    continue; // Try next model
                }
            }
        }

        return NextResponse.json({
            error: 'No AI provider configured or available',
            analysis: 'Все модели AI недоступны (Quota exceeded или 404).',
            debug: {
                openaiExpected: !!openaiApiKey,
                openaiIsSet: openaiApiKey !== 'Not Set',
                googleExpected: !!googleApiKey,
                googleStart: googleApiKey ? googleApiKey.substring(0, 5) + '...' : 'null',
                geminiErrors: geminiErrors
            },
            actions: []
        }, { status: 503 });

    } catch (error) {
        console.error('AI Suggest Error:', error);
        return NextResponse.json({
            error: error.message,
            analysis: 'Ошибка при обращении к ИИ.',
            actions: []
        }, { status: 500 });
    }
}
