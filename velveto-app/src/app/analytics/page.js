'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import BackButton from '../../components/BackButton'

export default function AnalyticsPage() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Date states - default to last 30 days
    const getToday = () => new Date().toISOString().split('T')[0]
    const getThirtyDaysAgo = () => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const [fromDate, setFromDate] = useState(getThirtyDaysAgo())
    const [toDate, setToDate] = useState(getToday())

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(`/api/analytics/abc-xyz?from=${fromDate}&to=${toDate}`)
            const json = await res.json()
            if (json.error) throw new Error(json.error)
            setData(json)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const matrix = data ? {
        'AX': data.products.filter(p => p.abc === 'A' && p.xyz === 'X'),
        'AY': data.products.filter(p => p.abc === 'A' && p.xyz === 'Y'),
        'AZ': data.products.filter(p => p.abc === 'A' && p.xyz === 'Z'),
        'BX': data.products.filter(p => p.abc === 'B' && p.xyz === 'X'),
        'BY': data.products.filter(p => p.abc === 'B' && p.xyz === 'Y'),
        'BZ': data.products.filter(p => p.abc === 'B' && p.xyz === 'Z'),
        'CX': data.products.filter(p => p.abc === 'C' && p.xyz === 'X'),
        'CY': data.products.filter(p => p.abc === 'C' && p.xyz === 'Y'),
        'CZ': data.products.filter(p => p.abc === 'C' && p.xyz === 'Z'),
    } : null

    const setPreset = (days) => {
        const today = new Date().toISOString().split('T')[0]
        const pastDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        setFromDate(pastDate)
        setToDate(today)
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--velveto-bg-primary)', color: 'var(--velveto-text-primary)', fontFamily: 'Inter, sans-serif' }}>
            <nav style={{ padding: '2rem 3rem', display: 'flex', alignItems: 'center', gap: '2rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <BackButton />
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>

                    {/* Quick Presets */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginRight: '0.5rem' }}>
                        {[
                            { label: '7Д', days: 7 },
                            { label: '30Д', days: 30 },
                            { label: '90Д', days: 90 },
                            { label: 'ГОД', days: 365 }
                        ].map(preset => (
                            <button
                                key={preset.label}
                                onClick={() => setPreset(preset.days)}
                                style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    color: 'var(--velveto-text-muted)',
                                    padding: '6px 10px',
                                    borderRadius: '8px',
                                    fontSize: '0.65rem',
                                    fontWeight: '900',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.08)'; e.target.style.color = 'white'; }}
                                onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.03)'; e.target.style.color = 'var(--velveto-text-muted)'; }}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--velveto-text-muted)', textTransform: 'uppercase' }}>Период:</span>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '0.85rem', outline: 'none', cursor: 'pointer', colorScheme: 'dark' }}
                        />
                        <span style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '0.85rem', outline: 'none', cursor: 'pointer', colorScheme: 'dark' }}
                        />
                        <button
                            onClick={fetchData}
                            disabled={loading}
                            style={{
                                marginLeft: '0.5rem',
                                background: 'var(--velveto-accent-primary)',
                                border: 'none',
                                color: 'white',
                                padding: '6px 14px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: '900',
                                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
                            }}
                        >
                            {loading ? '...' : 'ОБНОВИТЬ'}
                        </button>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em', fontWeight: '900' }}>BI ANALYTICS</div>
                </div>
            </nav>

            <main className="container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '3rem', position: 'relative' }}>
                {loading && (
                    <div style={{
                        position: 'fixed',
                        inset: '100px 0 0 0',
                        background: 'rgba(5, 8, 20, 0.7)',
                        backdropFilter: 'blur(10px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        flexDirection: 'column',
                        gap: '1rem'
                    }}>
                        <div style={{
                            width: '50px',
                            height: '50px',
                            border: '3px solid var(--velveto-accent-primary)',
                            borderTopColor: 'transparent',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }} />
                        <span style={{ fontSize: '0.9rem', color: 'var(--velveto-accent-primary)', fontWeight: '900', letterSpacing: '0.2em' }}>ЗАГРУЗКА ДАННЫХ...</span>
                    </div>
                )}

                <header style={{ marginBottom: '4rem' }}>
                    <h1 style={{ fontSize: '3.5rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '-0.02em', marginBottom: '1rem', lineHeight: '0.9' }}>
                        ABC / XYZ <span style={{ color: 'var(--velveto-accent-primary)' }}>Анализ</span>
                    </h1>
                    <p style={{ color: 'var(--velveto-text-secondary)', maxWidth: '600px', lineHeight: '1.6', fontSize: '1.1rem' }}>
                        Интеллектуальная классификация товаров по вкладу в прибыль и стабильности спроса для оптимизации складских запасов.
                    </p>
                </header>

                {loading && !data ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '10rem 0' }}>
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ width: '50px', height: '50px', border: '4px solid var(--velveto-accent-primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
                    </div>
                ) : error ? (
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '2rem', borderRadius: '16px', textAlign: 'center' }}>
                        <h3 style={{ margin: '0 0 1rem 0' }}>Ошибка загрузки данных</h3>
                        <p>{error}</p>
                        <button onClick={fetchData} style={{ marginTop: '1rem', background: '#ef4444', color: 'white', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '8px', cursor: 'pointer' }}>Попробовать снова</button>
                    </div>
                ) : data && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                        {/* Summary Cards */}
                        <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
                            <StatCard label="Общая выручка" value={`${Math.round(data.summary.totalRevenue).toLocaleString()} ₸`} accent="var(--velveto-accent-primary)" />
                            <StatCard label="Заказов обработано" value={data.summary.totalOrders} subvalue={data.summary.totalInMS > data.summary.totalOrders ? `из ${data.summary.totalInMS}` : null} />
                            <StatCard label="Активных SKU" value={data.summary.totalProducts} />
                        </div>

                        {/* Matrix Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>МАТРИЦА СТРАТЕГИЙ</h2>
                            <span style={{ fontSize: '0.9rem', color: 'var(--velveto-text-muted)' }}>Анализ за период: {fromDate} — {toDate}</span>
                        </div>

                        <div className="matrix-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '4rem' }}>
                            <MatrixCell title="AX: Лидеры" count={matrix.AX.length} color="var(--velveto-status-success)" description="Максимум прибыли, стабильный спрос. Обеспечить постоянный сток." />
                            <MatrixCell title="AY: Потенциал" count={matrix.AY.length} color="#a7f3d0" description="Высокая прибыль, но переменчивый спрос. Анализировать сезонность." />
                            <MatrixCell title="AZ: Риски" count={matrix.AZ.length} color="#6ee7b7" description="Высокая прибыль, редкий спрос. Держать страховой запас." />

                            <MatrixCell title="BX: Стабильные" count={matrix.BX.length} color="#d1d5db" description="Средняя прибыль, стабильность. Оптимизировать закупки." />
                            <MatrixCell title="BY: Непостоянные" count={matrix.BY.length} color="#9ca3af" description="Средняя прибыль, нестабильный спрос." />
                            <MatrixCell title="BZ: Случайные" count={matrix.BZ.length} color="#6b7280" description="Средняя прибыль, редкие продажи." />

                            <MatrixCell title="CX: Масс-маркет" count={matrix.CX.length} color="rgba(255,255,255,0.2)" description="Мало прибыли, но высокий оборот. Автоматизировать пополнение." />
                            <MatrixCell title="CY: Аутсайдеры" count={matrix.CY.length} color="rgba(255,255,255,0.1)" description="Мало прибыли, нестабильно." />
                            <MatrixCell title="CZ: Неликвид" count={matrix.CZ.length} color="var(--velveto-status-error)" description="Минимум прибыли, редкий спрос. Вывести из ассортимента." />
                        </div>

                        {/* Table */}
                        <div className="table-container" style={{ background: 'var(--velveto-bg-secondary)', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
                            <div style={{ padding: '2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '600' }}>ДЕТАЛИЗАЦИЯ ПО ТОВАРАМ</h3>
                                <div style={{ fontSize: '0.9rem', color: 'var(--velveto-text-muted)' }}>Всего позиций: {data.products.length}</div>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                                        <tr>
                                            <th style={{ padding: '1.5rem 2rem', color: 'var(--velveto-text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Товар</th>
                                            <th style={{ padding: '1.5rem 2rem', color: 'var(--velveto-text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Артикул</th>
                                            <th style={{ padding: '1.5rem 2rem', color: 'var(--velveto-text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Выручка</th>
                                            <th style={{ padding: '1.5rem 2rem', color: 'var(--velveto-text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Кол-во</th>
                                            <th style={{ padding: '1.5rem 2rem', color: 'var(--velveto-text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Класс</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.products.map((p, idx) => (
                                            <tr key={p.sku} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }} className="table-row">
                                                <td style={{ padding: '1.2rem 2rem', fontWeight: '500' }}>{p.name}</td>
                                                <td style={{ padding: '1.2rem 2rem', color: 'var(--velveto-text-muted)', fontSize: '0.85rem' }}>{p.sku}</td>
                                                <td style={{ padding: '1.2rem 2rem', fontWeight: '700', color: 'var(--velveto-accent-primary)' }}>{Math.round(p.revenue).toLocaleString()} ₸</td>
                                                <td style={{ padding: '1.2rem 2rem' }}>{p.quantity} шт</td>
                                                <td style={{ padding: '1.2rem 2rem' }}>
                                                    <div style={{ display: 'flex', gap: '6px' }}>
                                                        <Badge type="abc" value={p.abc} />
                                                        <Badge type="xyz" value={p.xyz} />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}
            </main>
            <style jsx>{`
                @media (max-width: 768px) {
                    nav { padding: 1rem !important; flex-direction: column; align-items: flex-start !important; }
                    nav > div { margin-left: 0 !important; width: 100%; margin-top: 1rem; }
                    main { padding: 2rem 1rem !important; }
                    h1 { font-size: 2.5rem !important; }
                    .matrix-grid { grid-template-columns: 1fr !important; }
                    .stat-grid { grid-template-columns: 1fr !important; }
                    .table-container { border-radius: 16px !important; }
                }
                .table-row:hover {
                    background: rgba(255,255,255,0.02);
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    )
}

function StatCard({ label, value, subvalue, accent }) {
    return (
        <div style={{ background: 'var(--velveto-bg-secondary)', padding: '2.5rem', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--velveto-text-muted)', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.2em', fontWeight: '600' }}>{label}</div>
            <div style={{ fontSize: '2.8rem', fontWeight: '800', color: accent || 'white', lineHeight: '1' }}>{value}</div>
            {subvalue && <div style={{ fontSize: '0.9rem', color: 'var(--velveto-text-muted)', marginTop: '0.5rem' }}>{subvalue}</div>}
        </div>
    )
}

function MatrixCell({ title, count, color, description }) {
    return (
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.3s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <span style={{ fontWeight: '800', color: color, fontSize: '1.1rem' }}>{title}</span>
                <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold' }}>{count}</span>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--velveto-text-secondary)', lineHeight: '1.5', margin: 0 }}>{description}</p>
        </div>
    )
}

function Badge({ type, value }) {
    const colors = {
        'A': 'var(--velveto-status-success)', 'B': '#f59e0b', 'C': '#ef4444',
        'X': '#6366f1', 'Y': '#8b5cf6', 'Z': '#6b7280'
    }
    return (
        <span style={{
            background: colors[value] || 'gray',
            color: 'white',
            padding: '4px 10px',
            borderRadius: '8px',
            fontSize: '0.75rem',
            fontWeight: '900',
            minWidth: '24px',
            textAlign: 'center',
            boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
        }}>
            {value}
        </span>
    )
}
