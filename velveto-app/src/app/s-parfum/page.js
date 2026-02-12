'use client';

import { useState, useEffect, useMemo } from 'react';
import BackButton from '../../components/BackButton';

export default function SParfumPricesPage() {
    const [rawData, setRawData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // User adjustable coefficients
    const [commissionPct, setCommissionPct] = useState(13);
    const [taxPct, setTaxPct] = useState(3);
    const [markupPct, setMarkupPct] = useState(40);

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
                    const commission = base.price * (commissionPct / 100);
                    const tax = base.price * (taxPct / 100);
                    const totalFees = base.logistics + commission + tax;
                    const netRemainder = base.price - totalFees;
                    const costPrice = base.price * (1 - markupPct / 100);
                    const netProfit = netRemainder - costPrice;
                    const netProfitPct = (netProfit / base.price) * 100;

                    volumeData[vol] = {
                        ...base,
                        commission: Math.round(commission),
                        tax: Math.round(tax),
                        totalFees: Math.round(totalFees),
                        netRemainder: Math.round(netRemainder),
                        costPrice: Math.round(costPrice),
                        netProfit: Math.round(netProfit),
                        netProfitPct: Math.round(netProfitPct),
                        margin: Math.round((netRemainder / base.price) * 100)
                    };
                });
                return { ...item, volumes: volumeData };
            });

        const filteredOthers = rawData.others
            .filter(o => o.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map(item => {
                const commission = item.price * (commissionPct / 100);
                const tax = item.price * (taxPct / 100);
                const totalFees = item.logistics + commission + tax;
                const netRemainder = item.price - totalFees;
                const costPrice = item.price * (1 - markupPct / 100);
                const netProfit = netRemainder - costPrice;
                const netProfitPct = (netProfit / item.price) * 100;

                return {
                    ...item,
                    commission: Math.round(commission),
                    tax: Math.round(tax),
                    totalFees: Math.round(totalFees),
                    netRemainder: Math.round(netRemainder),
                    costPrice: Math.round(costPrice),
                    netProfit: Math.round(netProfit),
                    netProfitPct: Math.round(netProfitPct),
                    margin: Math.round((netRemainder / item.price) * 100)
                };
            });

        return { prices: filteredPrices, others: filteredOthers };
    }, [rawData, commissionPct, taxPct, markupPct, searchQuery]);

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
                    </div>
                </div>

                <header style={{ marginBottom: '4rem', textAlign: 'center' }}>
                    <h1 className="header-title" style={{ fontWeight: '100', letterSpacing: '0.1em', marginBottom: '1rem' }}>
                        ДЕТАЛЬНЫЙ АНАЛИЗ <span style={{ color: '#c9a05a' }}>S-PARFUM</span> ПО ПОЗИЦИЯМ
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.4)' }}>Индивидуальный расчет выплат для каждого аромата</p>
                </header>

                <section style={{ marginBottom: '5rem' }}>
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
                                {processedData.prices.map((item, idx) => (
                                    <tr key={idx} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', transition: 'transform 0.2s', cursor: 'default' }}>
                                        <td style={{ padding: '1.5rem 2rem', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px', borderLeft: `3px solid ${item.tier === 'Luxury' ? '#ef4444' : item.tier === 'Exclusive' ? '#8b5cf6' : item.tier === 'Selective' ? '#3b82f6' : '#c9a05a'}` }}>
                                            <div style={{ fontWeight: '600', fontSize: '1.1rem', marginBottom: '0.3rem' }}>{item.name}</div>
                                            <div style={{ fontSize: '0.65rem', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>{item.tier}</div>
                                        </td>
                                        {['3 мл', '15 мл', '30 мл', '50 мл', '100 мл'].map(vol => (
                                            <td key={vol} style={{ padding: '1rem', textAlign: 'center' }}>
                                                {item.volumes[vol] ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                                        <div style={{ fontSize: '1rem', fontWeight: '500', color: '#c9a05a' }}>{item.volumes[vol].price.toLocaleString()} ₸</div>
                                                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', fontWeight: 'bold', letterSpacing: '0.05em' }}>
                                                            Себ: {item.volumes[vol].costPrice.toLocaleString()} ₸
                                                        </div>
                                                        <div style={{ fontSize: '0.65rem', color: '#3b82f6', marginTop: '4px' }}>
                                                            Лог: -{item.volumes[vol].logistics} ₸
                                                        </div>
                                                        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>
                                                            Сборы: -{(item.volumes[vol].commission + item.volumes[vol].tax).toLocaleString()} ₸
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
                </section>

                <section>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: '300', marginBottom: '2rem', borderLeft: '3px solid #3b82f6', paddingLeft: '1.5rem' }}>ДРУГИЕ ТОВАРЫ</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {processedData.others.map((item, idx) => (
                            <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '1rem' }}>{item.name}</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem', fontSize: '0.85rem' }}>
                                    <span style={{ color: '#c9a05a', fontWeight: 'bold' }}>Цена: {item.price.toLocaleString()} ₸</span>
                                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>Себ: {item.costPrice.toLocaleString()} ₸</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                                    <span style={{ color: '#3b82f6' }}>Лог: -{item.logistics} ₸</span>
                                </div>
                                <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginBottom: '1rem' }}>
                                    Сборы: -{(item.commission + item.tax).toLocaleString()} ₸
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
