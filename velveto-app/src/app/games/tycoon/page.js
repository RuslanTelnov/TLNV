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
    }

    const nextTurn = (buyAmount, price) => {
        const currentEvent = EVENTS[Math.floor(Math.random() * EVENTS.length)]
        const buyCost = buyAmount * 1000 * (currentEvent.buyImpact || 1)

        if (buyCost > cash) return alert('Недостаточно средств!')

        const baseDemand = Math.floor(Math.random() * 50) + 10
        const actualDemand = Math.floor(baseDemand * currentEvent.demandMultiplier)
        const soldAmount = Math.min(inventory + buyAmount, actualDemand)
        const revenue = soldAmount * price

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

        if (turn >= 10 || newCash <= 0) {
            setGameState('result')
        }
    }

    const containerStyle = {
        position: 'fixed',
        inset: 0,
        backgroundColor: '#050814',
        color: '#f5f5f5',
        fontFamily: "'Inter', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
    }

    const headerStyle = {
        padding: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        zIndex: 10
    }

    return (
        <div style={containerStyle}>
            <header style={headerStyle}>
                <BackButton href="/games" />
                <div style={{ textAlign: 'center' }}>
                    <h1 style={{ fontSize: '1.2rem', fontWeight: 300, letterSpacing: '0.3em', margin: 0, color: '#ffb35a' }}>MARKETPLACE TYCOON</h1>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.6rem', color: '#8a90a4', textTransform: 'uppercase' }}>Баланс</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'monospace', color: '#10b981' }}>{cash.toLocaleString()} ₸</div>
                </div>
            </header>

            <main style={{ flex: 1, overflowY: 'auto', padding: '3rem', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
                <AnimatePresence mode="wait">
                    {gameState === 'start' && (
                        <motion.div
                            key="start"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{ maxWidth: '600px', textAlign: 'center', backgroundColor: 'rgba(16, 21, 40, 0.6)', padding: '4rem', borderRadius: '32px', border: '1px solid rgba(255, 255, 255, 0.05)', marginTop: '5vh' }}
                        >
                            <div style={{ fontSize: '6rem', marginBottom: '2rem' }}>🏢</div>
                            <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>Бизнес-симулятор</h2>
                            <p style={{ color: '#c3c9d9', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '3rem' }}>
                                У тебя есть <span style={{ color: '#ffb35a', fontWeight: 'bold' }}>10 ходов</span>, чтобы превратить 100,000 в миллионы.
                                Закупай товар, следи за рынком и устанавливай правильную цену.
                            </p>
                            <button
                                onClick={startGame}
                                style={{ backgroundColor: '#ffb35a', color: '#050814', border: 'none', padding: '1.5rem 4rem', borderRadius: '18px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase' }}
                            >
                                Начать бизнес
                            </button>
                        </motion.div>
                    )}

                    {gameState === 'playing' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 400px) minmax(500px, 800px)', gap: '3rem', width: '100%', maxWidth: '1300px' }}>
                            {/* Sidebar */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '24px', padding: '2rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                        <span style={{ fontSize: '0.7rem', color: '#8a90a4', fontWeight: 'bold', textTransform: 'uppercase' }}>Ресурсы</span>
                                        <span style={{ fontSize: '0.7rem', color: '#ffb35a', fontWeight: 'bold' }}>ХОД {turn}/10</span>
                                    </div>
                                    <div style={{ marginBottom: '2rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>ТОВАР НА СКЛАДЕ</span>
                                            <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>{inventory} шт.</span>
                                        </div>
                                        <div style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                                            <div style={{ height: '100%', width: `${Math.min(inventory, 100)}%`, backgroundColor: '#ffb35a' }} />
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>НАЛИЧНОСТЬ</span>
                                            <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10b981' }}>{cash.toLocaleString()} ₸</span>
                                        </div>
                                    </div>
                                </div>

                                {event && (
                                    <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} style={{ backgroundColor: 'rgba(255, 179, 90, 0.05)', border: '1px solid #ffb35a', borderRadius: '24px', padding: '2rem' }}>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#ffb35a', marginBottom: '0.5rem' }}>⚡ Событие</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>{event.title}</div>
                                        <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>{event.effect}</div>
                                    </motion.div>
                                )}

                                <div style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '24px', padding: '2rem', minHeight: '300px' }}>
                                    <div style={{ fontSize: '0.7rem', color: '#8a90a4', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '1.5rem' }}>История сделок</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {history.map((h, i) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                                                <span>Хол {h.turn}</span>
                                                <span style={{ fontWeight: 700, color: h.profit > 0 ? '#10b981' : '#ef4444' }}>{h.profit > 0 ? '+' : ''}{h.profit.toLocaleString()} ₸</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Main Actions */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '32px', padding: '3.5rem' }}>
                                    <h3 style={{ fontSize: '2rem', marginBottom: '3rem' }}>Стратегия на ход</h3>

                                    <div style={{ marginBottom: '3.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                            <div>
                                                <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>ЗАКУПИТЬ ПАРТИЮ</div>
                                                <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>Цена закупка: 1,000 ₸</div>
                                            </div>
                                            <div id="buy-val-display" style={{ fontSize: '2rem', fontWeight: 700, color: '#ffb35a' }}>0 шт.</div>
                                        </div>
                                        <input
                                            type="range" min="0" max={Math.floor(cash / 1000)} defaultValue="0"
                                            onChange={(e) => document.getElementById('buy-val-display').innerText = e.target.value + ' шт.'}
                                            id="buy-slider"
                                            style={{ width: '100%', accentColor: '#ffb35a' }}
                                        />
                                    </div>

                                    <div style={{ marginBottom: '4rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                            <div>
                                                <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>ЦЕНА ПРОДАЖИ</div>
                                                <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>Средняя по рынку: 2,500 ₸</div>
                                            </div>
                                            <div id="price-val-display" style={{ fontSize: '2rem', fontWeight: 700, color: '#ffb35a' }}>2,500 ₸</div>
                                        </div>
                                        <input
                                            type="range" min="1500" max="5000" defaultValue="2500"
                                            onChange={(e) => document.getElementById('price-val-display').innerText = parseInt(e.target.value).toLocaleString() + ' ₸'}
                                            id="price-slider"
                                            style={{ width: '100%', accentColor: '#ffb35a' }}
                                        />
                                    </div>

                                    <button
                                        onClick={() => {
                                            const buy = parseInt(document.getElementById('buy-slider').value)
                                            const price = parseInt(document.getElementById('price-slider').value)
                                            nextTurn(buy, price)
                                        }}
                                        style={{ width: '100%', padding: '1.8rem', backgroundColor: '#ffb35a', color: '#050814', border: 'none', borderRadius: '18px', fontSize: '1.2rem', fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase' }}
                                    >
                                        ЗАКОНЧИТЬ ХОД
                                    </button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                    <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ fontSize: '0.6rem', opacity: 0.5, marginBottom: '1rem', textTransform: 'uppercase' }}>Тренды рынка</div>
                                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '100px' }}>
                                            {[40, 70, 45, 90, 65, 85, 60].map((h, i) => <div key={i} style={{ flex: 1, height: h + '%', backgroundColor: '#ffb35a', opacity: 0.2, borderRadius: '4px' }} />)}
                                        </div>
                                    </div>
                                    <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{Math.floor(history.reduce((acc, h) => acc + h.sold, 0))}</div>
                                            <div style={{ fontSize: '0.6rem', opacity: 0.5, textTransform: 'uppercase' }}>Продано всего</div>
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
                            <div style={{ fontSize: '6rem', marginBottom: '2rem' }}>🏆</div>
                            <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>Итоги финансового года</h2>
                            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '3rem', borderRadius: '24px', marginBottom: '3rem' }}>
                                <div style={{ fontSize: '0.8rem', opacity: 0.5, marginBottom: '1rem' }}>ИТОГОВЫЙ КАПИТАЛ</div>
                                <div style={{ fontSize: '4rem', fontWeight: 800, color: '#10b981' }}>{cash.toLocaleString()} ₸</div>
                            </div>
                            <button
                                onClick={startGame}
                                style={{ backgroundColor: '#fff', color: '#050814', border: 'none', width: '100%', padding: '1.5rem', borderRadius: '18px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', marginBottom: '1.5rem' }}
                            >
                                Начать заново
                            </button>
                            <Link href="/games">
                                <span style={{ color: '#8a90a4', cursor: 'pointer' }}>Вернуться в Академию</span>
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
