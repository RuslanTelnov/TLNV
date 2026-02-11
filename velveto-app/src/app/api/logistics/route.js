import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

function getWeightKg(specs) {
    if (!specs || typeof specs !== 'object') return 0.1;

    const keys = Object.keys(specs);
    for (const key of keys) {
        if (key.toLowerCase().includes('вес')) {
            const val = specs[key];
            if (!val) continue;

            const match = String(val).match(/(\d+[.,]?\d*)/);
            if (match) {
                let num = parseFloat(match[1].replace(',', '.'));
                if (key.toLowerCase().includes('кг') || String(val).toLowerCase().includes('кг')) {
                    return num;
                }
                if (key.toLowerCase().includes('г') || String(val).toLowerCase().includes('г') || num > 10) {
                    return num / 1000;
                }
                return num;
            }
        }
    }
    return 0.1;
}

function calculateOzonDelivery(price, volumeL) {
    if (price <= 5000) {
        if (volumeL <= 0.4) return 212;
        if (volumeL <= 1.0) return 246;
        if (volumeL <= 2.0) return 299;
        if (volumeL <= 5.0) return 418;
        if (volumeL <= 10.0) return 730;
        return 1335;
    } else if (price <= 15000) {
        return 699;
    } else { // price > 15000
        if (volumeL <= 1.0) return 750;
        if (volumeL <= 5.0) return 800;
        if (volumeL <= 50.0) return 1000;
        if (volumeL <= 150.0) return 1700;
        return 3050;
    }
}

export async function GET() {
    try {
        const { data, error } = await supabase
            .schema('Parser')
            .from('wb_search_results')
            .select('id, name, price_kzt, specs, product_url')
            .not('specs', 'is', null);

        if (error) throw error;

        const KASPI_COMMISSION = 0.15;
        const TAX = 0.03;

        const processed = data.map(item => {
            const weight = getWeightKg(item.specs);
            const buyingPrice = item.price_kzt || 0;
            const estimatedSellingPrice = buyingPrice * 1.5;

            const logisticsCost = calculateOzonDelivery(estimatedSellingPrice, weight);

            const commissionAmount = estimatedSellingPrice * KASPI_COMMISSION;
            const taxAmount = estimatedSellingPrice * TAX;
            const totalCost = buyingPrice + logisticsCost;

            const profit = estimatedSellingPrice - totalCost - commissionAmount - taxAmount;

            return {
                id: item.id,
                name: item.name,
                buyingPrice,
                weight,
                logisticsCost,
                totalCost,
                estimatedSellingPrice,
                profit,
                margin: (profit / estimatedSellingPrice) * 100,
                url: item.product_url
            };
        });

        return NextResponse.json(processed);
    } catch (error) {
        console.error('Logistics API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
