'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import BackButton from '@/components/BackButton'
import confetti from 'canvas-confetti'

export default function PriceWarrior() {
    const [gameState, setGameState] = useState('start')
    const [myPrice, setMyPrice] = useState(8500)
    const [isMobile, setIsMobile] = useState(false)
    const [sales, setSales] = useState(0)
    const [profit, setProfit] = useState(0)
    const [timeLeft, setTimeLeft] = useState(60)
    const [hasBuyBox, setHasBuyBox] = useState(true)
    const [competitors, setCompetitors] = useState([
        { id: 1, name: 'Market King', price: 8700, strategy: 'aggressive' },
        { id: 2, name: 'Dumping Pro', price: 8900, strategy: 'normal' },
        { id: 3, name: 'Standard Shop', price: 9200, strategy: 'slow' }
    ])

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const COST_PRICE = 6000
    const TARGET_SALES = 500

    const startGame = () => {
        setSales(0)
        setProfit(0)
        setTimeLeft(60)
        setMyPrice(8500)
        setGameState('playing')
    }

    useEffect(() => {
        let interval
        if (gameState === 'playing' && timeLeft > 0) {
            interval = setInterval(() => {
                // Update competitors
                setCompetitors(prev => prev.map(c => {
                    let newPrice = c.price
                    if (c.strategy === 'aggressive') {
                        if (myPrice <= c.price) newPrice = Math.max(COST_PRICE + 100, myPrice - 10)
                    } else if (c.strategy === 'slow') {
                        if (Math.random() > 0.8) newPrice += (Math.random() * 100 - 50)
                    } else {
                        newPrice += (Math.random() * 40 - 20)
                    }
                    return { ...c, price: Math.round(newPrice) }
                }))

                // Check Buy Box
                const lowest = Math.min(...competitors.map(c => c.price), myPrice)
                const win = myPrice === lowest
                setHasBuyBox(win)

                // Sales logic
                if (win) {
                    setSales(s => s + 5)
                    setProfit(p => p + (myPrice - COST_PRICE) * 5)
                } else {
                    setSales(s => s + 1)
                    setProfit(p => p + (myPrice - COST_PRICE) * 1)
                }

                setTimeLeft(t => t - 1)
            }, 1000)
        } else if (timeLeft <= 0) {
            setGameState('result')
            if (sales >= TARGET_SALES && profit > 0) {
                confetti()
            }
        }
        return () => clearInterval(interval)
    }, [gameState, timeLeft, myPrice, competitors])

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#050814', color: '#fff', padding: isMobile ? '1.5rem' : '3rem', fontFamily: 'Inter, sans-serif' }}>
            <header style={{ maxWidth: '1200px', margin: isMobile ? '0 auto 1.5rem auto' : '0 auto 3rem auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <BackButton href="/games" />
                <div style={{ textAlign: 'right' }}>
                    {!isMobile && <div style={{ color: '#8a90a4', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px' }}>REAL-TIME BATTLE</div>}
                    <div style={{ fontSize: isMobile ? '1rem' : '1.2rem', fontWeight: 700, color: '#f59e0b' }}>Price Warrior</div>
                </div>
            </header>

            <main style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <AnimatePresence mode="wait">
                    {gameState === 'start' && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', padding: isMobile ? '2rem 0' : '5rem 0' }}>
                            <div style={{ fontSize: isMobile ? '3rem' : '6rem', marginBottom: '1.5rem' }}>⚔️</div>
                            <h1 style={{ fontSize: isMobile ? '1.8rem' : '3rem', fontWeight: 900, marginBottom: '1rem' }}>Битва за Buy Box</h1>
                            <p style={{ color: '#8a90a4', fontSize: isMobile ? '1rem' : '1.2rem', maxWidth: '600px', margin: '0 auto 2.5rem auto', lineHeight: 1.6 }}>
                                Удерживайте самую низкую цену, чтобы забирать 80% заказов. Но берегите маржу — демпинг может сжечь вашу прибыль!
                            </p>
                            <button onClick={startGame} style={{ backgroundColor: '#f59e0b', color: '#fff', border: 'none', padding: isMobile ? '1.2rem 2rem' : '1.5rem 4rem', borderRadius: '20px', fontSize: isMobile ? '1rem' : '1.2rem', fontWeight: 800, cursor: 'pointer', width: isMobile ? '100%' : 'auto' }}>
                                ВСТУПИТЬ В БОЙ
                            </button>
                        </motion.div>
                    )}

                    {gameState === 'playing' && (
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) 400px', gap: isMobile ? '1.5rem' : '3rem' }}>
                            <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: isMobile ? '1.5rem' : '3rem', borderRadius: isMobile ? '24px' : '40px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '1rem' : '0', marginBottom: isMobile ? '1.5rem' : '3rem' }}>
                                    <h2 style={{ fontSize: isMobile ? '1.4rem' : '1.8rem', fontWeight: 800 }}>Листинг товаров</h2>
                                    <div style={{ padding: '0.5rem 1.5rem', borderRadius: '100px', backgroundColor: hasBuyBox ? '#10b981' : 'rgba(255,255,255,0.1)', color: hasBuyBox ? '#050814' : '#fff', fontWeight: 900, fontSize: '0.8rem' }}>
                                        {hasBuyBox ? '🔥 ТЫ В BUY BOX' : '❌ ТЫ ВНЕ BOX'}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {/* Me */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: isMobile ? '1.2rem' : '2rem', borderRadius: '24px', background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.1) 0%, transparent 100%)', border: '2px solid #f59e0b' }}>
                                        <div>
                                            <div style={{ fontSize: '0.6rem', color: '#f59e0b', fontWeight: 900 }}>ТВОЙ МАГАЗИН</div>
                                            <div style={{ fontSize: isMobile ? '1.1rem' : '1.5rem', fontWeight: 800 }}>Velveto Shop</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: isMobile ? '1.3rem' : '1.8rem', fontWeight: 900 }}>{myPrice.toLocaleString()} ₸</div>
                                        </div>
                                    </div>

                                    {/* Competitors */}
                                    {competitors.sort((a, b) => a.price - b.price).map(c => (
                                        <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: isMobile ? '1rem 1.2rem' : '1.5rem 2rem', borderRadius: '24px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ opacity: 0.6 }}>
                                                <div style={{ fontSize: '0.6rem', color: '#8a90a4' }}>КОНКУРЕНТ</div>
                                                <div style={{ fontSize: isMobile ? '0.9rem' : '1.1rem', fontWeight: 600 }}>{c.name}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: isMobile ? '1rem' : '1.3rem', fontWeight: 800 }}>{c.price.toLocaleString()} ₸</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ background: 'linear-gradient(145deg, #f59e0b 0%, #d97706 100%)', padding: isMobile ? '1.5rem' : '2rem', borderRadius: '32px', boxShadow: '0 10px 30px rgba(245, 158, 11, 0.2)' }}>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 800, opacity: 0.8, marginBottom: '0.5rem' }}>ПРОДАНО ВСЕГО</div>
                                    <div style={{ fontSize: isMobile ? '2rem' : '3rem', fontWeight: 900 }}>{sales} шт</div>
                                    <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.2)', margin: '1rem 0' }} />
                                    <div style={{ fontSize: '0.7rem', fontWeight: 800, opacity: 0.8, marginBottom: '0.5rem' }}>ТЕКУЩАЯ ПРИБЫЛЬ</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{Math.floor(profit).toLocaleString()} ₸</div>
                                </div>

                                <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: isMobile ? '1.5rem' : '2rem', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ fontSize: '0.7rem', color: '#8a90a4', marginBottom: '1.5rem', fontWeight: 800 }}>УПРАВЛЕНИЕ ЦЕНОЙ</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <button onClick={() => setMyPrice(p => p - 10)} style={{ flex: 1, padding: isMobile ? '0.8rem' : '1rem', borderRadius: '12px', border: 'none', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', fontSize: isMobile ? '1rem' : '1.2rem', fontWeight: 800 }}>-10</button>
                                        <div style={{ width: '1rem' }} />
                                        <button onClick={() => setMyPrice(p => p + 10)} style={{ flex: 1, padding: isMobile ? '0.8rem' : '1rem', borderRadius: '12px', border: 'none', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', fontSize: isMobile ? '1rem' : '1.2rem', fontWeight: 800 }}>+10</button>
                                    </div>
                                    <input
                                        type="range"
                                        min={COST_PRICE - 500}
                                        max={12000}
                                        value={myPrice}
                                        onChange={(e) => setMyPrice(Number(e.target.value))}
                                        style={{ width: '100%', accentColor: '#f59e0b' }}
                                    />
                                    <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: myPrice < COST_PRICE ? '#ef4444' : '#8a90a4', textAlign: 'center' }}>
                                        {myPrice < COST_PRICE ? 'Внимание! Продажи в убыток!' : `Себестоимость: ${COST_PRICE} ₸`}
                                    </div>
                                </div>

                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.7rem', color: '#8a90a4', marginBottom: '0.5rem' }}>ОСТАЛОСЬ ВРЕМЕНИ</div>
                                    <div style={{ fontSize: isMobile ? '2rem' : '3rem', fontWeight: 900, color: timeLeft < 10 ? '#ef4444' : '#fff' }}>{timeLeft}s</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {gameState === 'result' && (
                        <div style={{ textAlign: 'center', padding: isMobile ? '2rem 0' : '5rem 0' }}>
                            <div style={{ fontSize: isMobile ? '4rem' : '5rem', marginBottom: '1.5rem' }}>{profit > 0 ? '🏆' : '💸'}</div>
                            <h2 style={{ fontSize: isMobile ? '2rem' : '3rem', fontWeight: 900, marginBottom: '1rem' }}>Результаты Битвы</h2>
                            <p style={{ color: '#8a90a4', fontSize: isMobile ? '1rem' : '1.2rem', marginBottom: '2.5rem', lineHeight: 1.6 }}>
                                Вы продали {sales} товаров и заработали {Math.floor(profit).toLocaleString()} ₸ чистой прибыли.
                            </p>
                            <button onClick={startGame} style={{ backgroundColor: '#fff', color: '#050814', border: 'none', padding: isMobile ? '1.2rem 3rem' : '1.5rem 5rem', borderRadius: '20px', fontSize: isMobile ? '1.1rem' : '1.2rem', fontWeight: 800, cursor: 'pointer', width: isMobile ? '100%' : 'auto' }}>РЕВАНШ</button>
                        </div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    )
}
