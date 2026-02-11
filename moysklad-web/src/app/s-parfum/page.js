'use client';

import { useState, useEffect, useMemo } from 'react';

export default function SParfumPricesPage() {
    const [rawData, setRawData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // User adjustable coefficients
    const [commissionPct, setCommissionPct] = useState(13);
    const [taxPct, setTaxPct] = useState(3);

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

                    volumeData[vol] = {
                        ...base,
                        commission: Math.round(commission),
                        tax: Math.round(tax),
                        totalFees: Math.round(totalFees),
                        netRemainder: Math.round(netRemainder),
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

                return {
                    ...item,
                    commission: Math.round(commission),
                    tax: Math.round(tax),
                    totalFees: Math.round(totalFees),
                    netRemainder: Math.round(netRemainder),
                    margin: Math.round((netRemainder / item.price) * 100)
                };
            });

        return { prices: filteredPrices, others: filteredOthers };
    }, [rawData, commissionPct, taxPct, searchQuery]);

    if (loading) return (
        <div style={{ minHeight: '100vh', background: '#050814', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ fontSize: '1.2rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Подготовка детального каталога...</div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#050814', color: '#fff', padding: '3rem' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

                {/* Dashboard Controls */}
                <div style={{
                    position: 'sticky',
                    top: '1rem',
                    zIndex: 1000,
                    background: 'rgba(10, 15, 30, 0.9)',
                    backdropFilter: 'blur(20px)',
                    padding: '1.5rem 2rem',
                    borderRadius: '20px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem',
                    marginBottom: '3rem',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <label style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Комиссия Ozon (%)</label>
                            <input
                                type="number"
                                value={commissionPct}
                                onChange={(e) => setCommissionPct(Number(e.target.value))}
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#3b82f6', padding: '8px 12px', borderRadius: '8px', width: '70px', fontWeight: 'bold' }}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <label style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Налог (%)</label>
                            <input
                                type="number"
                                value={taxPct}
                                onChange={(e) => setTaxPct(Number(e.target.value))}
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', padding: '8px 12px', borderRadius: '8px', width: '70px', fontWeight: 'bold' }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
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
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '100', letterSpacing: '0.1em', marginBottom: '1rem' }}>
                        ДЕТАЛЬНЫЙ АНАЛИЗ <span style={{ color: '#c9a05a' }}>S-PARFUM</span> ПО ПОЗИЦИЯМ
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.4)' }}>Индивидуальный расчет выплат для каждого аромата</p>
                </header>

                <section style={{ marginBottom: '5rem' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
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
                                                        <div style={{ fontSize: '0.65rem', color: '#3b82f6' }}>
                                                            Лог: -{item.volumes[vol].logistics} ₸
                                                        </div>
                                                        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>
                                                            Сборы: -{(item.volumes[vol].commission + item.volumes[vol].tax).toLocaleString()} ₸
                                                        </div>
                                                        <div style={{
                                                            fontSize: '0.85rem',
                                                            fontWeight: 'bold',
                                                            color: '#10b981',
                                                            marginTop: '4px',
                                                            borderTop: '1px solid rgba(255,255,255,0.05)',
                                                            paddingTop: '4px'
                                                        }}>
                                                            {item.volumes[vol].netRemainder.toLocaleString()} ₸
                                                        </div>
                                                        <div style={{ fontSize: '0.6rem', opacity: 0.4 }}>
                                                            {item.volumes[vol].margin}%
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
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>Цена: {item.price.toLocaleString()} ₸</span>
                                    <span style={{ color: '#3b82f6' }}>Лог: -{item.logistics} ₸</span>
                                </div>
                                <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginBottom: '1rem' }}>
                                    Сборы: -{(item.commission + item.tax).toLocaleString()} ₸
                                </div>
                                <div style={{ textAlign: 'right', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>К ВЫПЛАТЕ</div>
                                    <div style={{ fontSize: '1.8rem', fontWeight: '100', color: '#10b981' }}>{item.netRemainder.toLocaleString()} ₸</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
