'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import BackButton from '@/components/BackButton'
import Link from 'next/link'

export default function MarketplaceTycoon() {
    const [gameState, setGameState] = useState('start')
    const [turn, setTurn] = useState(1)
    const [cash, setCash] = useState(100000)
    const [inventory, setInventory] = useState(0)
    const [event, setEvent] = useState(null)
    const [history, setHistory] = useState([])

    // Slider states
    const [buyAmount, setBuyAmount] = useState(0)
    const [priceHypothesis, setPriceHypothesis] = useState(2500)

    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const EVENTS = [
        { title: 'Распродажа 11.11', effect: 'Спрос вырос в 2 раза!', demandMultiplier: 2, buyImpact: 1 },
        { title: 'Задержка на таможне', effect: 'Стоимость закупа выросла на 20%', buyImpact: 1.2, demandMultiplier: 1 },
        { title: 'Виральное видео в TikTok', effect: 'Очередь за вашим товаром!', demandMultiplier: 3, buyImpact: 1 },
        { title: 'Демпинг конкурентов', effect: 'Нужно снижать цену или терять продажи', buyImpact: 1, demandMultiplier: 0.7 },
        { title: 'Стабильный рынок', effect: 'Никаких сюрпризов', demandMultiplier: 1, buyImpact: 1 }
    ]

    const startGame = () => {
        setGameState('playing')
        setTurn(1)
        setCash(100000)
        setInventory(0)
        setHistory([])
        setEvent(null)
        setBuyAmount(0)
        setPriceHypothesis(2500)
    }

    const nextTurn = () => {
        const currentEvent = EVENTS[Math.floor(Math.random() * EVENTS.length)]
        const buyCost = buyAmount * 1000 * (currentEvent.buyImpact || 1)

        if (buyCost > cash) return alert('Недостаточно средств!')

        const baseDemand = Math.floor(Math.random() * 50) + 10
        const actualDemand = Math.floor(baseDemand * currentEvent.demandMultiplier)
        const soldAmount = Math.min(inventory + buyAmount, actualDemand)
        const revenue = soldAmount * priceHypothesis

        const newInventory = (inventory + buyAmount) - soldAmount
        const newCash = cash - buyCost + revenue

        setHistory([{
            turn,
            event: currentEvent.title,
            sold: soldAmount,
            revenue,
            profit: revenue - buyCost
        }, ...history])

        setCash(newCash)
        setInventory(newInventory)
        setTurn(t => t + 1)
        setEvent(currentEvent)
        setBuyAmount(0)

        if (turn >= 10 || newCash <= 0) {
            setGameState('result')
        }
    }

    const containerStyle = {
        position: 'fixed',
        inset: 0,
        backgroundColor: '#050814',
        color: '#f5f5f5',
        fontFamily: "'Outfit', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        overflowX: 'hidden'
    }

    const headerStyle = {
        padding: isMobile ? '1.2rem' : '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        zIndex: 10,
        backgroundColor: 'rgba(5, 8, 20, 0.8)',
        backdropFilter: 'blur(10px)'
    }

    const cardStyle = {
        backgroundColor: 'rgba(16, 21, 40, 0.7)',
        backdropFilter: 'blur(30px)',
        borderRadius: '32px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        padding: isMobile ? '1.8rem' : '3rem',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        width: '100%'
    }

    return (
        <div style={containerStyle}>
            <header style={headerStyle}>
                <BackButton href="/games" />
                <div style={{ textAlign: 'center' }}>
                    <h1 style={{ fontSize: isMobile ? '0.9rem' : '1.2rem', fontWeight: 300, letterSpacing: '0.4em', margin: 0, color: '#ffb35a' }}>TYCOON 2.0</h1>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.55rem', color: '#8a90a4', textTransform: 'uppercase', letterSpacing: '1px' }}>Капитал</div>
                    <div style={{ fontSize: isMobile ? '1.3rem' : '1.8rem', fontWeight: 800, fontFamily: 'monospace', color: '#10b981' }}>{cash.toLocaleString()} ₸</div>
                </div>
            </header>

            <main style={{ flex: 1, padding: isMobile ? '1.5rem' : '3rem', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', position: 'relative', zIndex: 5 }}>
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
                    <div style={{ position: 'absolute', top: '10%', right: '10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(255, 179, 90, 0.05) 0%, transparent 70%)', filter: 'blur(100px)' }} />
                </div>

                <AnimatePresence mode="wait">
                    {gameState === 'start' && (
                        <motion.div
                            key="start"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{ ...cardStyle, maxWidth: '600px', marginTop: isMobile ? '1rem' : '5vh' }}
                        >
                            <div style={{ fontSize: isMobile ? '3.5rem' : '6rem', marginBottom: '1.5rem' }}>🏦</div>
                            <h2 style={{ fontSize: isMobile ? '1.8rem' : '2.8rem', fontWeight: 900, marginBottom: '1rem', letterSpacing: '-1px' }}>Империя Маркета</h2>
                            <p style={{ color: '#94a3b8', fontSize: isMobile ? '0.95rem' : '1.1rem', lineHeight: 1.6, marginBottom: '2.5rem' }}>
                                У тебя есть <span style={{ color: '#ffb35a', fontWeight: 800 }}>10 ходов</span>, чтобы построить крупнейшую сеть.
                                Закупай по низкой, продавай по высокой, умей адаптироваться к рынку.
                            </p>
                            <button
                                onClick={startGame}
                                style={{ backgroundColor: '#ffb35a', color: '#050814', border: 'none', padding: isMobile ? '1.2rem 3rem' : '1.5rem 4rem', borderRadius: '20px', fontSize: isMobile ? '1.1rem' : '1.2rem', fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px', width: isMobile ? '100%' : 'auto', boxShadow: '0 10px 30px rgba(255, 179, 90, 0.3)' }}
                            >
                                ОТКРЫТЬ БИЗНЕС
                            </button>
                        </motion.div>
                    )}

                    {gameState === 'playing' && (
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '380px 1fr', gap: isMobile ? '1.5rem' : '3rem', width: '100%', maxWidth: '1200px', position: 'relative', zIndex: 10 }}>
                            {/* Dashboard Sidebar */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '1rem' : '1.5rem' }}>
                                <div style={{ backgroundColor: 'rgba(16, 21, 40, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', padding: isMobile ? '1.5rem' : '2rem', backdropFilter: 'blur(20px)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.65rem', color: '#8a90a4', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Статус склада</span>
                                        <span style={{ fontSize: '0.7rem', color: '#ffb35a', fontWeight: 900, backgroundColor: 'rgba(255,179,90,0.1)', padding: '0.3rem 0.8rem', borderRadius: '20px' }}>KVRT {turn}/10</span>
                                    </div>
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', alignItems: 'baseline' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>ТОВАРЫ</span>
                                            <span style={{ fontSize: '1.4rem', fontWeight: 900 }}>{inventory} шт.</span>
                                        </div>
                                        <div style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                                            <motion.div animate={{ width: `${Math.min((inventory / 200) * 100, 100)}%` }} style={{ height: '100%', backgroundColor: '#ffb35a', boxShadow: '0 0 10px rgba(255,179,90,0.3)' }} />
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>СВОБОДНЫЕ СРЕДСТВА</span>
                                            <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10b981' }}>{cash.toLocaleString()} ₸</span>
                                        </div>
                                    </div>
                                </div>

                                {event && (
                                    <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} style={{ backgroundColor: 'rgba(255, 179, 90, 0.08)', border: '1px solid rgba(255,179,90,0.3)', borderRadius: '24px', padding: isMobile ? '1.2rem' : '1.8rem', backdropFilter: 'blur(20px)' }}>
                                        <div style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', color: '#ffb35a', marginBottom: '0.6rem', letterSpacing: '1px' }}>⚡ ИНФОРМ-ПОВОД</div>
                                        <div style={{ fontSize: isMobile ? '1.1rem' : '1.3rem', fontWeight: 900, marginBottom: '0.4rem', color: '#fff' }}>{event.title}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.4 }}>{event.effect}</div>
                                    </motion.div>
                                )}

                                <div style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '24px', padding: isMobile ? '1.2rem' : '1.8rem', minHeight: isMobile ? 'auto' : '300px' }}>
                                    <div style={{ fontSize: '0.65rem', color: '#8a90a4', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1.2rem', letterSpacing: '1px' }}>Реестр транзакций</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                        {history.length === 0 && <div style={{ fontSize: '0.8rem', opacity: 0.3, textAlign: 'center', padding: '1rem' }}>Пока нет данных</div>}
                                        {history.map((h, i) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <span style={{ color: '#94a3b8', fontWeight: 600 }}>КВ {h.turn}</span>
                                                <span style={{ fontWeight: 800, color: h.profit > 0 ? '#10b981' : '#ef4444' }}>{h.profit > 0 ? '+' : ''}{h.profit.toLocaleString()} ₸</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Main Game Controls */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '1.5rem' : '2rem' }}>
                                <div style={{ backgroundColor: 'rgba(16, 21, 40, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '32px', padding: isMobile ? '1.5rem' : '3.5rem', backdropFilter: 'blur(30px)' }}>
                                    <h3 style={{ fontSize: isMobile ? '1.5rem' : '2.2rem', fontWeight: 900, marginBottom: isMobile ? '1.5rem' : '3rem', letterSpacing: '-0.5px' }}>Планирование периода</h3>

                                    <div style={{ marginBottom: isMobile ? '2rem' : '3.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.2rem', alignItems: 'flex-end' }}>
                                            <div>
                                                <div style={{ fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 800 }}>ЗАКУПКА ПАРТИИ</div>
                                                <div style={{ fontSize: '0.75rem', color: '#8a90a4', fontWeight: 600 }}>Себестоимость: 1,000 ₸</div>
                                            </div>
                                            <div style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 900, color: '#ffb35a' }}>{buyAmount} шт</div>
                                        </div>
                                        <input
                                            type="range" min="0" max={Math.floor(cash / 1000)} value={buyAmount}
                                            onChange={(e) => setBuyAmount(parseInt(e.target.value))}
                                            style={{ width: '100%', accentColor: '#ffb35a', height: '8px', cursor: 'pointer' }}
                                        />
                                    </div>

                                    <div style={{ marginBottom: isMobile ? '2.5rem' : '4rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.2rem', alignItems: 'flex-end' }}>
                                            <div>
                                                <div style={{ fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 800 }}>ЦЕНА РЕАЛИЗАЦИИ</div>
                                                <div style={{ fontSize: '0.75rem', color: '#8a90a4', fontWeight: 600 }}>Средняя: 2,500 ₸</div>
                                            </div>
                                            <div style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 900, color: '#ffb35a' }}>{priceHypothesis.toLocaleString()} ₸</div>
                                        </div>
                                        <input
                                            type="range" min="1500" max="5000" value={priceHypothesis} step="50"
                                            onChange={(e) => setPriceHypothesis(parseInt(e.target.value))}
                                            style={{ width: '100%', accentColor: '#ffb35a', height: '8px', cursor: 'pointer' }}
                                        />
                                    </div>

                                    <button
                                        onClick={nextTurn}
                                        style={{ width: '100%', padding: isMobile ? '1.2rem' : '1.8rem', backgroundColor: '#ffb35a', color: '#050814', border: 'none', borderRadius: '20px', fontSize: '1.2rem', fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '2px', boxShadow: '0 10px 30px rgba(255,179,90,0.2)' }}
                                    >
                                        ПОДТВЕРДИТЬ ПЛАН
                                    </button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isMobile ? '1rem' : '2rem' }}>
                                    <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: isMobile ? '1.2rem' : '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ fontSize: '0.65rem', fontWeight: 900, opacity: 0.4, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Тренды рынка</div>
                                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '80px' }}>
                                            {[40, 70, 45, 90, 65, 85, 60].map((h, i) => <div key={i} style={{ flex: 1, height: h + '%', backgroundColor: '#ffb35a', opacity: 0.2, borderRadius: '4px' }} />)}
                                        </div>
                                    </div>
                                    <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: isMobile ? '1.2rem' : '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: isMobile ? '1.5rem' : '2.5rem', fontWeight: 900 }}>{Math.floor(history.reduce((acc, h) => acc + h.sold, 0))}</div>
                                            <div style={{ fontSize: '0.6rem', fontWeight: 800, opacity: 0.4, textTransform: 'uppercase', letterSpacing: '1px' }}>Продано Итого</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {gameState === 'result' && (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{ ...cardStyle, maxWidth: '600px', margin: 'auto' }}
                        >
                            <div style={{ fontSize: isMobile ? '4rem' : '6rem', marginBottom: '1.5rem' }}>👑</div>
                            <h2 style={{ fontSize: isMobile ? '2rem' : '2.8rem', fontWeight: 900, marginBottom: '1rem', letterSpacing: '-1px' }}>Результаты Года</h2>
                            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', padding: isMobile ? '2rem' : '3.5rem', borderRadius: '32px', marginBottom: '2.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: 800, opacity: 0.5, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>ИТОГОВЫЙ КАПИТАЛ</div>
                                <div style={{ fontSize: isMobile ? '2.5rem' : '4.5rem', fontWeight: 900, color: '#10b981' }}>{cash.toLocaleString()} ₸</div>
                            </div>
                            <button
                                onClick={startGame}
                                style={{ backgroundColor: '#fff', color: '#050814', border: 'none', width: '100%', padding: '1.5rem', borderRadius: '20px', fontSize: '1.2rem', fontWeight: 900, cursor: 'pointer', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}
                            >
                                НОВЫЙ ЦИКЛ
                            </button>
                            <Link href="/games" style={{ textDecoration: 'none' }}>
                                <span style={{ color: '#8a90a4', fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>Вернуться в Академию</span>
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    )
}

const cardStyle = {
    backgroundColor: 'rgba(16, 21, 40, 0.6)',
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    padding: '3rem',
    textAlign: 'center',
    boxShadow: '0 18px 60px rgba(0,0,0,0.45)'
}
