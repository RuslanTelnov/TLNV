'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

export default function OrdersPage() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('ALL') // ALL, PP1 (WB Warehouse)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true)
            try {
                const res = await fetch('/api/kaspi/orders')
                if (res.ok) {
                    const data = await res.json()
                    setOrders(data)
                }
            } catch (e) {
                console.error("Fetch orders error", e)
            } finally {
                setLoading(false)
            }
        }
        fetchOrders()
    }, [])

    const filteredOrders = orders.filter(order => {
        const matchesFilter = filter === 'ALL' || (filter === 'PP1' && order.warehouse === 'PP1')
        const matchesSearch = order.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.entries.some(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()))
        return matchesFilter && matchesSearch
    })

    const statusColors = {
        'NEW': '#3b82f6',
        'ACCEPTED_BY_MERCHANT': '#f59e0b',
        'COMPLETED': '#10b981',
        'CANCELLED': '#ef4444',
        'DELIVERY': '#8b5cf6',
        'PICKUP': '#8b5cf6',
        // MS States
        'Новый': '#3b82f6',
        'В работе': '#f59e0b',
        'Отгружен': '#10b981',
        'Отменен': '#ef4444',
        'Доставка': '#8b5cf6'
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--velveto-bg-primary)', color: 'var(--velveto-text-primary)' }}>
            {/* Nav */}
            <nav style={{ padding: '2rem 3rem', display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <Link href="/" style={{ color: 'var(--velveto-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.8rem' }}>
                    ← Back to Dashboard
                </Link>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--velveto-text-muted)' }}>KASPI ORDERS MODULE</div>
                </div>
            </nav>

            <main className="container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '1rem 3rem' }}>
                <header style={{ marginBottom: '4rem' }}>
                    <h1 style={{ fontSize: '3rem', fontWeight: '200', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>
                        Заказы <span style={{ color: 'var(--velveto-accent-primary)' }}>Kaspi</span>
                    </h1>
                    <p style={{ color: 'var(--velveto-text-secondary)', maxWidth: '600px', lineHeight: '1.6' }}>
                        Мониторинг заказов. Фильтр "WB Warehouse" показывает только товары, отправляемые с нашего склада.
                    </p>
                </header>

                {/* Filters */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px' }}>
                        <button
                            onClick={() => setFilter('ALL')}
                            style={{
                                padding: '0.6rem 1.2rem', borderRadius: '6px', border: 'none',
                                background: filter === 'ALL' ? 'var(--velveto-accent-primary)' : 'transparent',
                                color: 'white', cursor: 'pointer', transition: 'all 0.2s'
                            }}
                        >
                            Все заказы
                        </button>
                        <button
                            onClick={() => setFilter('PP1')}
                            style={{
                                padding: '0.6rem 1.2rem', borderRadius: '6px', border: 'none',
                                background: filter === 'PP1' ? 'var(--velveto-accent-primary)' : 'transparent',
                                color: 'white', cursor: 'pointer', transition: 'all 0.2s'
                            }}
                        >
                            📦 Склад ВБ
                        </button>
                    </div>

                    <input
                        type="text"
                        placeholder="Поиск по номеру заказа или товару..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            background: 'rgba(255,255,255,0.05)', border: '1px solid #333',
                            borderRadius: '8px', padding: '0.7rem 1.2rem', color: 'white',
                            minWidth: '300px'
                        }}
                    />

                    <div style={{ marginLeft: 'auto', fontSize: '0.9rem', color: 'var(--velveto-text-muted)' }}>
                        Показано: {filteredOrders.length}
                    </div>
                </div>

                {/* Orders List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {loading ? (
                        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--velveto-text-muted)' }}>
                            <div className="animate-pulse">Загрузка заказов из МойСклад...</div>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="velveto-card" style={{ padding: '4rem', textAlign: 'center', opacity: 0.5 }}>
                            Заказов не найдено
                        </div>
                    ) : (
                        filteredOrders.map(order => (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="velveto-card"
                                style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '120px 1fr 200px 150px', alignItems: 'center', gap: '2rem' }}
                            >
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--velveto-text-muted)', marginBottom: '0.3rem' }}>ID ЗАКАЗА</div>
                                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{order.code}</div>
                                </div>

                                <div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--velveto-text-muted)', marginBottom: '0.5rem' }}>ТОВАРЫ</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                        {order.entries.map((entry, i) => (
                                            <div key={i} style={{ fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                                                <span>{entry.quantity}x {entry.name}</span>
                                                <span style={{ color: 'var(--velveto-text-muted)', fontSize: '0.8rem' }}>{entry.sku}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--velveto-text-muted)', marginBottom: '0.3rem' }}>ИНФО</div>
                                    <div style={{ fontSize: '0.9rem' }}>{order.customer_name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--velveto-text-muted)' }}>
                                        {new Date(order.creation_date).toLocaleString()}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: order.warehouse === 'PP1' ? '#10b981' : '#f59e0b', fontWeight: 'bold', marginTop: '0.2rem' }}>
                                        {order.warehouse === 'PP1' ? '📍 Склад ВБ' : '🏢 Другой'}
                                    </div>
                                </div>

                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--velveto-text-muted)', marginBottom: '0.3rem' }}>СТАТУС / ЦЕНА</div>
                                    <div style={{
                                        display: 'inline-block', padding: '4px 8px', borderRadius: '4px',
                                        background: statusColors[order.status] || '#333', color: 'white',
                                        fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.5rem'
                                    }}>
                                        {order.status}
                                    </div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: '200', color: 'var(--velveto-accent-primary)' }}>
                                        {order.total_price?.toLocaleString()} ₸
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </main>
        </div>
    )
}
