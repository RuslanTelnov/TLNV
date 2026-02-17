'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import BackButton from '@/components/BackButton'
import confetti from 'canvas-confetti'

export default function PriceWarrior() {
    const [gameState, setGameState] = useState('start')
    const [myPrice, setMyPrice] = useState(8500)
    const [competitors, setCompetitors] = useState([
        { id: 1, name: 'ShopA', price: 8490, strategy: 'aggressive' },
        { id: 2, name: 'MarketPro', price: 8600, strategy: 'slow' },
        { id: 3, name: 'TopSeller', price: 8550, strategy: 'random' }
    ])
    const [sales, setSales] = useState(0)
    const [profit, setProfit] = useState(0)
    const [timeLeft, setTimeLeft] = useState(60)
    const [hasBuyBox, setHasBuyBox] = useState(false)

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
        <div style={{ minHeight: '100vh', backgroundColor: '#050814', color: '#fff', padding: '3rem', fontFamily: 'Inter, sans-serif' }}>
            <header style={{ maxWidth: '1200px', margin: '0 auto 3rem auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <BackButton href="/games" />
                <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#8a90a4', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px' }}>REAL-TIME BATTLE</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f59e0b' }}>Price Warrior</div>
                </div>
            </header>

            <main style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <AnimatePresence mode="wait">
                    {gameState === 'start' && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', padding: '5rem 0' }}>
                            <div style={{ fontSize: '6rem', marginBottom: '2rem' }}>⚔️</div>
                            <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1.5rem' }}>Битва за Buy Box</h1>
                            <p style={{ color: '#8a90a4', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 3rem auto' }}>
                                Удерживайте самую низкую цену, чтобы забирать 80% заказов. Но берегите маржу — демпинг может сжечь вашу прибыль!
                            </p>
                            <button onClick={startGame} style={{ backgroundColor: '#f59e0b', color: '#fff', border: 'none', padding: '1.5rem 4rem', borderRadius: '20px', fontSize: '1.2rem', fontWeight: 800, cursor: 'pointer' }}>
                                ВСТУПИТЬ В БОЙ
                            </button>
                        </motion.div>
                    )}

                    {gameState === 'playing' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 400px', gap: '3rem' }}>
                            <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '3rem', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Листинг товаров</h2>
                                    <div style={{ padding: '0.5rem 1.5rem', borderRadius: '100px', backgroundColor: hasBuyBox ? '#10b981' : 'rgba(255,255,255,0.1)', color: hasBuyBox ? '#050814' : '#fff', fontWeight: 900, fontSize: '0.8rem' }}>
                                        {hasBuyBox ? '🔥 ТЫ В BUY BOX' : '❌ ТЫ ВНЕ BOX'}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {/* Me */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2rem', borderRadius: '24px', background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.1) 0%, transparent 100%)', border: '2px solid #f59e0b' }}>
                                        <div>
                                            <div style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 900 }}>ТВОЙ МАГАЗИН</div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>Velveto Shop</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>{myPrice.toLocaleString()} ₸</div>
                                        </div>
                                    </div>

                                    {/* Competitors */}
                                    {competitors.sort((a, b) => a.price - b.price).map(c => (
                                        <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5rem 2rem', borderRadius: '24px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ opacity: 0.6 }}>
                                                <div style={{ fontSize: '0.6rem', color: '#8a90a4' }}>КОНКУРЕНТ</div>
                                                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{c.name}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{c.price.toLocaleString()} ₸</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                <div style={{ background: 'linear-gradient(145deg, #f59e0b 0%, #d97706 100%)', padding: '2rem', borderRadius: '32px', boxShadow: '0 10px 30px rgba(245, 158, 11, 0.2)' }}>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 800, opacity: 0.8, marginBottom: '0.5rem' }}>ПРОДАНО ВСЕГО</div>
                                    <div style={{ fontSize: '3rem', fontWeight: 900 }}>{sales} шт</div>
                                    <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.2)', margin: '1rem 0' }} />
                                    <div style={{ fontSize: '0.7rem', fontWeight: 800, opacity: 0.8, marginBottom: '0.5rem' }}>ТЕКУЩАЯ ПРИБЫЛЬ</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{Math.floor(profit).toLocaleString()} ₸</div>
                                </div>

                                <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ fontSize: '0.7rem', color: '#8a90a4', marginBottom: '1.5rem', fontWeight: 800 }}>УПРАВЛЕНИЕ ЦЕНОЙ</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <button onClick={() => setMyPrice(p => p - 10)} style={{ flex: 1, padding: '1rem', borderRadius: '12px', border: 'none', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 800 }}>-10</button>
                                        <div style={{ width: '1rem' }} />
                                        <button onClick={() => setMyPrice(p => p + 10)} style={{ flex: 1, padding: '1rem', borderRadius: '12px', border: 'none', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 800 }}>+10</button>
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
                                    <div style={{ fontSize: '3rem', fontWeight: 900, color: timeLeft < 10 ? '#ef4444' : '#fff' }}>{timeLeft}s</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {gameState === 'result' && (
                        <div style={{ textAlign: 'center', padding: '5rem 0' }}>
                            <div style={{ fontSize: '5rem', marginBottom: '2rem' }}>{profit > 0 ? '🏆' : '💸'}</div>
                            <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1rem' }}>Результаты Битвы</h2>
                            <p style={{ color: '#8a90a4', fontSize: '1.2rem', marginBottom: '3rem' }}>
                                Вы продали {sales} товаров и заработали {Math.floor(profit).toLocaleString()} ₸ чистой прибыли.
                            </p>
                            <button onClick={startGame} style={{ backgroundColor: '#fff', color: '#050814', border: 'none', padding: '1.5rem 5rem', borderRadius: '20px', fontSize: '1.2rem', fontWeight: 800, cursor: 'pointer' }}>РЕВАНШ</button>
                        </div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    )
}
