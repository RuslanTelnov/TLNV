'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import BackButton from '@/components/BackButton'
import confetti from 'canvas-confetti'

const DAYS = 30
const INITIAL_STOCK = 100
const INITIAL_CAPITAL = 2500000
const UNIT_COST = 3000
const UNIT_PRICE = 6000
const STORAGE_FEE_PER_UNIT = 25

const EVENTS = [
    { title: "Задержка на таможне", description: "Lead time увеличен на 2 дня", effect: (s) => ({ ...s, leadTimeBonus: 2 }), duration: 3 },
    { title: "Обзор у блогера", description: "Спрос вырастет в 3 раза", effect: (s) => ({ ...s, demandMultiplier: 3 }), duration: 2 },
    { title: "Демпинг конкурентов", description: "Спрос упал на 50%", effect: (s) => ({ ...s, demandMultiplier: 0.5 }), duration: 4 },
    { title: "Распродажа площадки", description: "Спрос +100%, но Lead time +1 день", effect: (s) => ({ ...s, demandMultiplier: 2, leadTimeBonus: 1 }), duration: 3 }
]

export default function SupplyChainMaster() {
    const [gameState, setGameState] = useState('start')
    const [day, setDay] = useState(0)
    const [stock, setStock] = useState(INITIAL_STOCK)
    const [capital, setCapital] = useState(INITIAL_CAPITAL)
    const [orderInput, setOrderInput] = useState('')
    const [history, setHistory] = useState([])
    const [orderQueue, setOrderQueue] = useState([])
    const [lostSales, setLostSales] = useState(0)
    const [activeEvent, setActiveEvent] = useState(null)
    const [eventDuration, setEventDuration] = useState(0)
    const [stats, setStats] = useState({ demandMultiplier: 1, leadTimeBonus: 0 })

    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const nextDay = () => {
        const orderAmount = parseInt(orderInput) || 0
        const orderCost = orderAmount * UNIT_COST

        if (orderAmount > 0 && orderCost > capital) {
            alert("Недостаточно капитала для закупки!")
            return
        }

        // 1. Calculate Demand
        const baseDemand = Math.floor(Math.random() * 30) + 15
        const actualDemand = Math.floor(baseDemand * stats.demandMultiplier)

        // 2. Process Sales
        const sales = Math.min(stock, actualDemand)
        const revenue = sales * UNIT_PRICE
        const currentLostSales = actualDemand > stock ? actualDemand - stock : 0

        // 3. Storage Fees
        const storageCost = stock * STORAGE_FEE_PER_UNIT

        // 4. Update Capital & Stock
        const newCapital = capital + revenue - (orderAmount > 0 ? orderCost : 0) - storageCost
        const newStock = stock - sales

        // 5. Handle Orders arriving today
        let arrivingStock = 0
        const nextOrderQueue = orderQueue.filter(o => {
            if (o.arrivalDay === day + 1) {
                arrivingStock += o.amount
                return false
            }
            return true
        })

        // 6. Add new order to queue
        if (orderAmount > 0) {
            const leadTime = 3 + stats.leadTimeBonus + Math.floor(Math.random() * 2)
            nextOrderQueue.push({ amount: orderAmount, arrivalDay: day + 1 + leadTime })
        }

        // 7. Update Event State
        let nextStats = { demandMultiplier: 1, leadTimeBonus: 0 }
        let nextEvent = activeEvent
        let nextEventDuration = eventDuration - 1

        if (nextEvent && nextEventDuration <= 0) {
            nextEvent = null
        }

        if (!nextEvent && Math.random() > 0.8) { // 20% chance to trigger a new event if none is active
            const event = EVENTS[Math.floor(Math.random() * EVENTS.length)]
            nextEvent = event
            nextEventDuration = event.duration
        }

        if (nextEvent) {
            nextStats = nextEvent.effect(nextStats)
        }

        // State Updates
        setStock(newStock + arrivingStock)
        setCapital(newCapital)
        setLostSales(prev => prev + currentLostSales)
        setOrderQueue(nextOrderQueue)
        setHistory(prev => [...prev, { day, stock: newStock, demand: actualDemand, sales, event: activeEvent?.title }])
        setOrderInput('')
        setActiveEvent(nextEvent)
        setEventDuration(nextEventDuration)
        setStats(nextStats)

        if (day === DAYS - 1) setGameState('result')
        else setDay(d => d + 1)
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#050814', color: '#fff', padding: isMobile ? '1.5rem' : '3rem', fontFamily: 'Inter, sans-serif' }}>
            <header style={{ maxWidth: '1200px', margin: isMobile ? '0 auto 1.5rem auto' : '0 auto 3rem auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <BackButton href="/games" />
                <div style={{ textAlign: 'right' }}>
                    {!isMobile && <div style={{ color: '#8a90a4', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Hardcore Simulation</div>}
                    <div style={{ fontSize: isMobile ? '1rem' : '1.2rem', fontWeight: 700, color: '#8b5cf6' }}>Supply Chain Master</div>
                </div>
            </header>

            <main style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {gameState === 'start' && (
                    <div style={{ textAlign: 'center', padding: isMobile ? '2rem 0' : '5rem 0' }}>
                        <div style={{ fontSize: isMobile ? '3.5rem' : '6rem', marginBottom: '1.5rem' }}>💀</div>
                        <h1 style={{ fontSize: isMobile ? '1.8rem' : '3rem', fontWeight: 900, marginBottom: '1.5rem' }}>Уровень: ЭКСПЕРТ</h1>
                        <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: isMobile ? '1.5rem' : '3rem', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)', maxWidth: '800px', margin: '0 auto 3rem auto', textAlign: 'left' }}>
                            <h3 style={{ color: '#8b5cf6', marginBottom: '1.5rem', fontSize: isMobile ? '1.2rem' : '1.5rem' }}>⛓️ Правила игры:</h3>
                            <ul style={{ color: '#8a90a4', fontSize: isMobile ? '0.9rem' : '1.1rem', lineHeight: '1.8', display: 'flex', flexDirection: 'column', gap: '1rem', paddingLeft: '1.2rem' }}>
                                <li>📅 30 дней автономного управления.</li>
                                <li>💰 2,500,000 ₸ стартовый капитал.</li>
                                <li>💵 Себестоимость 3,000 ₸, продажа 6,000 ₸.</li>
                                <li>🏠 Хранение на складе: 25 ₸/сутки за единицу.</li>
                                <li>🚚 Доставка заказа: около 3-5 дней.</li>
                            </ul>
                        </div>
                        <button onClick={() => setGameState('playing')} style={{ backgroundColor: '#8b5cf6', color: '#fff', border: 'none', padding: isMobile ? '1.2rem 2rem' : '1.5rem 4rem', borderRadius: '20px', fontSize: isMobile ? '1.1rem' : '1.2rem', fontWeight: 800, cursor: 'pointer', width: isMobile ? '100%' : 'auto' }}>
                            НАЧАТЬ СМЕНУ
                        </button>
                    </div>
                )}

                {gameState === 'playing' && (
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 380px', gap: isMobile ? '1.5rem' : '3rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '1.5rem' : '2rem' }}>
                            {/* Dashboard Stats */}
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? '1rem' : '1.5rem', marginBottom: isMobile ? '0.5rem' : '2rem' }}>
                                <StatCard label="КАПИТАЛ" value={Math.floor(capital).toLocaleString()} unit="₸" color={capital < 0 ? '#ef4444' : '#10b981'} isMobile={isMobile} />
                                <StatCard label="ОСТАТОК" value={stock} sub={`${stock * STORAGE_FEE_PER_UNIT} ₸/день`} color={stock < 20 ? '#ef4444' : '#fff'} isMobile={isMobile} />
                                <StatCard label="ДЕНЬ" value={`${day + 1}/${DAYS}`} sub="горизонт 1 мес" color="#3b82f6" isMobile={isMobile} />
                            </div>

                            {/* Active Event */}
                            <AnimatePresence mode="wait">
                                {activeEvent && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', border: '1px solid #8b5cf6', padding: isMobile ? '1rem' : '1.5rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: isMobile ? '1rem' : '1.5rem' }}
                                    >
                                        <div style={{ fontSize: isMobile ? '1.5rem' : '2rem' }}>⚠️</div>
                                        <div>
                                            <div style={{ fontWeight: 800, color: '#8b5cf6', textTransform: 'uppercase', fontSize: '0.7rem' }}>{activeEvent.title}</div>
                                            <div style={{ fontSize: isMobile ? '0.8rem' : '0.9rem', color: '#c3c9d9' }}>{activeEvent.description} ({eventDuration} дн.)</div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Chart Area */}
                            <div style={{ backgroundColor: 'rgba(255,255,255,0.01)', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)', padding: isMobile ? '1.2rem' : '2rem' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: isMobile ? '150px' : '200px' }}>
                                    {history.map((h, i) => (
                                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column-reverse', gap: '1px', position: 'relative' }}>
                                            <div style={{ height: (h.stock / INITIAL_STOCK) * 100, backgroundColor: h.stock < 20 ? '#ef4444' : '#10b981', borderRadius: '1px', opacity: 0.3 }} />
                                            <div style={{ height: (h.demand / 50) * 100, backgroundColor: h.event ? '#8b5cf6' : '#3b82f6', borderRadius: '1px' }} />
                                        </div>
                                    ))}
                                    <div style={{ flex: 1, height: '100%', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '1px' }} />
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? '0.8rem' : '2rem', marginTop: '1.2rem', fontSize: '0.6rem', opacity: 0.7 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><div style={{ width: '8px', height: '8px', backgroundColor: '#3b82f6' }} /> Спрос</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><div style={{ width: '8px', height: '8px', backgroundColor: '#8b5cf6' }} /> Эвент</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><div style={{ width: '8px', height: '8px', backgroundColor: '#10b981', opacity: 0.3 }} /> Склад</div>
                                </div>
                            </div>
                        </div>

                        {/* Order Control */}
                        <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: isMobile ? '1.5rem' : '2.5rem', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.1)', height: 'fit-content' }}>
                            <h3 style={{ marginBottom: '1.2rem', fontSize: isMobile ? '1.2rem' : '1.5rem', fontWeight: 800 }}>Управление поставкой</h3>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.7rem', color: '#8a90a4', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Партия заказа (шт)</label>
                                <input
                                    type="number"
                                    value={orderInput}
                                    onChange={(e) => setOrderInput(e.target.value)}
                                    placeholder="Напр: 100"
                                    style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: isMobile ? '1rem' : '1.2rem', borderRadius: '12px', color: '#fff', fontSize: '1.1rem', fontWeight: 700 }}
                                />
                                {orderInput && (
                                    <div style={{ marginTop: '0.8rem', fontSize: '0.8rem', color: (parseInt(orderInput) * UNIT_COST) > capital ? '#ef4444' : '#10b981' }}>
                                        Сумма: {(parseInt(orderInput) * UNIT_COST || 0).toLocaleString()} ₸
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={nextDay}
                                style={{ width: '100%', backgroundColor: '#fff', color: '#050814', border: 'none', padding: isMobile ? '1.1rem' : '1.3rem', borderRadius: '12px', fontSize: '1rem', fontWeight: 900, cursor: 'pointer' }}
                            >
                                ЗАВЕРШИТЬ ДЕНЬ {day + 1}
                            </button>

                            <div style={{ marginTop: '2rem' }}>
                                <h4 style={{ fontSize: '0.6rem', color: '#8a90a4', textTransform: 'uppercase', marginBottom: '0.8rem', letterSpacing: '1px' }}>Транзит товаров</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                    {orderQueue.length === 0 && <div style={{ fontSize: '0.75rem', opacity: 0.3 }}>Доставок нет</div>}
                                    {orderQueue.map((o, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', backgroundColor: 'rgba(255,255,255,0.02)', padding: '0.6rem 0.8rem', borderRadius: '8px' }}>
                                            <span>📦 {o.amount} шт</span>
                                            <span style={{ color: '#3b82f6' }}>через {o.arrivalDay - day - 1} дн.</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {gameState === 'result' && (
                    <div style={{ textAlign: 'center', padding: isMobile ? '2rem 0' : '5rem 0' }}>
                        <h2 style={{ fontSize: isMobile ? '2rem' : '3rem', fontWeight: 900, marginBottom: '1rem' }}>Итоги смены</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '1rem' : '2rem', maxWidth: '600px', margin: '2rem auto' }}>
                            <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: isMobile ? '1.5rem' : '2rem', borderRadius: '24px' }}>
                                <div style={{ color: '#8a90a4', marginBottom: '0.5rem', fontSize: '0.8rem' }}>Итоговая прибыль</div>
                                <div style={{ fontSize: isMobile ? '2rem' : '2.5rem', fontWeight: 900, color: (capital - INITIAL_CAPITAL) >= 0 ? '#10b981' : '#ef4444' }}>{(capital - INITIAL_CAPITAL).toLocaleString()} ₸</div>
                            </div>
                            <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: isMobile ? '1.5rem' : '2rem', borderRadius: '24px' }}>
                                <div style={{ color: '#8a90a4', marginBottom: '0.5rem', fontSize: '0.8rem' }}>Упущенные продажи</div>
                                <div style={{ fontSize: isMobile ? '2rem' : '2.5rem', fontWeight: 900, color: lostSales > 0 ? '#ef4444' : '#10b981' }}>{lostSales}</div>
                            </div>
                        </div>
                        <button onClick={() => window.location.reload()} style={{ backgroundColor: '#fff', color: '#050814', border: 'none', padding: isMobile ? '1.2rem 2rem' : '1.5rem 3rem', borderRadius: '16px', fontSize: '1.1rem', fontWeight: 800, cursor: 'pointer', width: isMobile ? '100%' : 'auto' }}>
                            ЗАПИСАТЬСЯ НА ПОВТОР
                        </button>
                    </div>
                )}
            </main>
        </div>
    )
}

function StatCard({ label, value, unit, sub, color, isMobile }) {
    return (
        <div style={{
            backgroundColor: 'rgba(255,255,255,0.02)',
            padding: isMobile ? '1.2rem' : '2rem',
            borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.05)',
            background: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
        }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#8a90a4', marginBottom: isMobile ? '0.5rem' : '1rem', letterSpacing: '2px', textTransform: 'uppercase' }}>{label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                <div style={{ fontSize: isMobile ? '1.5rem' : '2.2rem', fontWeight: 900, color: color, letterSpacing: '-1px' }}>{value}</div>
                {unit && <div style={{ fontSize: isMobile ? '0.9rem' : '1.4rem', fontWeight: 700, color: color, opacity: 0.8 }}>{unit}</div>}
            </div>
            {sub && <div style={{ fontSize: isMobile ? '0.65rem' : '0.8rem', opacity: 0.5, marginTop: '0.4rem' }}>{sub}</div>}
        </div>
    )
}
