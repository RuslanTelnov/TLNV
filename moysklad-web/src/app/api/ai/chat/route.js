import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req) {
    try {
        const { message } = await req.json();

        // Read keys inside the handler to ensure the latest environment values are used
        const googleApiKey = process.env.GOOGLE_API_KEY;
        const openaiApiKey = process.env.OPENAI_API_KEY;

        // System Prompt for Context
        const systemContext = `
        Ты - умный AI-помощник VELVETO TECH. Твоя задача - помогать пользователю управлять системой автоматизации e-commerce (Kaspi + WB + MoySklad).
        
        🧠 **Твои знания о системе:**
        
        1. **Парсер WB (Deep Search)**:
           - Работает в фоне ("Конвейер").
           - Сканирует **до 100 страниц** категории "Хиты" Wildberries.
           - Автоматически пропускает дубликаты.
        
        2. **Конвейер (Automator)**:
           - **Мгновенное создание**: Как только товар найден, он создается в МойСклад.
           - **Авто-Оприходование**: Сразу ставит на остаток 10 шт.
           - **Kaspi Карточка**: Автоматически создает/обновляет карточку товара в Kaspi Магазине.
            
        3. **Ценообразование (Smart Pricing)**:
           - **Розничная цена** = Цена WB + 45% (устанавливается как "Цена продажи").
           - **Минимальная цена** = Цена WB + 30% (для контроля маржи).
        
        4. **Интерфейс**:
           - 📦 (Cube): Товар создан в МойСклад.
           - 🏭 (Factory): Оприходование выполнено.
           - 💳 (Card): Карточка в Kaspi готова.
           - "Наличие": Зеленый = есть на складе.
        
        🛠 **Твои инструкции:**
        - Отвечай как профессиональный ассистент технической поддержки.
        - Используй форматирование (жирный текст, списки) для удобства чтения.
        - Если спрашивают "какая наценка?", отвечай про +45% и +30%.
        `;

        if (googleApiKey) {
            try {
                // Testing showed that "models/gemini-flash-lite-latest" is the most reliable for this key
                const modelName = "models/gemini-flash-lite-latest";
                console.log(`Attempting Gemini (${modelName})...`);

                const genAI = new GoogleGenerativeAI(googleApiKey);
                const model = genAI.getGenerativeModel({ model: modelName });

                const fullPrompt = `${systemContext}\n\nUser Question: ${message}`;
                const result = await model.generateContent(fullPrompt);
                const response = await result.response;
                const text = response.text();

                if (text) {
                    console.log("Gemini Success");
                    return NextResponse.json({ reply: text, provider: 'gemini' });
                }
            } catch (googleError) {
                console.error('Gemini Primary Error:', googleError.message);

                // Fallback attempt with another confirmed ID from the list
                try {
                    const fallbackModelName = "models/gemini-pro-latest";
                    console.log(`Falling back to ${fallbackModelName}...`);
                    const genAI = new GoogleGenerativeAI(googleApiKey);
                    const fallbackModel = genAI.getGenerativeModel({ model: fallbackModelName });
                    const fullPrompt = `${systemContext}\n\nUser: ${message}`;
                    const result = await fallbackModel.generateContent(fullPrompt);
                    const response = await result.response;
                    return NextResponse.json({ reply: response.text(), provider: 'gemini-pro' });
                } catch (e2) {
                    console.error('Gemini Fallback Error:', e2.message);
                }
            }
        }

        // 2. TRY OPENAI (Secondary)
        if (openaiApiKey) {
            try {
                console.log("Using OpenAI...");
                const openai = new OpenAI({ apiKey: openaiApiKey });
                const completion = await openai.chat.completions.create({
                    messages: [
                        { role: "system", content: systemContext },
                        { role: "user", content: message }
                    ],
                    model: "gpt-4o",
                });
                return NextResponse.json({ reply: completion.choices[0].message.content, provider: 'openai' });
            } catch (openaiError) {
                console.error('OpenAI Error:', openaiError.message);
            }
        }

        // 3. FALLBACK (Mock) if everything else fails/is missing
        const msg = message.toLowerCase();
        let reply = "🤖 **Ассистент VELVETO** (Режим ожидания)\n\n";

        if (!googleApiKey && !openaiApiKey) {
            reply += "⚠️ **Внимание**: Ключи AI (Gemini или OpenAI) не найдены в настройках сервера (.env.local).\n\n";
        } else {
            reply += "⚠️ **Внимание**: AI ключи найдены, но возникла ошибка при подключении к серверам Google/OpenAI.\n\n";
        }

        reply += "Пока я могу отвечать только на базовые команды:\n";

        if (msg.includes('статус') || msg.includes('status')) {
            reply += "✅ **Статус**: Система работает штатно. Логи конвейера доступны в верхней панели.";
        } else if (msg.includes('запустить') || msg.includes('старт') || msg.includes('start')) {
            reply += "🚀 **Запуск**: Нажмите кнопку 'ЗАПУСТИТЬ ПАРСЕР' в верхней части этого окна или кнопку 'АВТОПИЛОТ' в шапке сайта.";
        } else if (msg.includes('остановить') || msg.includes('стоп') || msg.includes('stop')) {
            reply += "🛑 **Остановка**: Нажмите кнопку 'ОСТАНОВИТЬ ПАРСЕР' в верхней части этого окна.";
        } else {
            reply += "— 'Статус': проверить состояние системы\n— 'Запустить': как включить конвейер\n— 'Остановить': как выключить конвейер\n\nВведите одну из этих команд.";
        }

        return NextResponse.json({ reply });

    } catch (error) {
        console.error('AI Processing Error:', error);
        return NextResponse.json({
            reply: `⚠️ Ошибка AI модуля: ${error.message || 'Unknown error'}. Пожалуйста, попробуйте позже.`
        });
    }
}
