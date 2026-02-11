import { NextResponse } from 'next/server';

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

const volWeights = {
    '3 мл': 0.05,
    '15 мл': 0.12,
    '30 мл': 0.18,
    '50 мл': 0.25,
    '100 мл': 0.45,
    '150 мл': 0.3
};

export async function GET() {
    const priceTiers = {
        'Standard': { '3 мл': 1500, '15 мл': 6500, '30 мл': 8500, '50 мл': 11500 },
        'Selective': { '3 мл': 2250, '15 мл': 9500, '30 мл': 12500, '50 мл': 17000 },
        'Exclusive': { '3 мл': 2400, '15 мл': 10000, '30 мл': 13500, '50 мл': 18500, '100 мл': 28500 },
        'Luxury': { '3 мл': 2700, '15 мл': 11500, '30 мл': 15000, '50 мл': 24000 }
    };

    const productMap = [
        { tier: 'Standard', names: ['Secret Orchid (V-027)', 'Bony Sweet (B-024)', 'Secret Oasis (S-072)', 'Summer Joy (S-010)', 'Gentle Breeze (G-005)', 'Cool Water (C-001)', 'Morning Dew (M-002)', 'Pure Silk (P-003)'] },
        { tier: 'Selective', names: ['White Chocolate (R-011)', 'Palitra (P-007)', 'Sarafan', 'Milanese Charm', 'Vanilla', 'Royal Iris (I-002)', 'Deep Sea (D-004)', 'Mystic Rose (R-005)', 'Urban Legend (U-001)', 'Fresh Mint (M-003)'] },
        { tier: 'Exclusive', names: ['Sunny Frangipani (M-030)', 'Tilia’s Shine (M-031)', 'Talisman (B-025)', 'Velvet Touch (V-012)', 'Golden Amber (A-008)', 'Midnight Bloom (B-006)', 'Oceanic Soul (O-002)', 'Desert Sun (S-009)'] },
        { tier: 'Luxury', names: ['Flight of Imagination (L-020)', 'Ethereal Soul (E-005)', 'Night Diamond (N-001)', 'Crystal Harmony (H-003)', 'Eternal Love (L-007)'] }
    ];

    const individualPrices = [];

    productMap.forEach(group => {
        const tierPrices = priceTiers[group.tier];
        group.names.forEach(name => {
            const volumeData = {};
            Object.entries(tierPrices).forEach(([vol, salePrice]) => {
                const logistics = calculateOzonDelivery(salePrice, volWeights[vol] || 0.2);
                volumeData[vol] = {
                    price: salePrice,
                    logistics
                };
            });
            individualPrices.push({
                name,
                tier: group.tier,
                volumes: volumeData
            });
        });
    });

    const productsOthers = [
        { name: 'Детский парфюм (50 мл)', price: 3100, examples: 'Лунная дорожка, Мармелад, Кокос', vol: '50 мл' },
        { name: 'Боди-мист (150 мл)', price: 7000, examples: 'Ailes D’ange, Candy Bloom, Cloud', vol: '150 мл' },
        { name: 'Сыворотка STOP инъекция (30 мл)', price: 8900, vol: '30 мл' },
        { name: 'Гель-сыворотка для век (15 мл)', price: 5900, vol: '15 мл' },
        { name: 'Парфюмированная соль (500 г)', price: 2900, vol: '50 мл' }
    ];

    const others = productsOthers.map(item => {
        const salePrice = item.price;
        const logistics = calculateOzonDelivery(salePrice, volWeights[item.vol] || 0.2);
        return {
            ...item,
            logistics
        };
    });

    return NextResponse.json({ prices: individualPrices, others });
}
