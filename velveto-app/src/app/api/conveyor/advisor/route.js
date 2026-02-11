
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateText } from '@/lib/gemini';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        // 1. Read Logs (Last 50 lines)
        let logs = "";
        try {
            // Path relative to execution? Let's try absolute or relative to project root
            const logPath = path.resolve(process.cwd(), 'automation/moysklad/conveyor.log');
            if (fs.existsSync(logPath)) {
                // Read last 2KB roughly
                const buffer = Buffer.alloc(4096);
                const fd = fs.openSync(logPath, 'r');
                const stats = fs.statSync(logPath);
                const pos = Math.max(0, stats.size - 4096);
                fs.readSync(fd, buffer, 0, 4096, pos);
                fs.closeSync(fd);
                logs = buffer.toString('utf-8');
            } else {
                logs = "Log file not found.";
            }
        } catch (e) {
            logs = "Error reading logs: " + e.message;
        }

        // 2. Fetch recent errors
        const { data: errors } = await supabase
            .from('wb_search_results')
            .select('name, conveyor_log')
            .neq('conveyor_log', null)
            .order('updated_at', { ascending: false })
            .limit(5);

        const errorText = errors ? errors.map(e => `- ${e.name}: ${e.conveyor_log}`).join('\n') : "No critical errors found in DB.";

        // 3. Construct Prompt
        const prompt = `
        Ты - умный ассистент технической поддержки для системы автоматизации E-commerce.
        Твоя задача - проанализировать логи и ошибки, и кратко (на русском языке) объяснить пользователю, как идут дела.
        
        Вот последние логи системы:
        ${logs.slice(-2000)}
        
        Вот последние ошибки из базы данных:
        ${errorText}
        
        Ответь в формате Markdown.
        1. Оцени общее "здоровье" (Отлично / Есть проблемы / Критично).
        2. Если есть ошибки, объясни их причину простыми словами (например: "Wildberries не отвечает", "Нет штрихкодов", "МойСклад отклонил запрос").
        3. Дай совет, что делать (Ждать, проверить настройки, перезапустить).
        Будь краток. Не цитируй технические логи, если не просят.
        `;

        // 4. Call AI
        const analysis = await generateText(prompt);

        return NextResponse.json({ analysis });

    } catch (e) {
        return NextResponse.json({ analysis: "System Error: " + e.message }, { status: 500 });
    }
}
