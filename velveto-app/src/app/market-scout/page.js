'use client';

import { useState } from 'react';

export default function MarketScoutPage() {
    const [query, setQuery] = useState('');
    const [targetImage, setTargetImage] = useState('');
    const [targetPrice, setTargetPrice] = useState('');
    const [results, setResults] = useState([]);
    const [kaspiProduct, setKaspiProduct] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [mode, setMode] = useState('default'); // 'default' or 'arbitrage'

    // Settings State
    const [showSettings, setShowSettings] = useState(false);
    const [exchangeRate, setExchangeRate] = useState(5.2);
    const [kaspiCommission, setKaspiCommission] = useState(15); // %
    const [logisticsPerKg, setLogisticsPerKg] = useState(1500); // KZT
    const [taxRate, setTaxRate] = useState(3); // %
    const [weight, setWeight] = useState(0.5); // kg (default placeholder)

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query) return;

        setLoading(true);
        setError(null);
        setResults([]);
        setKaspiProduct(null);
        setMode('default');

        // Detect if query is a Kaspi SKU (digits only, e.g., 5-9 digits)
        const isSku = /^\d{5,12}$/.test(query.trim());

        try {
            if (isSku) {
                setMode('arbitrage');
                const response = await fetch('/api/arbitrage', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sku: query.trim() }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Arbitrage search failed');
                }

                setKaspiProduct(data.kaspi);
                setResults(data.wb || []);
            } else {
                // Default MS Search
                const response = await fetch('/api/scout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        msName: query,
                        title: query,
                        price: parseFloat(targetPrice) || 0,
                        imageUrl: targetImage,
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Search failed');
                }

                setResults(data.results || []);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--velveto-bg-primary)' }}>
            {/* Header */}
            <header style={{
                padding: '1.5rem 3rem',
                position: 'sticky',
                top: 0,
                zIndex: 100,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backdropFilter: 'blur(20px)',
                background: 'rgba(5, 8, 20, 0.8)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <a href="/" style={{ textDecoration: 'none' }}>
                            <h1 style={{
                                fontSize: '1.8rem',
                                fontWeight: '300',
                                letterSpacing: '0.18em',
                                color: 'var(--velveto-text-primary)',
                                cursor: 'pointer',
                                textTransform: 'uppercase',
                                margin: 0
                            }}>
                                VELVETO
                            </h1>
                        </a>
                        <span style={{
                            color: 'var(--velveto-accent-primary)',
                            fontSize: '0.7rem',
                            letterSpacing: '0.2em',
                            textTransform: 'uppercase',
                            border: '1px solid var(--velveto-accent-primary)',
                            padding: '4px 8px',
                            borderRadius: '4px'
                        }}>
                            TECH
                        </span>
                    </div>

                    {/* Navigation Tabs */}
                    <nav style={{ display: 'flex', gap: '2rem' }}>
                        <a href="/" style={{
                            color: 'var(--velveto-text-muted)',
                            fontSize: '0.9rem',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            textDecoration: 'none',
                            transition: 'color 0.3s'
                        }}>
                            Главная
                        </a>
                        <a href="/ms-products" style={{
                            color: 'var(--velveto-text-muted)',
                            fontSize: '0.9rem',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            textDecoration: 'none',
                            transition: 'color 0.3s'
                        }}>
                            Номенклатуры
                        </a>
                        <a href="/market-scout" style={{
                            color: 'var(--velveto-accent-primary)',
                            fontSize: '0.9rem',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            fontWeight: '600',
                            textShadow: '0 0 10px rgba(255, 179, 90, 0.4)',
                            textDecoration: 'none'
                        }}>
                            Market Scout
                        </a>
                    </nav>
                </div>
                <div style={{
                    color: 'var(--velveto-text-secondary)',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    letterSpacing: '0.05em'
                }}>
                    ADMIN PANEL
                </div>
            </header>

            <main className="container" style={{ padding: '4rem 2rem', maxWidth: '1400px', margin: '0 auto' }}>
                <div style={{ marginBottom: '4rem', textAlign: 'center' }}>
                    <h1 style={{
                        fontSize: '3.5rem',
                        marginBottom: '1rem',
                        color: 'var(--velveto-text-primary)',
                        fontWeight: '200',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase'
                    }}>
                        Market <span style={{ color: 'var(--velveto-accent-primary)' }}>Scout</span>
                    </h1>
                    <p style={{ color: 'var(--velveto-text-muted)', fontSize: '1.1rem' }}>
                        Поиск по названию (МойСклад) или <span style={{ color: 'var(--velveto-accent-primary)' }}>Kaspi Артикулу</span>
                    </p>
                </div>

                <form onSubmit={handleSearch} style={{
                    maxWidth: '800px',
                    margin: '0 auto 4rem',
                    background: 'var(--velveto-bg-secondary)',
                    padding: '2rem',
                    borderRadius: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--velveto-text-secondary)', fontSize: '0.9rem' }}>
                            Поисковый запрос
                        </label>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Название товара или Артикул Kaspi (только цифры)"
                            required
                            style={{
                                width: '100%',
                                padding: '1rem 1.5rem',
                                borderRadius: '12px',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                background: 'rgba(255, 255, 255, 0.03)',
                                color: 'var(--velveto-text-primary)',
                                fontSize: '1rem',
                                outline: 'none',
                                transition: 'all 0.3s',
                                fontFamily: 'var(--velveto-font-ui)'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = 'var(--velveto-accent-primary)';
                                e.target.style.boxShadow = '0 0 15px rgba(255, 179, 90, 0.1)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>

                    {!/^\d+$/.test(query) && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--velveto-text-secondary)', fontSize: '0.9rem' }}>
                                    Целевая цена (Опционально)
                                </label>
                                <input
                                    type="number"
                                    value={targetPrice}
                                    onChange={(e) => setTargetPrice(e.target.value)}
                                    placeholder="Например: 5000"
                                    style={{
                                        width: '100%',
                                        padding: '1rem 1.5rem',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        color: 'var(--velveto-text-primary)',
                                        fontSize: '1rem',
                                        outline: 'none',
                                        transition: 'all 0.3s',
                                        fontFamily: 'var(--velveto-font-ui)'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--velveto-text-secondary)', fontSize: '0.9rem' }}>
                                    URL изображения (Опционально)
                                </label>
                                <input
                                    type="text"
                                    value={targetImage}
                                    onChange={(e) => setTargetImage(e.target.value)}
                                    placeholder="http://..."
                                    style={{
                                        width: '100%',
                                        padding: '1rem 1.5rem',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        color: 'var(--velveto-text-primary)',
                                        fontSize: '1rem',
                                        outline: 'none',
                                        transition: 'all 0.3s',
                                        fontFamily: 'var(--velveto-font-ui)'
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="velveto-button"
                        style={{
                            width: '100%',
                            padding: '1rem',
                            fontSize: '1.1rem',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        {loading ? 'Поиск...' : 'Найти товары'}
                    </button>
                </form>

                {error && (
                    <div style={{
                        maxWidth: '800px',
                        margin: '0 auto 2rem',
                        padding: '1rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid var(--velveto-status-error)',
                        borderRadius: '12px',
                        color: 'var(--velveto-status-error)',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                {loading && (
                    <div style={{ textAlign: 'center', color: 'var(--velveto-text-muted)', fontSize: '1.2rem' }}>
                        Поиск на маркетплейсах... Это может занять 20-30 секунд.
                    </div>
                )}

                {/* SETTINGS TOGGLE */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        style={{
                            background: 'transparent',
                            border: '1px solid var(--velveto-text-muted)',
                            color: 'var(--velveto-text-muted)',
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                        }}
                    >
                        {showSettings ? 'Скрыть настройки' : 'Настройки расчета'}
                    </button>
                </div>

                {/* SETTINGS PANEL */}
                {showSettings && (
                    <div style={{
                        maxWidth: '800px',
                        margin: '0 auto 3rem',
                        padding: '1.5rem',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: '1.5rem'
                    }}>
                        <div>
                            <label style={{ display: 'block', color: 'var(--velveto-text-secondary)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Курс RUB/KZT</label>
                            <input type="number" step="0.1" value={exchangeRate} onChange={e => setExchangeRate(parseFloat(e.target.value))} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', color: 'var(--velveto-text-secondary)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Комиссия Kaspi (%)</label>
                            <input type="number" step="1" value={kaspiCommission} onChange={e => setKaspiCommission(parseFloat(e.target.value))} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', color: 'var(--velveto-text-secondary)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Логистика (KZT/кг)</label>
                            <input type="number" step="100" value={logisticsPerKg} onChange={e => setLogisticsPerKg(parseFloat(e.target.value))} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', color: 'var(--velveto-text-secondary)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Налог (%)</label>
                            <input type="number" step="0.5" value={taxRate} onChange={e => setTaxRate(parseFloat(e.target.value))} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', color: 'var(--velveto-text-secondary)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Вес товара (кг)</label>
                            <input type="number" step="0.1" value={weight} onChange={e => setWeight(parseFloat(e.target.value))} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                        </div>
                    </div>
                )}

                {/* ARBITRAGE MODE UI */}
                {mode === 'arbitrage' && kaspiProduct && (
                    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

                        {/* DETAILED CALCULATION BLOCK */}
                        {results.length > 0 && (
                            (() => {
                                const bestWb = results[0];

                                // Calculation Logic
                                const wbPriceRub = bestWb.price;
                                const costPriceKzt = (wbPriceRub * exchangeRate) + (weight * logisticsPerKg);
                                const sellingPriceKzt = kaspiProduct.price;

                                const commissionAmount = sellingPriceKzt * (kaspiCommission / 100);
                                const taxAmount = sellingPriceKzt * (taxRate / 100);
                                const totalFees = commissionAmount + taxAmount;

                                const netProfit = sellingPriceKzt - costPriceKzt - totalFees;
                                const marginPercent = (netProfit / sellingPriceKzt) * 100;
                                const isProfitable = netProfit > 0;

                                return (
                                    <div style={{
                                        background: 'var(--velveto-bg-secondary)',
                                        borderRadius: '24px',
                                        padding: '2rem',
                                        marginBottom: '3rem',
                                        border: `1px solid ${isProfitable ? 'var(--velveto-status-success)' : 'var(--velveto-status-error)'}`,
                                        boxShadow: isProfitable ? '0 10px 40px rgba(16, 185, 129, 0.1)' : '0 10px 40px rgba(239, 68, 68, 0.1)'
                                    }}>
                                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                            <h2 style={{
                                                fontSize: '2rem',
                                                fontWeight: 'bold',
                                                color: isProfitable ? 'var(--velveto-status-success)' : 'var(--velveto-status-error)',
                                                marginBottom: '0.5rem'
                                            }}>
                                                {isProfitable ? 'АРБИТРАЖ ВЫГОДЕН!' : 'АРБИТРАЖ НЕВЫГОДЕН'}
                                            </h2>
                                            <div style={{ fontSize: '1.2rem', color: 'var(--velveto-text-primary)' }}>
                                                Чистая прибыль: <span style={{ fontWeight: 'bold', fontSize: '1.5rem' }}>{Math.round(netProfit).toLocaleString()} ₸</span>
                                                <span style={{ marginLeft: '1rem', opacity: 0.7 }}>({marginPercent.toFixed(1)}%)</span>
                                            </div>
                                        </div>

                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                            gap: '2rem',
                                            borderTop: '1px solid rgba(255,255,255,0.1)',
                                            paddingTop: '2rem'
                                        }}>
                                            {/* Cost Breakdown */}
                                            <div>
                                                <h4 style={{ color: 'var(--velveto-text-muted)', marginBottom: '1rem', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.1em' }}>Себестоимость</h4>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                    <span>Цена WB ({wbPriceRub} ₽)</span>
                                                    <span>{Math.round(wbPriceRub * exchangeRate).toLocaleString()} ₸</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                    <span>Логистика ({weight} кг)</span>
                                                    <span>{Math.round(weight * logisticsPerKg).toLocaleString()} ₸</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem', fontWeight: 'bold' }}>
                                                    <span>Итого себестоимость</span>
                                                    <span>{Math.round(costPriceKzt).toLocaleString()} ₸</span>
                                                </div>
                                            </div>

                                            {/* Fees Breakdown */}
                                            <div>
                                                <h4 style={{ color: 'var(--velveto-text-muted)', marginBottom: '1rem', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.1em' }}>Комиссии и Налоги</h4>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                    <span>Комиссия Kaspi ({kaspiCommission}%)</span>
                                                    <span>{Math.round(commissionAmount).toLocaleString()} ₸</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                    <span>Налог ({taxRate}%)</span>
                                                    <span>{Math.round(taxAmount).toLocaleString()} ₸</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem', fontWeight: 'bold' }}>
                                                    <span>Итого расходы</span>
                                                    <span>{Math.round(totalFees).toLocaleString()} ₸</span>
                                                </div>
                                            </div>

                                            {/* Final Result */}
                                            <div>
                                                <h4 style={{ color: 'var(--velveto-text-muted)', marginBottom: '1rem', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.1em' }}>Результат</h4>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                    <span>Цена продажи</span>
                                                    <span style={{ fontWeight: 'bold' }}>{sellingPriceKzt.toLocaleString()} ₸</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--velveto-status-error)' }}>
                                                    <span>- Себестоимость</span>
                                                    <span>{Math.round(costPriceKzt).toLocaleString()} ₸</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--velveto-status-error)' }}>
                                                    <span>- Расходы</span>
                                                    <span>{Math.round(totalFees).toLocaleString()} ₸</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem', fontWeight: 'bold', fontSize: '1.2rem', color: isProfitable ? 'var(--velveto-status-success)' : 'var(--velveto-status-error)' }}>
                                                    <span>Чистая прибыль</span>
                                                    <span>{Math.round(netProfit).toLocaleString()} ₸</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>

                            {/* KASPI CARD */}
                            <div className="velveto-card" style={{
                                background: 'var(--velveto-bg-secondary)',
                                borderRadius: '20px',
                                overflow: 'hidden',
                                border: '2px solid #cb11ab',
                                boxShadow: '0 10px 20px rgba(203, 17, 171, 0.15)',
                                height: '100%'
                            }}>
                                <div style={{
                                    padding: '0.75rem',
                                    background: '#cb11ab',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    textAlign: 'center',
                                    fontSize: '1rem',
                                    letterSpacing: '0.1em'
                                }}>
                                    KASPI.KZ
                                </div>
                                <div style={{ padding: '1.5rem' }}>
                                    <div style={{
                                        height: '200px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: '1.5rem',
                                        background: 'white',
                                        borderRadius: '12px',
                                        padding: '0.5rem'
                                    }}>
                                        {kaspiProduct.image_url ? (
                                            <img
                                                src={kaspiProduct.image_url}
                                                alt={kaspiProduct.title}
                                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                            />
                                        ) : (
                                            <div style={{ color: '#888', fontSize: '0.9rem' }}>Нет фото</div>
                                        )}
                                    </div>

                                    <h3 style={{
                                        fontSize: '1.1rem',
                                        marginBottom: '1rem',
                                        color: 'var(--velveto-text-primary)',
                                        lineHeight: '1.3',
                                        height: '2.6em',
                                        overflow: 'hidden'
                                    }}>
                                        {kaspiProduct.title}
                                    </h3>

                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <div style={{ color: 'var(--velveto-text-secondary)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                                            Цена продажи
                                        </div>
                                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--velveto-text-primary)' }}>
                                            {kaspiProduct.price.toLocaleString()} ₸
                                        </div>
                                    </div>

                                    <a
                                        href={kaspiProduct.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="velveto-button"
                                        style={{
                                            display: 'block',
                                            width: '100%',
                                            textAlign: 'center',
                                            padding: '0.75rem',
                                            background: '#cb11ab',
                                            color: 'white',
                                            borderRadius: '10px',
                                            textDecoration: 'none',
                                            fontWeight: '600',
                                            fontSize: '1rem'
                                        }}
                                    >
                                        Перейти в магазин
                                    </a>
                                </div>
                            </div>

                            {/* WB CARD */}
                            {results.length > 0 ? (
                                (() => {
                                    const item = results[0];
                                    const wbPriceKzt = Math.round(item.price * 5.2);

                                    return (
                                        <div className="velveto-card" style={{
                                            background: 'var(--velveto-bg-secondary)',
                                            borderRadius: '20px',
                                            overflow: 'hidden',
                                            border: '2px solid #a73afd', // WB Color (Purple-ish)
                                            boxShadow: '0 10px 20px rgba(167, 58, 253, 0.15)',
                                            height: '100%'
                                        }}>
                                            <div style={{
                                                padding: '0.75rem',
                                                background: 'linear-gradient(90deg, #cb11ab 0%, #481173 100%)',
                                                color: 'white',
                                                fontWeight: 'bold',
                                                textAlign: 'center',
                                                fontSize: '1rem',
                                                letterSpacing: '0.1em'
                                            }}>
                                                WILDBERRIES
                                            </div>
                                            <div style={{ padding: '1.5rem' }}>
                                                <div style={{
                                                    height: '200px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    marginBottom: '1.5rem',
                                                    background: 'white',
                                                    borderRadius: '12px',
                                                    padding: '0.5rem'
                                                }}>
                                                    <img
                                                        src={item.image_url}
                                                        alt={item.title}
                                                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                                    />
                                                </div>

                                                <h3 style={{
                                                    fontSize: '1.1rem',
                                                    marginBottom: '1rem',
                                                    color: 'var(--velveto-text-primary)',
                                                    lineHeight: '1.3',
                                                    height: '2.6em',
                                                    overflow: 'hidden'
                                                }}>
                                                    {item.title}
                                                </h3>

                                                <div style={{ marginBottom: '1.5rem' }}>
                                                    <div style={{ color: 'var(--velveto-text-secondary)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                                                        Цена покупки (примерно)
                                                    </div>
                                                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--velveto-accent-primary)' }}>
                                                        {wbPriceKzt.toLocaleString()} ₸
                                                    </div>
                                                    <div style={{ color: 'var(--velveto-text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                                                        ({item.price} ₽)
                                                    </div>
                                                </div>

                                                <a
                                                    href={item.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="velveto-button"
                                                    style={{
                                                        display: 'block',
                                                        width: '100%',
                                                        textAlign: 'center',
                                                        padding: '0.75rem',
                                                        background: 'linear-gradient(90deg, #cb11ab 0%, #481173 100%)',
                                                        color: 'white',
                                                        borderRadius: '10px',
                                                        textDecoration: 'none',
                                                        fontWeight: '600',
                                                        fontSize: '1rem'
                                                    }}
                                                >
                                                    Заказать на WB
                                                </a>
                                            </div>
                                        </div>
                                    );
                                })()
                            ) : (
                                <div style={{
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '2px dashed rgba(255,255,255,0.1)',
                                    borderRadius: '20px',
                                    color: 'var(--velveto-text-muted)',
                                    fontSize: '1rem',
                                    padding: '2rem',
                                    textAlign: 'center'
                                }}>
                                    Товары на Wildberries не найдены
                                </div>
                            )}
                        </div>

                        {/* OTHER RESULTS */}
                        {results.length > 1 && (
                            <div style={{ marginTop: '3rem' }}>
                                <h3 style={{ color: 'var(--velveto-text-muted)', marginBottom: '1.5rem', textAlign: 'center', fontSize: '1.1rem' }}>
                                    Другие варианты на Wildberries
                                </h3>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                    gap: '1.5rem'
                                }}>
                                    {results.slice(1).map((item, index) => (
                                        <div key={index} className="velveto-card" style={{
                                            background: 'var(--velveto-bg-secondary)',
                                            borderRadius: '16px',
                                            overflow: 'hidden',
                                            border: '1px solid rgba(255, 255, 255, 0.05)',
                                            opacity: 0.8
                                        }}>
                                            <div style={{ height: '150px', background: 'white', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <img src={item.image_url} alt={item.title} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                            </div>
                                            <div style={{ padding: '0.75rem' }}>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--velveto-text-primary)', marginBottom: '0.25rem', height: '2.4em', overflow: 'hidden' }}>
                                                    {item.title}
                                                </div>
                                                <div style={{ fontWeight: 'bold', color: 'var(--velveto-accent-primary)', fontSize: '1rem' }}>
                                                    {item.price} ₽
                                                </div>
                                                <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginTop: '0.5rem', color: 'var(--velveto-text-muted)', fontSize: '0.75rem' }}>
                                                    Открыть →
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* DEFAULT RESULTS (Grid) */}
                {mode === 'default' && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '2rem'
                    }}>
                        {results.map((item, index) => (
                            <div key={index} className="velveto-card" style={{
                                background: 'var(--velveto-bg-secondary)',
                                borderRadius: '24px',
                                overflow: 'hidden',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                transition: 'transform 0.3s, box-shadow 0.3s'
                            }}>
                                <div style={{
                                    height: '250px',
                                    overflow: 'hidden',
                                    position: 'relative',
                                    background: 'white'
                                }}>
                                    {item.image_url ? (
                                        <img
                                            src={item.image_url}
                                            alt={item.title}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'contain',
                                                padding: '1rem'
                                            }}
                                        />
                                    ) : (
                                        <div style={{
                                            width: '100%',
                                            height: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#555'
                                        }}>
                                            Нет фото
                                        </div>
                                    )}
                                    <div style={{
                                        position: 'absolute',
                                        top: '1rem',
                                        right: '1rem',
                                        background: item.source === 'ozon' ? '#005bff' : '#cb11ab',
                                        color: 'white',
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '20px',
                                        fontSize: '0.8rem',
                                        fontWeight: 'bold',
                                        boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                                    }}>
                                        {item.source === 'ozon' ? 'OZON' : 'WB'}
                                    </div>
                                </div>

                                <div style={{ padding: '1.5rem' }}>
                                    <div
                                        title={item.title}
                                        style={{
                                            fontSize: '1rem',
                                            fontWeight: '500',
                                            color: 'var(--velveto-text-primary)',
                                            marginBottom: '1rem',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                            height: '3rem'
                                        }}
                                    >
                                        {item.title}
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <div style={{
                                            fontSize: '1.5rem',
                                            fontWeight: '700',
                                            color: 'var(--velveto-accent-primary)'
                                        }}>
                                            {item.price} ₽
                                        </div>
                                        {item.is_best_price && (
                                            <span style={{
                                                fontSize: '0.75rem',
                                                background: 'var(--velveto-status-success)',
                                                color: 'white',
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                fontWeight: '600'
                                            }}>
                                                Best Price
                                            </span>
                                        )}
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        paddingTop: '1rem',
                                        borderTop: '1px solid rgba(255,255,255,0.1)'
                                    }}>
                                        <span style={{
                                            color: item.match_score > 0.8 ? 'var(--velveto-status-success)' : 'var(--velveto-status-warning)',
                                            fontWeight: '600',
                                            fontSize: '0.9rem'
                                        }}>
                                            Match: {(item.match_score * 100).toFixed(0)}%
                                        </span>
                                        <a
                                            href={item.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                color: 'var(--velveto-text-primary)',
                                                textDecoration: 'none',
                                                fontSize: '0.9rem',
                                                borderBottom: '1px solid var(--velveto-text-muted)',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseOver={(e) => e.target.style.color = 'var(--velveto-accent-primary)'}
                                            onMouseOut={(e) => e.target.style.color = 'var(--velveto-text-primary)'}
                                        >
                                            Открыть →
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && results.length === 0 && query && !error && (
                    <div style={{ textAlign: 'center', color: 'var(--velveto-text-muted)', marginTop: '2rem' }}>
                        Ничего не найдено.
                    </div>
                )}
            </main>
        </div>
    );
}
