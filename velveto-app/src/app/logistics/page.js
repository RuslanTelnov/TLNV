'use client';

import { useState, useEffect } from 'react';

export default function LogisticsPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Settings (Local state for live recalculation if needed)
    const [logisticsTariff, setLogisticsTariff] = useState(1500);
    const [kaspiCommission, setKaspiCommission] = useState(15);
    const [taxRate, setTaxRate] = useState(3);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/logistics');
            const json = await res.json();
            if (json.error) throw new Error(json.error);
            setData(json);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredData = data.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => b.profit - a.profit);

    return (
        <div style={{ minHeight: '100vh', background: 'var(--velveto-bg-primary)', color: 'var(--velveto-text-primary)', padding: '2rem' }}>
            <header className="logistics-header" style={{ marginBottom: '3rem', textAlign: 'center' }}>
                <h1 style={{ fontSize: '3rem', fontWeight: '200', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    Логистический <span className="title-accent" style={{ color: 'var(--velveto-accent-primary)' }}>Дашборд</span>
                </h1>
                <p style={{ color: 'var(--velveto-text-muted)' }}>Анализ прибыльности и затрат на логистику</p>
            </header>

            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                {/* Search and Filters */}
                <div className="search-container" style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', background: 'var(--velveto-bg-secondary)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--velveto-text-muted)' }}>ПОИСК ТОВАРА</label>
                        <input
                            type="text"
                            placeholder="Название или ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                        />
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '5rem', fontSize: '1.5rem', color: 'var(--velveto-accent-primary)' }}>Загрузка данных...</div>
                ) : error ? (
                    <div style={{ padding: '2rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--velveto-status-error)', borderRadius: '12px', color: 'var(--velveto-status-error)', textAlign: 'center' }}>
                        Ошибка: {error}
                    </div>
                ) : (
                    <>
                        <div className="desktop-table" style={{ overflowX: 'auto', background: 'var(--velveto-bg-secondary)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        <th style={{ padding: '1.5rem', fontWeight: 'bold', fontSize: '0.8rem', color: 'var(--velveto-text-muted)', textTransform: 'uppercase' }}>Товар</th>
                                        <th style={{ padding: '1.5rem', fontWeight: 'bold', fontSize: '0.8rem', color: 'var(--velveto-text-muted)', textTransform: 'uppercase' }}>Вес (кг)</th>
                                        <th style={{ padding: '1.5rem', fontWeight: 'bold', fontSize: '0.8rem', color: 'var(--velveto-text-muted)', textTransform: 'uppercase' }}>Закупка (₸)</th>
                                        <th style={{ padding: '1.5rem', fontWeight: 'bold', fontSize: '0.8rem', color: 'var(--velveto-text-muted)', textTransform: 'uppercase' }}>Логистика (₸)</th>
                                        <th style={{ padding: '1.5rem', fontWeight: 'bold', fontSize: '0.8rem', color: 'var(--velveto-text-muted)', textTransform: 'uppercase' }}>Прибыль (₸)</th>
                                        <th style={{ padding: '1.5rem', fontWeight: 'bold', fontSize: '0.8rem', color: 'var(--velveto-text-muted)', textTransform: 'uppercase' }}>Маржа</th>
                                        <th style={{ padding: '1.5rem', fontWeight: 'bold', fontSize: '0.8rem', color: 'var(--velveto-text-muted)', textTransform: 'uppercase' }}>Ссылка</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.map((item, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                            <td style={{ padding: '1.2rem 1.5rem' }}>
                                                <div style={{ fontWeight: '500', fontSize: '0.95rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--velveto-text-muted)' }}>ID: {item.id}</div>
                                            </td>
                                            <td style={{ padding: '1.2rem 1.5rem' }}>{item.weight.toFixed(3)}</td>
                                            <td style={{ padding: '1.2rem 1.5rem' }}>{Math.round(item.buyingPrice).toLocaleString()} ₸</td>
                                            <td style={{ padding: '1.2rem 1.5rem', color: 'var(--velveto-accent-primary)' }}>{Math.round(item.logisticsCost).toLocaleString()} ₸</td>
                                            <td style={{ padding: '1.2rem 1.5rem', fontWeight: 'bold', color: item.profit > 0 ? 'var(--velveto-status-success)' : 'var(--velveto-status-error)' }}>
                                                {Math.round(item.profit).toLocaleString()} ₸
                                            </td>
                                            <td style={{ padding: '1.2rem 1.5rem' }}>
                                                <span style={{ padding: '4px 8px', borderRadius: '4px', background: item.margin > 20 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)', color: item.margin > 20 ? 'var(--velveto-status-success)' : 'inherit' }}>
                                                    {item.margin.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td style={{ padding: '1.2rem 1.5rem' }}>
                                                <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--velveto-accent-primary)', textDecoration: 'none', fontSize: '0.85rem' }}>ОТКРЫТЬ →</a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="mobile-only" style={{ display: 'none' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                                {filteredData.map((item, idx) => (
                                    <div key={idx} style={{ background: 'var(--velveto-bg-secondary)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>{item.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--velveto-text-muted)', marginBottom: '1rem' }}>ID: {item.id}</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
                                            <div>
                                                <div style={{ color: 'var(--velveto-text-muted)', fontSize: '0.7rem' }}>ЛОГИСТИКА</div>
                                                <div style={{ color: 'var(--velveto-accent-primary)' }}>{Math.round(item.logisticsCost).toLocaleString()} ₸</div>
                                            </div>
                                            <div>
                                                <div style={{ color: 'var(--velveto-text-muted)', fontSize: '0.7rem' }}>МАРЖА</div>
                                                <div style={{ color: item.margin > 20 ? 'var(--velveto-status-success)' : 'inherit' }}>{item.margin.toFixed(1)}%</div>
                                            </div>
                                            <div style={{ gridColumn: 'span 2' }}>
                                                <div style={{ color: 'var(--velveto-text-muted)', fontSize: '0.7rem' }}>ПРИБЫЛЬ</div>
                                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: item.profit > 0 ? 'var(--velveto-status-success)' : 'var(--velveto-status-error)' }}>
                                                    {Math.round(item.profit).toLocaleString()} ₸
                                                </div>
                                            </div>
                                        </div>
                                        <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginTop: '1rem', textAlign: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', color: 'var(--velveto-accent-primary)', textDecoration: 'none', fontSize: '0.85rem' }}>ОТКРЫТЬ НА WB</a>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {filteredData.length === 0 && (
                            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--velveto-text-muted)' }}>Товары не найдены</div>
                        )}
                    </>
                )}
            </div>
            <style jsx>{`
                @media (max-width: 768px) {
                    .logistics-header h1 {
                        font-size: 1.8rem !important;
                    }
                    .title-accent {
                        display: block;
                    }
                    .search-container {
                        padding: 1rem !important;
                    }
                    .desktop-table {
                        display: none !important;
                    }
                    .mobile-only {
                        display: block !important;
                    }
                }
            `}</style>
        </div>
    );
}
