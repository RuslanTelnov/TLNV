'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

export default function ConveyorPage() {
    const [isRunning, setIsRunning] = useState(false)
    const [logs, setLogs] = useState("")
    const [stats, setStats] = useState({ total: 0, idle: 0, done: 0, error: 0, success_rate: 0 })
    const [errors, setErrors] = useState([])
    const [loadingStats, setLoadingStats] = useState(true)
    const [selectedStatus, setSelectedStatus] = useState(null)
    const [filteredItems, setFilteredItems] = useState([])
    const [loadingItems, setLoadingItems] = useState(false)
    const logEndRef = useRef(null)

    // Poll logs & Stats
    useEffect(() => {
        const fetchAll = async () => {
            try {
                // Fetch Logs
                const resLogs = await fetch('/api/conveyor/status')
                const dataLogs = await resLogs.json()
                if (dataLogs.logs) setLogs(dataLogs.logs)
                setIsRunning(dataLogs.running)

                // Fetch Stats
                const resStats = await fetch('/api/conveyor/stats')
                const dataStats = await resStats.json()
                setStats(dataStats)
                setLoadingStats(false)

                // Fetch Errors
                const resErr = await fetch('/api/conveyor/errors')
                const dataErr = await resErr.json()
                setErrors(dataErr)
            } catch (e) {
                console.error("Fetch error", e)
            }
        }

        fetchAll()
        const interval = setInterval(fetchAll, 5000)
        return () => clearInterval(interval)
    }, [])

    // Scroll to bottom of logs
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [logs])

    // Fetch filtered items when selected status changes
    useEffect(() => {
        if (!selectedStatus) return

        const fetchItems = async () => {
            setLoadingItems(true)
            try {
                const res = await fetch(`/api/conveyor/items?status=${selectedStatus}`)
                const data = await res.json()
                setFilteredItems(data)
            } catch (e) {
                console.error("Fetch items error", e)
            } finally {
                setLoadingItems(false)
            }
        }
        fetchItems()
    }, [selectedStatus])

    const toggleConveyor = async () => {
        if (isRunning) {
            await fetch('/api/conveyor/run', { method: 'DELETE' })
            setIsRunning(false)
        } else {
            await fetch('/api/conveyor/run', { method: 'POST' })
            setIsRunning(true)
        }
    }

    const handleRetry = async (id) => {
        try {
            await fetch('/api/conveyor/force-sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            })
            // Stats will refresh on next poll
            if (selectedStatus) {
                const res = await fetch(`/api/conveyor/items?status=${selectedStatus}`)
                const data = await res.json()
                setFilteredItems(data)
            }
        } catch (e) {
            alert("Retry failed")
        }
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--velveto-bg-primary)', color: 'var(--velveto-text-primary)' }}>

            {/* Nav */}
            <nav style={{ padding: '2rem 3rem', display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <Link href="/" style={{ color: 'var(--velveto-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.8rem' }}>
                    ← Back to Dashboard
                </Link>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: isRunning ? '#10B981' : '#EF4444', boxShadow: isRunning ? '0 0 10px #10B981' : 'none' }} />
                    <span style={{ fontSize: '0.9rem', color: isRunning ? '#10B981' : '#EF4444' }}>
                        {isRunning ? 'SYSTEM ONLINE' : 'SYSTEM OFFLINE'}
                    </span>
                </div>
            </nav>

            <main className="container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '1rem 3rem' }}>

                <header style={{ marginBottom: '4rem', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '3rem', fontWeight: '200', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>
                        System <span style={{ color: 'var(--velveto-accent-primary)' }}>Monitor</span>
                    </h1>
                    <p style={{ color: 'var(--velveto-text-secondary)', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
                        Управление конвейером создания карточек. Цель: 2000 товаров. Нажмите на карточку статуса для деталей.
                    </p>
                </header>

                {/* Stat Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                    <StatCard
                        label="В ОЧЕРЕДИ"
                        value={stats.idle}
                        color="var(--velveto-text-muted)"
                        onClick={() => setSelectedStatus('idle')}
                        isActive={selectedStatus === 'idle'}
                    />
                    <StatCard
                        label="В РАБОТЕ"
                        value={stats.processing}
                        color="#3b82f6"
                        loading={isRunning}
                        onClick={() => setSelectedStatus('processing')}
                        isActive={selectedStatus === 'processing'}
                    />
                    <StatCard
                        label="ГОТОВО"
                        value={stats.done}
                        color="#10b981"
                        subValue={`Цель: 2000 (${Math.round(stats.done / 20)}%)`}
                        onClick={() => setSelectedStatus('done')}
                        isActive={selectedStatus === 'done'}
                    />
                    <StatCard
                        label="ОШИБКИ"
                        value={stats.error}
                        color="#EF4444"
                        onClick={() => setSelectedStatus('error')}
                        isActive={selectedStatus === 'error'}
                    />
                </div>

                {/* Detailed View Panel */}
                <AnimatePresence>
                    {selectedStatus && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="velveto-card"
                            style={{ padding: '0', overflow: 'hidden', marginBottom: '4rem', borderTop: '2px solid var(--velveto-accent-primary)' }}
                        >
                            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: '400', textTransform: 'uppercase' }}>
                                    📋 Детализация: {selectedStatus === 'idle' ? 'В очереди' : selectedStatus === 'processing' ? 'В работе' : selectedStatus === 'done' ? 'Готово' : 'Ошибки'}
                                </h3>
                                <button onClick={() => setSelectedStatus(null)} style={{ background: 'none', border: 'none', color: 'var(--velveto-text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
                            </div>
                            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                                    <thead style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--velveto-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                                        <tr>
                                            <th style={{ padding: '1rem' }}>Товар</th>
                                            <th style={{ padding: '1rem' }}>МС</th>
                                            <th style={{ padding: '1rem' }}>Склад</th>
                                            <th style={{ padding: '1rem' }}>Kaspi</th>
                                            <th style={{ padding: '1rem' }}>Обновлен</th>
                                            <th style={{ padding: '1rem' }}>Действие</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loadingItems ? (
                                            <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center' }}>Загрузка...</td></tr>
                                        ) : filteredItems.length === 0 ? (
                                            <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>Список пуст</td></tr>
                                        ) : (
                                            filteredItems.map(item => (
                                                <tr key={item.id} style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                                                    <td style={{ padding: '1rem' }}>{item.name}</td>
                                                    <td style={{ padding: '1rem' }}>{item.ms_created ? '✅' : '❌'}</td>
                                                    <td style={{ padding: '1rem' }}>{item.stock_added ? '✅' : '❌'}</td>
                                                    <td style={{ padding: '1rem' }}>{item.kaspi_created ? '✅' : '❌'}</td>
                                                    <td style={{ padding: '1rem', color: 'var(--velveto-text-muted)', fontSize: '0.8rem' }}>
                                                        {new Date(item.updated_at).toLocaleString()}
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <button onClick={() => handleRetry(item.id)} className="mini-btn">🔄 Sync</button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Progress Bar */}
                <div style={{ marginBottom: '4rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--velveto-text-muted)' }}>
                        <span>ПРОГРЕСС К ЦЕЛИ (2000 КАРТОЧЕК)</span>
                        <span>{stats.done} / 2000</span>
                    </div>
                    <div style={{ height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '5px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((stats.done / 2000) * 100, 100)}%` }}
                            style={{ height: '100%', background: 'linear-gradient(90deg, #3b82f6 0%, #10b981 100%)', boxShadow: '0 0 15px rgba(16,185,129,0.3)' }}
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 450px', gap: '2.5rem' }}>

                    {/* Left: Error Hub & Logs */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

                        {/* Error Hub */}
                        <div className="velveto-card" style={{ padding: '0', overflow: 'hidden' }}>
                            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: '400' }}>⚠️ ERROR HUB (Последние ошибки)</h3>
                                <div style={{ fontSize: '0.8rem', color: '#EF4444' }}>{stats.error} активных проблем</div>
                            </div>
                            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                                    <thead style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--velveto-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                                        <tr>
                                            <th style={{ padding: '1rem' }}>Товар</th>
                                            <th style={{ padding: '1rem' }}>Ошибка</th>
                                            <th style={{ padding: '1rem' }}>Действие</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {errors.length === 0 ? (
                                            <tr><td colSpan="3" style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>Ошибок не обнаружено</td></tr>
                                        ) : (
                                            errors.map(err => (
                                                <tr key={err.id} style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                                                    <td style={{ padding: '1rem' }}>{err.name}</td>
                                                    <td style={{ padding: '1rem', color: '#EF4444', fontSize: '0.8rem' }}>{err.conveyor_log?.substring(0, 100)}...</td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <button onClick={() => handleRetry(err.id)} className="mini-btn" style={{ borderColor: '#3b82f6', color: '#3b82f6' }}>Retry</button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Logs Terminal */}
                        <div className="velveto-card" style={{
                            flexGrow: 1,
                            background: '#0a0a0a',
                            border: '1px solid #333',
                            borderRadius: '12px',
                            padding: '1.5rem',
                            fontFamily: 'monospace',
                            fontSize: '0.85rem',
                            color: '#00ff00',
                            height: '400px',
                            overflowY: 'auto',
                            whiteSpace: 'pre-wrap'
                        }}>
                            <div style={{ marginBottom: '1rem', borderBottom: '1px solid #333', paddingBottom: '0.5rem', color: '#666', display: 'flex', justifyContent: 'space-between' }}>
                                <span>/// SYSTEM LIVE LOGS</span>
                                <span style={{ color: isRunning ? '#10b981' : '#f59e0b' }}>{isRunning ? 'RECORDING...' : 'IDLE'}</span>
                            </div>
                            {logs || "Waiting for logs..."}
                            <div ref={logEndRef} />
                        </div>
                    </div>

                    {/* Right: Controls & Rules */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                        {/* Control Card */}
                        <div className="velveto-card" style={{ padding: '2rem', textAlign: 'center' }}>
                            <motion.button
                                onClick={toggleConveyor}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                style={{
                                    width: '100px',
                                    height: '100px',
                                    borderRadius: '50%',
                                    border: 'none',
                                    background: isRunning ? 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                    color: 'white',
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    marginBottom: '1.5rem',
                                    boxShadow: isRunning ? '0 0 30px rgba(239, 68, 68, 0.4)' : '0 0 30px rgba(16, 185, 129, 0.4)'
                                }}
                            >
                                {isRunning ? 'STOP' : 'START'}
                            </motion.button>
                            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{isRunning ? 'Conveyor Active' : 'Conveyor Idle'}</h3>
                            <p style={{ color: 'var(--velveto-text-muted)', fontSize: '0.9rem' }}>
                                {isRunning ? 'Система автоматически обрабатывает товары.' : 'Нажмите Start для запуска цикла.'}
                            </p>
                        </div>

                        {/* Rules Snippet */}
                        <div className="velveto-card" style={{ padding: '1.5rem' }}>
                            <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--velveto-accent-primary)' }}>ОСНОВНЫЕ ПРАВИЛА</h4>
                            <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.85rem' }}>
                                <li style={{ display: 'flex', gap: '0.5rem' }}><span>✅</span> <span>Создание в МойСклад (Папка: Parser WB)</span></li>
                                <li style={{ display: 'flex', gap: '0.5rem' }}><span>✅</span> <span>Оприходование: 10 шт на "Основной склад"</span></li>
                                <li style={{ display: 'flex', gap: '0.5rem' }}><span>✅</span> <span>Kaspi: Создание по XML (Предзаказ 30 дн)</span></li>
                                <li style={{ display: 'flex', gap: '0.5rem' }}><span>✅</span> <span>AI Маппинг категорий и атрибутов</span></li>
                            </ul>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    )
}

function StatCard({ label, value, color, subValue, loading, onClick, isActive }) {
    return (
        <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className="velveto-card"
            style={{
                padding: '1.5rem',
                borderLeft: `4px solid ${color}`,
                cursor: 'pointer',
                background: isActive ? 'rgba(255,255,255,0.05)' : 'var(--velveto-card-bg)',
                borderColor: isActive ? 'var(--velveto-accent-primary)' : 'transparent',
                transition: 'all 0.2s ease'
            }}
        >
            <div style={{ fontSize: '0.75rem', color: 'var(--velveto-text-muted)', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>{label}</div>
            <div style={{ fontSize: '2rem', fontWeight: '200', color: color, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {value}
                {loading && (
                    <motion.span
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        style={{ fontSize: '1rem' }}
                    >
                        ●
                    </motion.span>
                )}
            </div>
            {subValue && <div style={{ fontSize: '0.7rem', marginTop: '0.4rem', opacity: 0.6 }}>{subValue}</div>}
            <div style={{ marginTop: '1rem', fontSize: '0.65rem', color: 'var(--velveto-accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: isActive ? 1 : 0.5 }}>
                {isActive ? 'Скрыть детали ↑' : 'Нажмите для деталей ↓'}
            </div>
        </motion.div>
    )
}
