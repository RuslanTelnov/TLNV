'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import BackButton from '@/components/BackButton'
import confetti from 'canvas-confetti'

const DAYS = 14
const INITIAL_STOCK = 150
const UNIT_PROFIT = 400

export default function SupplyChainMaster() {
    const [gameState, setGameState] = useState('start')
    const [day, setDay] = useState(0)
    const [stock, setStock] = useState(INITIAL_STOCK)
    const [history, setHistory] = useState([])
    const [orderQueue, setOrderQueue] = useState([]) // {amount, arrivalDay}
    const [totalProfit, setTotalProfit] = useState(0)
    const [lostSales, setLostSales] = useState(0)

    // Generate demand pattern for 14 days
    const demandPattern = useMemo(() => {
        return Array.from({ length: DAYS }, () => Math.floor(Math.random() * 30) + 10)
    }, [])

    const nextDay = (orderAmount) => {
        const demand = demandPattern[day]
        const leadTime = 3 // 3 days for delivery

        let sales = Math.min(stock, demand)
        let newLostSales = lostSales + (demand > stock ? demand - stock : 0)
        let newProfit = totalProfit + sales * UNIT_PROFIT

        // Process orders
        let arrivingStock = 0
        const remainingQueue = orderQueue.filter(o => {
            if (o.arrivalDay === day + 1) {
                arrivingStock += o.amount
                return false
            }
            return true
        })

        if (orderAmount > 0) {
            remainingQueue.push({ amount: orderAmount, arrivalDay: day + 1 + leadTime })
        }

        setStock(prev => Math.max(0, prev - sales + arrivingStock))
        setTotalProfit(newProfit)
        setLostSales(newLostSales)
        setOrderQueue(remainingQueue)
        setHistory(prev => [...prev, { day, stock, demand, sales }])

        if (day === DAYS - 1) {
            setGameState('result')
            if (newLostSales === 0) {
                confetti({
                    particleCount: 200,
                    spread: 80,
                    origin: { y: 0.6 }
                })
            }
        } else {
            setDay(d => d + 1)
        }
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#050814', color: '#fff', padding: '3rem', fontFamily: 'Inter, sans-serif' }}>
            <header style={{ maxWidth: '1200px', margin: '0 auto 3rem auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <BackButton href="/games" />
                <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#8a90a4', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Миссия</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#8b5cf6' }}>Supply Chain Master</div>
                </div>
            </header>

            <main style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {gameState === 'start' && (
                    <div style={{ textAlign: 'center', padding: '5rem 0' }}>
                        <div style={{ fontSize: '6rem', marginBottom: '2rem' }}>⛓️</div>
                        <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1.5rem' }}>Мастер Цепочек Поставок</h1>
                        <p style={{ color: '#8a90a4', maxWidth: '600px', margin: '0 auto 3rem auto', fontSize: '1.2rem' }}>
                            Твоя задача — продержать склад под контролем 14 дней. Дефицит (OOS) убивает продажи, а излишки морозят деньги.
                            Срок доставки любого заказа — 3 дня.
                        </p>
                        <button onClick={() => setGameState('playing')} style={{ backgroundColor: '#8b5cf6', color: '#fff', border: 'none', padding: '1.5rem 4rem', borderRadius: '20px', fontSize: '1.2rem', fontWeight: 800, cursor: 'pointer' }}>
                            ПРИНЯТЬ КОМАНДОВАНИЕ
                        </button>
                    </div>
                )}

                {gameState === 'playing' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '3rem' }}>
                        <div>
                            {/* Dashboard Stats */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                                <StatCard label="ТЕКУЩИЙ ОСТАТОК" value={stock} sub="единиц" color="#10b981" />
                                <StatCard label="ДЕНЬ" value={`${day + 1}/${DAYS}`} sub="цикл планирования" color="#3b82f6" />
                                <StatCard label="УПУЩЕННАЯ ВЫРУЧКА" value={lostSales * 1200} sub="рублей ₽" color={lostSales > 0 ? '#ef4444' : '#8a90a4'} />
                            </div>

                            {/* Chart Area (Simplified) */}
                            <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)', padding: '2rem', minHeight: '300px' }}>
                                <h3 style={{ marginBottom: '2rem', color: '#8a90a4' }}>История спроса и остатков</h3>
                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', height: '200px' }}>
                                    {history.map((h, i) => (
                                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column-reverse', gap: '4px' }}>
                                            <div style={{ height: h.stock, backgroundColor: stock < 20 ? '#ef4444' : '#10b981', borderRadius: '4px', opacity: 0.5 }} />
                                            <div style={{ height: h.demand, backgroundColor: '#3b82f6', borderRadius: '4px' }} />
                                        </div>
                                    ))}
                                    {/* Current Day Placeholder */}
                                    <div style={{ flex: 1, height: '100%', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '4px' }} />
                                </div>
                            </div>
                        </div>

                        {/* Controls */}
                        <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '2.5rem', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <h3 style={{ marginBottom: '1.5rem' }}>Разместить заказ</h3>
                            <p style={{ color: '#8a90a4', fontSize: '0.9rem', marginBottom: '2rem' }}>Товар прибудет через 3 дня. Планируй заранее.</p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                {[0, 50, 100, 200].map(val => (
                                    <button
                                        key={val}
                                        onClick={() => nextDay(val)}
                                        style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', padding: '1rem', borderRadius: '12px', cursor: 'pointer', fontWeight: 600 }}
                                    >
                                        +{val}
                                    </button>
                                ))}
                            </div>
                            <div style={{ textAlign: 'center', opacity: 0.5, fontSize: '0.8rem' }}>Кликая на кнопку, вы переходите к следующему дню</div>
                        </div>
                    </div>
                )}

                {gameState === 'result' && (
                    <div style={{ textAlign: 'center', padding: '5rem 0' }}>
                        <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1rem' }}>Анализ смены</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', maxWidth: '600px', margin: '3rem auto' }}>
                            <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '24px' }}>
                                <div style={{ color: '#8a90a4', marginBottom: '0.5rem' }}>ПРИБЫЛЬ</div>
                                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#10b981' }}>{totalProfit.toLocaleString()} ₽</div>
                            </div>
                            <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '24px' }}>
                                <div style={{ color: '#8a90a4', marginBottom: '0.5rem' }}>УПУЩЕННЫЕ ПРОДАЖИ</div>
                                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: lostSales > 0 ? '#ef4444' : '#10b981' }}>{lostSales}</div>
                            </div>
                        </div>
                        <button onClick={() => window.location.reload()} style={{ backgroundColor: '#fff', color: '#050814', border: 'none', padding: '1.5rem 3rem', borderRadius: '16px', fontSize: '1.1rem', fontWeight: 800, cursor: 'pointer' }}>
                            ПОВТОРИТЬ КУРС
                        </button>
                    </div>
                )}
            </main>
        </div>
    )
}

function StatCard({ label, value, sub, color }) {
    return (
        <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#8a90a4', marginBottom: '1rem', letterSpacing: '1px' }}>{label}</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: color }}>{value}</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>{sub}</div>
        </div>
    )
}
