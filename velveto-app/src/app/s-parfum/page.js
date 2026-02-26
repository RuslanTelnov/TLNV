'use client';

import { useState, useEffect, useMemo } from 'react';
import BackButton from '../../components/BackButton';
import * as XLSX from 'xlsx';

export default function SParfumPricesPage() {
    const [rawData, setRawData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // User adjustable coefficients
    const [commissionPct, setCommissionPct] = useState(18);
    const [taxPct, setTaxPct] = useState(3);
    const [markupPct, setMarkupPct] = useState(40);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 25;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    // Manual Calculator State
    const [calcPrice, setCalcPrice] = useState(15000);
    const [calcCost, setCalcCost] = useState(8000);
    const [calcVol, setCalcVol] = useState('30 мл');

    const manualCalc = useMemo(() => {
        const price = Number(calcPrice) || 0;
        const cost = Number(calcCost) || 0;

        // Ozon Global Unified Tariff (OMK Contract)
        // Price < 5,000 : 212 | 5,000-15,000 : 699 | > 15,000 : 750 (base)
        const logistics = price < 5000 ? 212 : price < 15000 ? 699 : 750;

        const commission = price * (commissionPct / 100);
        const tax = price * (taxPct / 100);
        const totalFees = logistics + commission + tax;
        const netRemainder = price - totalFees;
        const netProfit = netRemainder - cost;
        const netProfitPct = price > 0 ? (netProfit / price) * 100 : 0;
        const margin = price > 0 ? (netRemainder / price) * 100 : 0;

        return {
            logistics,
            commission: Math.round(commission),
            tax: Math.round(tax),
            totalFees: Math.round(totalFees),
            netRemainder: Math.round(netRemainder),
            netProfit: Math.round(netProfit),
            netProfitPct: Math.round(netProfitPct),
            margin: Math.round(margin),
            costPricePct: price > 0 ? Math.round((cost / price) * 100) : 0,
            logisticsPct: price > 0 ? Math.round((logistics / price) * 100) : 0,
            feesPct: price > 0 ? Math.round(((commission + tax) / price) * 100) : 0
        };
    }, [calcPrice, calcCost, commissionPct, taxPct]);

    useEffect(() => {
        fetch('/api/s-parfum/prices')
            .then(res => res.json())
            .then(d => {
                setRawData(d);
                setLoading(false);
            });
    }, []);

    // Recalculate and Filter everything on the fly
    const processedData = useMemo(() => {
        if (!rawData) return null;

        const filteredPrices = rawData.prices
            .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.tier.toLowerCase().includes(searchQuery.toLowerCase()))
            .map(item => {
                const volumeData = {};
                Object.entries(item.volumes).forEach(([vol, base]) => {
                    const price = base.price;
                    // Ozon Global Unified Tariff (OMK Contract)
                    const logistics = price < 5000 ? 212 : price < 15000 ? 699 : 750;

                    const commission = price * (commissionPct / 100);
                    const tax = price * (taxPct / 100);
                    const totalFees = logistics + commission + tax;
                    const netRemainder = price - totalFees;
                    const costPrice = price * (1 - markupPct / 100);
                    const netProfit = netRemainder - costPrice;
                    const netProfitPct = (netProfit / price) * 100;

                    volumeData[vol] = {
                        ...base,
                        logistics,
                        commission: Math.round(commission),
                        tax: Math.round(tax),
                        totalFees: Math.round(totalFees),
                        netRemainder: Math.round(netRemainder),
                        costPrice: Math.round(costPrice),
                        netProfit: Math.round(netProfit),
                        netProfitPct: Math.round(netProfitPct),
                        margin: Math.round((netRemainder / price) * 100),
                        costPricePct: Math.round((costPrice / price) * 100),
                        logisticsPct: Math.round((logistics / price) * 100),
                        feesPct: Math.round(((commission + tax) / price) * 100)
                    };
                });
                return { ...item, volumes: volumeData };
            });

        const filteredOthers = rawData.others
            .filter(o => o.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map(item => {
                const price = item.price;
                const logistics = price < 5000 ? 212 : price < 15000 ? 699 : 750;

                const commission = price * (commissionPct / 100);
                const tax = price * (taxPct / 100);
                const totalFees = logistics + commission + tax;
                const netRemainder = price - totalFees;
                const costPrice = price * (1 - markupPct / 100);
                const netProfit = netRemainder - costPrice;
                const netProfitPct = (netProfit / price) * 100;

                return {
                    ...item,
                    logistics,
                    commission: Math.round(commission),
                    tax: Math.round(tax),
                    totalFees: Math.round(totalFees),
                    netRemainder: Math.round(netRemainder),
                    costPrice: Math.round(costPrice),
                    netProfit: Math.round(netProfit),
                    netProfitPct: Math.round(netProfitPct),
                    margin: Math.round((netRemainder / price) * 100),
                    costPricePct: Math.round((costPrice / price) * 100),
                    logisticsPct: Math.round((logistics / price) * 100),
                    feesPct: Math.round(((commission + tax) / price) * 100)
                };
            });

        return { prices: filteredPrices, others: filteredOthers };
    }, [rawData, commissionPct, taxPct, markupPct, searchQuery]);

    const paginatedPrices = useMemo(() => {
        if (!processedData) return [];
        const startIndex = (currentPage - 1) * itemsPerPage;
        return processedData.prices.slice(startIndex, startIndex + itemsPerPage);
    }, [processedData, currentPage]);

    const totalPages = Math.ceil((processedData?.prices.length || 0) / itemsPerPage);

    const handleExportExcel = () => {
        if (!processedData) return;

        const exportData = [];

        // Main Perfumes
        processedData.prices.forEach(item => {
            Object.entries(item.volumes).forEach(([vol, data]) => {
                exportData.push({
                    'Аромат': item.name,
                    'Серия': item.tier,
                    'Артикул': item.sku || '',
                    'Объем': vol,
                    'Цена продажи': data.price,
                    'Себестоимость': data.costPrice,
                    'Логистика': data.logistics,
                    'Комиссия': data.commission,
                    'Налог': data.tax,
                    'Всего сборов': data.totalFees,
                    'К выплате': data.netRemainder,
                    'Чистая прибыль': data.netProfit,
                    '% прибыли': data.netProfitPct + '%',
                    '% к выплате': data.margin + '%'
                });
            });
        });

        // Others
        processedData.others.forEach(item => {
            exportData.push({
                'Аромат': item.name,
                'Серия': 'Другое',
                'Артикул': item.sku || '',
                'Объем': 'Стандарт',
                'Цена продажи': item.price,
                'Себестоимость': item.costPrice,
                'Логистика': item.logistics,
                'Комиссия': item.commission,
                'Налог': item.tax,
                'Всего сборов': item.totalFees,
                'К выплате': item.netRemainder,
                'Чистая прибыль': item.netProfit,
                '% прибыли': item.netProfitPct + '%',
                '% к выплате': item.margin + '%'
            });
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "S-Parfum Analysis");

        // Auto-size columns
        const wscols = [
            { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 15 },
            { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
            { wch: 12 }, { wch: 12 }
        ];
        ws['!cols'] = wscols;

        XLSX.writeFile(wb, `S-Parfum_Analysis_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    if (loading) return (
        <div style={{ minHeight: '100vh', background: '#050814', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ fontSize: '1.2rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Подготовка детального каталога...</div>
        </div>
    );

    return (
        <div className="page-container" style={{ minHeight: '100vh', background: '#050814', color: '#fff' }}>
            <style jsx global>{`
                .page-container {
                    padding: 3rem;
                }
                .controls-container {
                    padding: 1.5rem 2rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }
                .controls-row {
                    display: flex;
                    align-items: center;
                    gap: 3rem;
                }
                .header-title {
                    fontSize: 2.5rem;
                }
                
                @media (max-width: 768px) {
                    .page-container {
                        padding: 1rem;
                    }
                    .controls-container {
                        padding: 1rem;
                    }
                    .controls-row {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 1rem;
                    }
                    .header-title {
                        font-size: 1.5rem !important;
                    }
                    .mobile-stack {
                         display: flex;
                         flex-direction: column;
                         gap: 1rem;
                    }
                    th, td {
                        padding: 0.5rem !important;
                        font-size: 0.8rem;
                    }
                }
            `}</style>

            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                <div style={{ marginBottom: '1rem' }}>
                    <BackButton />
                </div>

                {/* Dashboard Controls */}
                <div className="controls-container" style={{
                    position: 'sticky',
                    top: '1rem',
                    zIndex: 1000,
                    background: 'rgba(10, 15, 30, 0.9)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '20px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    marginBottom: '3rem',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                }}>
                    <div className="controls-row">
                        <div className="mobile-stack" style={{ display: 'flex', gap: '3rem', width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between' }}>
                                <label style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Комиссия Ozon (%)</label>
                                <input
                                    type="number"
                                    value={commissionPct}
                                    onChange={(e) => setCommissionPct(Number(e.target.value))}
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#3b82f6', padding: '8px 12px', borderRadius: '8px', width: '70px', fontWeight: 'bold' }}
                                />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between' }}>
                                <label style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Налог (%)</label>
                                <input
                                    type="number"
                                    value={taxPct}
                                    onChange={(e) => setTaxPct(Number(e.target.value))}
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', padding: '8px 12px', borderRadius: '8px', width: '70px', fontWeight: 'bold' }}
                                />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between' }}>
                                <label style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Маржа (%)</label>
                                <input
                                    type="number"
                                    value={markupPct}
                                    onChange={(e) => setMarkupPct(Number(e.target.value))}
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #c9a05a88', color: '#c9a05a', padding: '8px 12px', borderRadius: '8px', width: '70px', fontWeight: 'bold' }}
                                />
                            </div>
                        </div>
                        <div style={{ flex: 1, width: '100%' }}>
                            <input
                                type="text"
                                placeholder="Поиск по названию или категории..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    padding: '12px 20px',
                                    borderRadius: '12px',
                                    color: '#fff',
                                    outline: 'none'
                                }}
                            />
                        </div>
                        <button
                            onClick={handleExportExcel}
                            style={{
                                background: 'rgba(201, 160, 90, 0.1)',
                                border: '1px solid #c9a05a',
                                color: '#c9a05a',
                                padding: '12px 24px',
                                borderRadius: '12px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(201, 160, 90, 0.2)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(201, 160, 90, 0.1)'; }}
                        >
                            <span style={{ fontSize: '1.2rem' }}>📊</span> ЭКСПОРТ В EXCEL
                        </button>
                    </div>

                    {/* Quick Online Calculator */}
                    <div style={{
                        marginTop: '2rem',
                        paddingTop: '2rem',
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem'
                    }}>
                        <div style={{ fontSize: '0.8rem', color: '#c9a05a', fontWeight: 'bold', letterSpacing: '0.1em' }}>БЫСТРЫЙ КАЛЬКУЛЯТОР</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>ЦЕНА ПРОДАЖИ (₸)</label>
                                <input
                                    type="number"
                                    value={calcPrice}
                                    onChange={(e) => setCalcPrice(e.target.value)}
                                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', color: '#fff', outline: 'none' }}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>СЕБЕСТОИМОСТЬ (₸)</label>
                                <input
                                    type="number"
                                    value={calcCost}
                                    onChange={(e) => setCalcCost(e.target.value)}
                                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', color: '#fff', outline: 'none' }}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>ОБЪЕМ / ЛИТРАЖ</label>
                                <select
                                    value={calcVol}
                                    onChange={(e) => setCalcVol(e.target.value)}
                                    style={{ background: '#0a0f1e', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', color: '#fff', outline: 'none' }}
                                >
                                    <option>3 мл</option>
                                    <option>15 мл</option>
                                    <option>30 мл</option>
                                    <option>50 мл</option>
                                    <option>100 мл</option>
                                    <option>Другое</option>
                                </select>
                            </div>
                            <div style={{ background: 'rgba(201, 160, 90, 0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(201, 160, 90, 0.1)', display: 'flex', gap: '1.5rem', gridColumn: 'span 2' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.3rem' }}>РЕЗУЛЬТАТ РАСЧЕТА</div>
                                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem' }}>
                                        <div style={{ color: 'rgba(255,255,255,0.6)' }}>Лог: <span style={{ color: '#3b82f6' }}>-{manualCalc.logistics} ₸ ({manualCalc.logisticsPct}%)</span></div>
                                        <div style={{ color: 'rgba(255,255,255,0.6)' }}>Сборы: <span style={{ color: 'rgba(255,255,255,0.4)' }}>-{manualCalc.totalFees - manualCalc.logistics} ₸ ({manualCalc.feesPct}%)</span></div>
                                        <div style={{ color: 'rgba(255,255,255,0.6)' }}>Себ: <span style={{ marginBottom: '0.2rem' }}>{Number(calcCost).toLocaleString()} ₸ ({manualCalc.costPricePct}%)</span></div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '1.5rem' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#10b981' }}>{manualCalc.netRemainder.toLocaleString()} ₸</div>
                                    <div style={{ fontSize: '0.7rem', color: '#10b981' }}>{manualCalc.netProfitPct}% ч.п. ({manualCalc.netProfit.toLocaleString()} ₸)</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <header style={{ marginBottom: '4rem', textAlign: 'center' }}>
                    <h1 className="header-title" style={{ fontWeight: '100', letterSpacing: '0.1em', marginBottom: '1rem' }}>
                        ДЕТАЛЬНЫЙ АНАЛИЗ <span style={{ color: '#c9a05a' }}>S-PARFUM</span> ПО ПОЗИЦИЯМ
                    </h1>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0 }}>Индивидуальный расчет выплат для каждого аромата</p>
                        <a
                            href="/ozon/perfume-guide"
                            style={{
                                color: '#3b82f6',
                                fontSize: '0.75rem',
                                textDecoration: 'none',
                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                padding: '4px 12px',
                                borderRadius: '100px',
                                background: 'rgba(59, 130, 246, 0.05)',
                                fontWeight: 'bold',
                                letterSpacing: '0.05em'
                            }}
                        >
                            📚 ГВИД ПО OZON КЗ
                        </a>
                    </div>
                </header>

                <section style={{ marginBottom: '5rem' }}>
                    {/* Pagination Controls Top */}
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.3 : 1 }}
                            >
                                Назад
                            </button>
                            {[...Array(totalPages)].map((_, i) => {
                                const p = i + 1;
                                // Only show current, first, last and 2 neighbors
                                if (p === 1 || p === totalPages || (p >= currentPage - 2 && p <= currentPage + 2)) {
                                    return (
                                        <button
                                            key={p}
                                            onClick={() => setCurrentPage(p)}
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '8px',
                                                border: '1px solid',
                                                borderColor: currentPage === p ? '#c9a05a' : 'rgba(255,255,255,0.1)',
                                                background: currentPage === p ? '#c9a05a' : 'rgba(255,255,255,0.05)',
                                                color: currentPage === p ? '#050814' : '#fff',
                                                fontWeight: 'bold',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {p}
                                        </button>
                                    );
                                }
                                if (p === 2 || p === totalPages - 1) {
                                    return <span key={p} style={{ color: 'rgba(255,255,255,0.3)', alignSelf: 'center' }}>...</span>;
                                }
                                return null;
                            })}
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.3 : 1 }}
                            >
                                Вперед
                            </button>
                        </div>
                    )}

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', minWidth: '800px' }}>
                            <thead>
                                <tr style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                                    <th style={{ padding: '1rem 2rem', textAlign: 'left', fontWeight: '400' }}>Аромат</th>
                                    {['3 мл', '15 мл', '30 мл', '50 мл', '100 мл'].map(vol => (
                                        <th key={vol} style={{ padding: '1rem', textAlign: 'center', fontWeight: '400' }}>{vol}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedPrices.map((item, idx) => (
                                    <tr key={idx} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', transition: 'transform 0.2s', cursor: 'default' }}>
                                        <td style={{ padding: '1.5rem 2rem', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px', borderLeft: `3px solid ${item.tier === 'Luxury' ? '#ef4444' : item.tier === 'Exclusive' ? '#8b5cf6' : item.tier === 'Selective' ? '#3b82f6' : '#c9a05a'}` }}>
                                            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                                {item.image ? (
                                                    <img src={item.image} alt={item.name} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', background: 'rgba(255,255,255,0.05)' }} />
                                                ) : (
                                                    <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>✨</div>
                                                )}
                                                <div>
                                                    <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'none' }}>
                                                        <div style={{ fontWeight: '600', fontSize: '1.1rem', marginBottom: '0.2rem', cursor: 'pointer' }}>
                                                            {item.name} <span style={{ fontSize: '0.8rem', opacity: 0.3 }}>↗</span>
                                                        </div>
                                                    </a>
                                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                        <span style={{ fontSize: '0.65rem', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>{item.tier}</span>
                                                        {item.sku && <span style={{ fontSize: '0.65rem', background: 'rgba(201, 160, 90, 0.1)', color: '#c9a05a', padding: '2px 6px', borderRadius: '4px' }}>{item.sku}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        {['3 мл', '15 мл', '30 мл', '50 мл', '100 мл'].map(vol => (
                                            <td key={vol} style={{ padding: '1rem', textAlign: 'center' }}>
                                                {item.volumes[vol] ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                                        <div style={{ fontSize: '1rem', fontWeight: '500', color: '#c9a05a' }}>{item.volumes[vol].price.toLocaleString()} ₸</div>
                                                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', fontWeight: 'bold', letterSpacing: '0.05em' }}>
                                                            Себ: {item.volumes[vol].costPrice.toLocaleString()} ₸ ({item.volumes[vol].costPricePct}%)
                                                        </div>
                                                        <div style={{ fontSize: '0.65rem', color: '#3b82f6', marginTop: '4px' }}>
                                                            Лог: -{item.volumes[vol].logistics} ₸ ({item.volumes[vol].logisticsPct}%)
                                                        </div>
                                                        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>
                                                            Сборы: -{(item.volumes[vol].commission + item.volumes[vol].tax).toLocaleString()} ₸ ({item.volumes[vol].feesPct}%)
                                                        </div>
                                                        <div style={{
                                                            fontSize: '0.85rem',
                                                            fontWeight: 'bold',
                                                            color: '#10b981',
                                                            marginTop: '6px',
                                                            borderTop: '1px solid rgba(255,255,255,0.05)',
                                                            paddingTop: '6px'
                                                        }}>
                                                            {item.volumes[vol].netRemainder.toLocaleString()} ₸
                                                        </div>
                                                        <div style={{ fontSize: '0.65rem', color: '#10b981', opacity: 0.8, fontWeight: 'bold' }}>
                                                            {item.volumes[vol].netProfitPct}% ч.п.
                                                        </div>
                                                        <div style={{ fontSize: '0.6rem', opacity: 0.4 }}>
                                                            {item.volumes[vol].margin}% выпл.
                                                        </div>
                                                    </div>
                                                ) : <span style={{ color: 'rgba(255,255,255,0.05)' }}>—</span>}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination Controls Bottom */}
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '3rem', flexWrap: 'wrap' }}>
                            <button
                                onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                disabled={currentPage === 1}
                                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.3 : 1 }}
                            >
                                Назад
                            </button>
                            <span style={{ alignSelf: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', margin: '0 1rem' }}>
                                Страница {currentPage} из {totalPages} ({processedData.prices.length} товаров)
                            </span>
                            <button
                                onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                disabled={currentPage === totalPages}
                                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.3 : 1 }}
                            >
                                Вперед
                            </button>
                        </div>
                    )}
                </section>

                <section>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: '300', marginBottom: '2rem', borderLeft: '3px solid #3b82f6', paddingLeft: '1.5rem' }}>ДРУГИЕ ТОВАРЫ</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {processedData.others.map((item, idx) => (
                            <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {item.image && (
                                    <img src={item.image} alt={item.name} style={{ width: '100%', height: '200px', borderRadius: '12px', objectFit: 'cover', background: 'rgba(255,255,255,0.03)' }} />
                                )}
                                <div>
                                    <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'none' }}>
                                        <div style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '0.3rem' }}>{item.name} <span style={{ fontSize: '0.8rem', opacity: 0.3 }}>↗</span></div>
                                    </a>
                                    {item.sku && <div style={{ fontSize: '0.7rem', color: '#c9a05a', marginBottom: '0.5rem' }}>{item.sku}</div>}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem', fontSize: '0.85rem' }}>
                                    <span style={{ color: '#c9a05a', fontWeight: 'bold' }}>Цена: {item.price.toLocaleString()} ₸</span>
                                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>Себ: {item.costPrice.toLocaleString()} ₸ ({item.costPricePct}%)</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                                    <span style={{ color: '#3b82f6' }}>Лог: -{item.logistics} ₸ ({item.logisticsPct}%)</span>
                                </div>
                                <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginBottom: '1rem' }}>
                                    Сборы: -{(item.commission + item.tax).toLocaleString()} ₸ ({item.feesPct}%)
                                </div>
                                <div style={{ textAlign: 'right', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                        <div style={{ textAlign: 'left' }}>
                                            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>ЧИСТАЯ ПРИБЫЛЬ</div>
                                            <div style={{ fontSize: '1rem', color: '#10b981', fontWeight: 'bold' }}>{item.netProfitPct}%</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>К ВЫПЛАТЕ</div>
                                            <div style={{ fontSize: '1.8rem', fontWeight: '100', color: '#10b981' }}>{item.netRemainder.toLocaleString()} ₸</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
