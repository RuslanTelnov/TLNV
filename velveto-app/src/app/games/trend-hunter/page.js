'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import BackButton from '@/components/BackButton'
import confetti from 'canvas-confetti'

const CATEGORIES = [
    { id: 'electronics', name: 'Электроника', icon: '📱', color: '#3b82f6' },
    { id: 'home', name: 'Дом и Сад', icon: '🏠', color: '#10b981' },
    { id: 'beauty', name: 'Красота', icon: '💄', color: '#ec4899' },
    { id: 'auto', name: 'Автотовары', icon: '🚗', color: '#f59e0b' }
]

const TOOLS = [
    { id: 'spy', name: 'Шпион конкурентов', cost: 1, description: 'Показывает объем продаж за месяц' },
    { id: 'radar', name: 'Радар спроса', cost: 1, description: 'Показывает динамику запросов' },
    { id: 'calc', name: 'Калькулятор маржи', cost: 1, description: 'Показывает чистый доход' }
]

export default function TrendHunter() {
    const [gameState, setGameState] = useState('start')
    const [credits, setCredits] = useState(10)
    const [budget, setBudget] = useState(5000000)
    const [products, setProducts] = useState([])
    const [selectedProducts, setSelectedProducts] = useState([])
    const [revelations, setRevelations] = useState({}) // productIndex -> { revealedStats: [] }

    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const generateProducts = () => {
        const items = [
            { name: 'Массажер для шеи', cat: 'beauty', potential: 'high', baseSales: 1200, margin: 45, trend: 15 },
            { name: 'RGB Лампа', cat: 'home', potential: 'low', baseSales: 400, margin: 20, trend: -5 },
            { name: 'Держатель для тел.', cat: 'auto', potential: 'medium', baseSales: 800, margin: 30, trend: 5 },
            { name: 'TWS Наушники', cat: 'electronics', potential: 'unicorn', baseSales: 3500, margin: 12, trend: 40 },
            { name: 'Увлажнитель воздуха', cat: 'home', potential: 'high', baseSales: 1500, margin: 35, trend: 25 },
            { name: 'Чехол с подогревом', cat: 'auto', potential: 'low', baseSales: 100, margin: 60, trend: 0 },
            { name: 'Сыворотка 24k Gold', cat: 'beauty', potential: 'unicorn', baseSales: 2800, margin: 70, trend: 50 },
            { name: 'Умная розетка', cat: 'electronics', potential: 'medium', baseSales: 600, margin: 25, trend: 10 }
        ]
        return items.sort(() => Math.random() - 0.5).slice(0, 6)
    }

    const startGame = () => {
        setProducts(generateProducts())
        setCredits(10)
        setSelectedProducts([])
        setRevelations({})
        setGameState('scouting')
    }

    const useTool = (prodIdx, toolId) => {
        if (credits <= 0) return alert('Кончились лимиты на сканирование!')

        setCredits(c => c - 1)
        setRevelations(prev => {
            const current = prev[prodIdx] || { revealed: [] }
            return {
                ...prev,
                [prodIdx]: {
                    ...current,
                    revealed: [...current.revealed, toolId]
                }
            }
        })
    }

    const selectProduct = (prod) => {
        if (selectedProducts.find(p => p.name === prod.name)) {
            setSelectedProducts(selectedProducts.filter(p => p.name !== prod.name))
        } else {
            if (selectedProducts.length >= 3) return alert('Можно выбрать только 3 товара для запуска!')
            setSelectedProducts([...selectedProducts, prod])
        }
    }

    const finishScouting = () => {
        if (selectedProducts.length < 3) return alert('Выберите 3 товара для анализа рынка!')
        setGameState('result')

        const totalProfit = selectedProducts.reduce((acc, p) => {
            const growth = 1 + (p.trend / 100)
            const units = p.baseSales * growth
            return acc + (units * (p.margin * 10)) // Arbitrary profit multiplier
        }, 0)

        const hasUnicorn = selectedProducts.some(p => p.potential === 'unicorn')
        if (hasUnicorn) {
            confetti({
                particleCount: 200,
                spread: 100,
                origin: { y: 0.6 }
            })
        }
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#050814', color: '#fff', padding: isMobile ? '1.5rem' : '3rem', fontFamily: 'Inter, sans-serif' }}>
            <header style={{ maxWidth: '1200px', margin: isMobile ? '0 auto 1.5rem auto' : '0 auto 3rem auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <BackButton href="/games" />
                <div style={{ textAlign: 'right' }}>
                    {!isMobile && <div style={{ color: '#8a90a4', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px' }}>AI SCANNER v4.1</div>}
                    <div style={{ fontSize: isMobile ? '1rem' : '1.2rem', fontWeight: 700, color: '#ec4899' }}>Trend Hunter</div>
                </div>
            </header>

            <main style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <AnimatePresence mode="wait">
                    {gameState === 'start' && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', padding: isMobile ? '2rem 0' : '5rem 0' }}>
                            <div style={{ fontSize: isMobile ? '3.5rem' : '6rem', marginBottom: '1.5rem' }}>🛰️</div>
                            <h1 style={{ fontSize: isMobile ? '1.8rem' : '3rem', fontWeight: 900, marginBottom: '1rem' }}>Охотник за Трендами</h1>
                            <p style={{ color: '#8a90a4', fontSize: isMobile ? '1rem' : '1.2rem', maxWidth: '600px', margin: '0 auto 2.5rem auto', lineHeight: 1.6 }}>
                                Ваша задача — найти 3 «Золотых» товара. У вас ограниченные лимиты на сканирование данных. Думайте как аналитик.
                            </p>
                            <button onClick={startGame} style={{ backgroundColor: '#ec4899', color: '#fff', border: 'none', padding: isMobile ? '1.2rem 2rem' : '1.5rem 4rem', borderRadius: '20px', fontSize: isMobile ? '1.1rem' : '1.2rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 10px 30px rgba(236, 72, 153, 0.3)', width: isMobile ? '100%' : 'auto' }}>
                                ЗАПУСТИТЬ СКАНЕР
                            </button>
                        </motion.div>
                    )}

                    {gameState === 'scouting' && (
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 320px', gap: isMobile ? '1.5rem' : '3rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '1rem' : '2rem' }}>
                                {products.map((p, idx) => {
                                    const isSelected = selectedProducts.find(sp => sp.name === p.name)
                                    const rev = revelations[idx]?.revealed || []
                                    return (
                                        <motion.div
                                            key={idx}
                                            whileHover={isMobile ? {} : { y: -5 }}
                                            style={{
                                                backgroundColor: 'rgba(255,255,255,0.02)',
                                                border: `2px solid ${isSelected ? '#ec4899' : 'rgba(255,255,255,0.05)'}`,
                                                borderRadius: '32px',
                                                padding: isMobile ? '1.5rem' : '2rem',
                                                position: 'relative',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease'
                                            }}
                                            onClick={() => selectProduct(p)}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                                <span style={{ fontSize: isMobile ? '1.5rem' : '2rem' }}>{CATEGORIES.find(c => c.id === p.cat).icon}</span>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    {TOOLS.map(t => (
                                                        <button
                                                            key={t.id}
                                                            onClick={(e) => { e.stopPropagation(); useTool(idx, t.id); }}
                                                            disabled={rev.includes(t.id)}
                                                            style={{
                                                                width: isMobile ? '36px' : '32px', height: isMobile ? '36px' : '32px', borderRadius: '8px',
                                                                border: 'none', backgroundColor: rev.includes(t.id) ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                                                                cursor: 'pointer', fontSize: isMobile ? '0.8rem' : '0.7rem'
                                                            }}
                                                            title={t.name}
                                                        >
                                                            {t.id === 'spy' ? '👁️' : t.id === 'radar' ? '📡' : '💰'}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <h3 style={{ fontSize: isMobile ? '1.2rem' : '1.4rem', fontWeight: 800, marginBottom: '0.8rem' }}>{p.name}</h3>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                                <StatRow label="Продажи" value={rev.includes('spy') ? `${p.baseSales} шт` : '??'} isMobile={isMobile} />
                                                <StatRow label="Тренд" value={rev.includes('radar') ? `${p.trend > 0 ? '+' : ''}${p.trend}%` : '??'} color={p.trend > 0 ? '#10b981' : '#ef4444'} isMobile={isMobile} />
                                                <StatRow label="Маржа" value={rev.includes('calc') ? `${p.margin}%` : '??'} isMobile={isMobile} />
                                            </div>

                                            {isSelected && (
                                                <div style={{ position: 'absolute', top: '1rem', right: '1rem', color: '#ec4899', fontSize: '1.2rem' }}>✅</div>
                                            )}
                                        </motion.div>
                                    )
                                })}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '1.5rem' : '2rem' }}>
                                <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: isMobile ? '1.5rem' : '2rem', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ fontSize: '0.6rem', color: '#8a90a4', marginBottom: '0.5rem', letterSpacing: '1px', textTransform: 'uppercase' }}>Лимиты сканера</div>
                                    <div style={{ fontSize: isMobile ? '2rem' : '3rem', fontWeight: 900, color: credits > 2 ? '#fff' : '#ef4444' }}>{credits}</div>
                                    <div style={{ marginTop: '0.8rem', fontSize: '0.75rem', color: '#8a90a4', lineHeight: 1.4 }}>Активируйте инструменты на карточках выше.</div>
                                </div>

                                <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.01)', padding: isMobile ? '1.5rem' : '2rem', borderRadius: '32px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                    <h4 style={{ fontSize: '0.7rem', marginBottom: '1rem', opacity: 0.5 }}>ВЫБРАНО ({selectedProducts.length}/3)</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                        {selectedProducts.map((p, i) => (
                                            <div key={i} style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ec4899' }}>⚡ {p.name}</div>
                                        ))}
                                        {selectedProducts.length === 0 && <div style={{ fontSize: '0.8rem', opacity: 0.3 }}>Товары не выбраны</div>}
                                    </div>
                                </div>

                                <button
                                    onClick={finishScouting}
                                    style={{
                                        backgroundColor: selectedProducts.length === 3 ? '#ec4899' : 'rgba(255,255,255,0.05)',
                                        color: selectedProducts.length === 3 ? '#fff' : '#444',
                                        border: 'none', padding: isMobile ? '1.2rem' : '1.8rem', borderRadius: '24px', fontSize: '1rem', fontWeight: 900,
                                        cursor: selectedProducts.length === 3 ? 'pointer' : 'not-allowed', width: '100%'
                                    }}
                                >
                                    ЗАПУСТИТЬ ПРОДАЖИ
                                </button>
                            </div>
                        </div>
                    )}

                    {gameState === 'result' && (
                        <div style={{ textAlign: 'center', padding: isMobile ? '1rem' : '3rem' }}>
                            <h2 style={{ fontSize: isMobile ? '2rem' : '3rem', fontWeight: 900, marginBottom: '2rem' }}>Анализ рынка</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? '1rem' : '2rem', marginBottom: '3rem' }}>
                                {selectedProducts.map((p, i) => (
                                    <div key={i} style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: isMobile ? '1.5rem' : '2.5rem', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ fontSize: isMobile ? '2.5rem' : '3rem', marginBottom: '1rem' }}>{p.potential === 'unicorn' ? '🦄' : p.potential === 'high' ? '🔥' : p.potential === 'medium' ? '📈' : '💩'}</div>
                                        <h3 style={{ fontSize: isMobile ? '1.1rem' : '1.2rem', marginBottom: '1rem' }}>{p.name}</h3>
                                        <div style={{ fontSize: '0.65rem', color: '#8a90a4', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Итог запуска</div>
                                        <div style={{ fontSize: isMobile ? '1.3rem' : '1.5rem', fontWeight: 800, color: p.potential.includes('unicorn') || p.potential === 'high' ? '#10b981' : '#ef4444' }}>
                                            {p.potential === 'unicorn' ? 'Единорог!' : p.potential === 'high' ? 'Хит' : p.potential === 'medium' ? 'Средне' : 'Провал'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={startGame} style={{ backgroundColor: '#fff', color: '#050814', border: 'none', padding: isMobile ? '1.2rem 3rem' : '1.5rem 4rem', borderRadius: '18px', fontSize: '1.1rem', fontWeight: 800, cursor: 'pointer', width: isMobile ? '100%' : 'auto' }}>ЕЩЕ РАЗ</button>
                        </div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    )
}

function StatRow({ label, value, color, isMobile }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: isMobile ? '0.8rem' : '0.9rem' }}>
            <span style={{ color: '#8a90a4' }}>{label}</span>
            <span style={{ fontWeight: 700, color: color || '#fff' }}>{value}</span>
        </div>
    )
}
