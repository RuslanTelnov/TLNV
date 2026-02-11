'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import BackButton from '../../components/BackButton'

export default function AnalyticsPage() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/analytics/abc-xyz')
            const json = await res.json()
            if (json.error) throw new Error(json.error)
            setData(json)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return (
        <div style={{ minHeight: '100vh', background: 'var(--velveto-bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ width: '40px', height: '40px', border: '3px solid var(--velveto-accent-primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
        </div>
    )

    if (error) return <div style={{ color: 'var(--velveto-status-error)', padding: '2rem' }}>Error: {error}</div>

    const matrix = {
        'AX': data.products.filter(p => p.abc === 'A' && p.xyz === 'X'),
        'AY': data.products.filter(p => p.abc === 'A' && p.xyz === 'Y'),
        'AZ': data.products.filter(p => p.abc === 'A' && p.xyz === 'Z'),
        'BX': data.products.filter(p => p.abc === 'B' && p.xyz === 'X'),
        'BY': data.products.filter(p => p.abc === 'B' && p.xyz === 'Y'),
        'BZ': data.products.filter(p => p.abc === 'B' && p.xyz === 'Z'),
        'CX': data.products.filter(p => p.abc === 'C' && p.xyz === 'X'),
        'CY': data.products.filter(p => p.abc === 'C' && p.xyz === 'Y'),
        'CZ': data.products.filter(p => p.abc === 'C' && p.xyz === 'Z'),
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--velveto-bg-primary)', color: 'var(--velveto-text-primary)' }}>
            <nav style={{ padding: '2rem 3rem', display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <BackButton />
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--velveto-text-muted)' }}>BI ANALYTICS MODULE</div>
                </div>
            </nav>

            <main className="container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '1rem 3rem' }}>
                <header style={{ marginBottom: '4rem' }}>
                    <h1 style={{ fontSize: '3rem', fontWeight: '200', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>
                        ABC / XYZ <span style={{ color: 'var(--velveto-accent-primary)' }}>Анализ</span>
                    </h1>
                    <p style={{ color: 'var(--velveto-text-secondary)', maxWidth: '600px', lineHeight: '1.6' }}>
                        Классификация товаров по вкладу в выручку (ABC) и стабильности продаж (XYZ).
                    </p>
                </header>

                {/* Summary Cards */}
                <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
                    <StatCard label="Общая выручка" value={`${Math.round(data.summary.totalRevenue).toLocaleString()} ₸`} accent="var(--velveto-accent-primary)" />
                    <StatCard label="Заказов проанализировано" value={data.summary.totalOrders} />
                    <StatCard label="Активных SKU" value={data.summary.totalProducts} />
                </div>

                {/* Matrix Header */}
                <h2 style={{ fontSize: '1.5rem', fontWeight: '300', marginBottom: '2rem', letterSpacing: '0.1em' }}>МАТРИЦА СТРАТЕГИЙ</h2>

                <div className="matrix-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '4rem' }}>
                    <MatrixCell title="AX: Лидеры" count={matrix.AX.length} color="var(--velveto-status-success)" description="Максимум прибыли, стабильный спрос. Обеспечить постоянный сток." />
                    <MatrixCell title="AY: Потенциал" count={matrix.AY.length} color="#a7f3d0" description="Высокая прибыль, но переменчивый спрос. Анализировать сезонность." />
                    <MatrixCell title="AZ: Риски" count={matrix.AZ.length} color="#6ee7b7" description="Высокая прибыль, редкий спрос. Держать страховой запас." />

                    <MatrixCell title="BX: Стабильные" count={matrix.BX.length} color="#d1d5db" description="Средняя прибыль, стабильность. Оптимизировать закупки." />
                    <MatrixCell title="BY: Непостоянные" count={matrix.BY.length} color="#9ca3af" description="Средняя прибыль, нестабильный спрос." />
                    <MatrixCell title="BZ: Случайные" count={matrix.BZ.length} color="#6b7280" description="Средняя прибыль, редкие продажи." />

                    <MatrixCell title="CX: Масс-маркет" count={matrix.CX.length} color="rgba(255,255,255,0.2)" description="Мало прибыли, но высокий оборот. Автоматизировать пополнение." />
                    <MatrixCell title="CY: Аутсайдеры" count={matrix.CY.length} color="rgba(255,255,255,0.1)" description="Мало прибыли, нестабильно." />
                    <MatrixCell title="CZ: Неликвид" count={matrix.CZ.length} color="var(--velveto-status-error)" description="Минимум прибыли, редкий спрос. Вывести из ассортимента или распродать." />
                </div>

                {/* Table */}
                <div className="table-container" style={{ background: 'var(--velveto-bg-secondary)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <th style={{ padding: '1.5rem', color: 'var(--velveto-text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Товар</th>
                                <th style={{ padding: '1.5rem', color: 'var(--velveto-text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Артикул</th>
                                <th style={{ padding: '1.5rem', color: 'var(--velveto-text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Выручка</th>
                                <th style={{ padding: '1.5rem', color: 'var(--velveto-text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Кол-во</th>
                                <th style={{ padding: '1.5rem', color: 'var(--velveto-text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Класс</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.products.map((p, idx) => (
                                <tr key={p.sku} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                    <td style={{ padding: '1.2rem 1.5rem' }}>{p.name}</td>
                                    <td style={{ padding: '1.2rem 1.5rem', color: 'var(--velveto-text-muted)', fontSize: '0.85rem' }}>{p.sku}</td>
                                    <td style={{ padding: '1.2rem 1.5rem', fontWeight: 'bold' }}>{Math.round(p.revenue).toLocaleString()} ₸</td>
                                    <td style={{ padding: '1.2rem 1.5rem' }}>{p.quantity} шт</td>
                                    <td style={{ padding: '1.2rem 1.5rem' }}>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <Badge type="abc" value={p.abc} />
                                            <Badge type="xyz" value={p.xyz} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
            <style jsx>{`
                @media (max-width: 768px) {
                    nav { padding: 1rem !important; }
                    main { padding: 2rem 1rem !important; }
                    h1 { font-size: 2rem !important; }
                    .matrix-grid { grid-template-columns: 1fr !important; }
                    .stat-grid { grid-template-columns: 1fr !important; }
                    .table-container { 
                        overflow-x: auto !important;
                        border-radius: 12px !important;
                    }
                    table { min-width: 600px; }
                }
            `}</style>
        </div>
    )
}

function StatCard({ label, value, accent }) {
    return (
        <div style={{ background: 'var(--velveto-bg-secondary)', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--velveto-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.1em' }}>{label}</div>
            <div style={{ fontSize: '2rem', fontWeight: '300', color: accent || 'white' }}>{value}</div>
        </div>
    )
}

function MatrixCell({ title, count, color, description }) {
    return (
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', transition: 'transform 0.3s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontWeight: '600', color: color }}>{title}</span>
                <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.8rem' }}>{count}</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--velveto-text-muted)', lineHeight: '1.4' }}>{description}</p>
        </div>
    )
}

function Badge({ type, value }) {
    const colors = {
        'A': '#10b981', 'B': '#f59e0b', 'C': '#ef4444',
        'X': '#6366f1', 'Y': '#8b5cf6', 'Z': '#d1d5db'
    }
    return (
        <span style={{
            background: colors[value] || 'gray',
            color: 'white',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '0.7rem',
            fontWeight: 'bold',
            minWidth: '20px',
            textAlign: 'center'
        }}>
            {value}
        </span>
    )
}
