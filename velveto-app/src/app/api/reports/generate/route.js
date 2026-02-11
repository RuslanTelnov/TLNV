import { NextResponse } from 'next/server';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { supabase } from '@/lib/supabase';
import { validateApiKey } from '@/lib/api-auth';

export async function GET(request) {
    const authError = await validateApiKey(request);
    if (authError) return authError;
    try {
        // 1. Fetch Data Stats
        // We'll just fetch all rows (limit 2000?) or use count queries.
        // For accurate stats, a simple select * and in-memory count is easiest for < 5000 items.
        // Or specific count queries. Let's do a single refined query for performance if lists get huge.
        // For now: fetch all 'wb_search_results'

        const { data: products, error } = await supabase
            .from('wb_search_results')
            .select('id, ms_created, stock_added, kaspi_created, conveyor_status')
            .limit(10000);

        if (error) throw new Error(error.message);

        const total = products.length;
        const msCreated = products.filter(p => p.ms_created).length;
        const stocked = products.filter(p => p.stock_added).length;
        const kaspiCreated = products.filter(p => p.kaspi_created).length;
        const errors = products.filter(p => p.conveyor_status === 'error').length;
        const processing = products.filter(p => p.conveyor_status === 'processing').length;

        // 2. Build Word Document
        const table = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph({ text: "Показатель", bold: true })] }),
                        new TableCell({ children: [new Paragraph({ text: "Количество", bold: true })] }),
                    ],
                }),
                createRow("Всего товаров в базе", total),
                createRow("Создано в МойСклад (MC)", msCreated),
                createRow("Оприходовано (Склад)", stocked),
                createRow("Создано в Kaspi", kaspiCreated),
                createRow("Ошибки (Требуют внимания)", errors, true),
                createRow("В обработке", processing),
            ],
        });

        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        text: "Отчет по работе Конвейера VELVETO",
                        heading: HeadingLevel.HEADING_1,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 300 }
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `Дата формирования: ${new Date().toLocaleString('ru-RU')}`,
                                italics: true,
                            }),
                        ],
                        alignment: AlignmentType.RIGHT,
                        spacing: { after: 500 }
                    }),
                    table,
                    new Paragraph({
                        text: `\nСистема работает штатно.`,
                        spacing: { before: 500 }
                    })
                ],
            }],
        });

        // 3. Generate Buffer
        const buffer = await Packer.toBuffer(doc);

        // 4. Return as Download
        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="report_${new Date().toISOString().split('T')[0]}.docx"`,
                'Content-Length': buffer.length.toString(),
            },
        });

    } catch (error) {
        console.error("Report Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

function createRow(label, value, isError = false) {
    return new TableRow({
        children: [
            new TableCell({ children: [new Paragraph(label)] }),
            new TableCell({
                children: [new Paragraph({
                    text: String(value),
                    bold: true,
                    color: isError && value > 0 ? "FF0000" : "000000"
                })]
            }),
        ],
    });
}
