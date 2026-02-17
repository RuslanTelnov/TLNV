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
        <div style={{ minHeight: '100vh', backgroundColor: '#050814', color: '#fff', padding: '3rem', fontFamily: 'Inter, sans-serif' }}>
            <header style={{ maxWidth: '1200px', margin: '0 auto 3rem auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <BackButton href="/games" />
                <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#8a90a4', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px' }}>AI SCANNER v4.1</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ec4899' }}>Trend Hunter</div>
                </div>
            </header>

            <main style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <AnimatePresence mode="wait">
                    {gameState === 'start' && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', padding: '5rem 0' }}>
                            <div style={{ fontSize: '6rem', marginBottom: '2rem' }}>🛰️</div>
                            <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1.5rem' }}>Охотник за Трендами</h1>
                            <p style={{ color: '#8a90a4', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 3rem auto' }}>
                                Ваша задача — найти 3 «Золотых» товара. У вас ограниченные лимиты на сканирование данных. Думайте как аналитик.
                            </p>
                            <button onClick={startGame} style={{ backgroundColor: '#ec4899', color: '#fff', border: 'none', padding: '1.5rem 4rem', borderRadius: '20px', fontSize: '1.2rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 10px 30px rgba(236, 72, 153, 0.3)' }}>
                                ЗАПУСТИТЬ СКАНЕР
                            </button>
                        </motion.div>
                    )}

                    {gameState === 'scouting' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '3rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                {products.map((p, idx) => {
                                    const isSelected = selectedProducts.find(sp => sp.name === p.name)
                                    const rev = revelations[idx]?.revealed || []
                                    return (
                                        <motion.div
                                            key={idx}
                                            whileHover={{ y: -5 }}
                                            style={{
                                                backgroundColor: 'rgba(255,255,255,0.02)',
                                                border: `2px solid ${isSelected ? '#ec4899' : 'rgba(255,255,255,0.05)'}`,
                                                borderRadius: '32px',
                                                padding: '2rem',
                                                position: 'relative',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease'
                                            }}
                                            onClick={() => selectProduct(p)}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                                <span style={{ fontSize: '2rem' }}>{CATEGORIES.find(c => c.id === p.cat).icon}</span>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    {TOOLS.map(t => (
                                                        <button
                                                            key={t.id}
                                                            onClick={(e) => { e.stopPropagation(); useTool(idx, t.id); }}
                                                            disabled={rev.includes(t.id)}
                                                            style={{
                                                                width: '32px', height: '32px', borderRadius: '8px',
                                                                border: 'none', backgroundColor: rev.includes(t.id) ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                                                                cursor: 'pointer', fontSize: '0.7rem'
                                                            }}
                                                            title={t.name}
                                                        >
                                                            {t.id === 'spy' ? '👁️' : t.id === 'radar' ? '📡' : '💰'}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1rem' }}>{p.name}</h3>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                                <StatRow label="Продажи" value={rev.includes('spy') ? `${p.baseSales} шт` : '??'} />
                                                <StatRow label="Тренд" value={rev.includes('radar') ? `${p.trend > 0 ? '+' : ''}${p.trend}%` : '??'} color={p.trend > 0 ? '#10b981' : '#ef4444'} />
                                                <StatRow label="Маржа" value={rev.includes('calc') ? `${p.margin}%` : '??'} />
                                            </div>

                                            {isSelected && (
                                                <div style={{ position: 'absolute', top: '1rem', right: '1rem', color: '#ec4899' }}>✅</div>
                                            )}
                                        </motion.div>
                                    )
                                })}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ fontSize: '0.7rem', color: '#8a90a4', marginBottom: '0.5rem', letterSpacing: '1px' }}>ЛИМИТЫ СКАНЕРА</div>
                                    <div style={{ fontSize: '3rem', fontWeight: 900, color: credits > 2 ? '#fff' : '#ef4444' }}>{credits}</div>
                                    <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#8a90a4' }}>Используйте инструменты на карточках, чтобы узнать потенциал.</div>
                                </div>

                                <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.01)', padding: '2rem', borderRadius: '32px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                    <h4 style={{ fontSize: '0.8rem', marginBottom: '1.5rem', opacity: 0.5 }}>ВЫБРАНО ({selectedProducts.length}/3):</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {selectedProducts.map((p, i) => (
                                            <div key={i} style={{ fontSize: '0.9rem', fontWeight: 600 }}>{p.name}</div>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={finishScouting}
                                    style={{
                                        backgroundColor: selectedProducts.length === 3 ? '#ec4899' : 'rgba(255,255,255,0.05)',
                                        color: selectedProducts.length === 3 ? '#fff' : '#444',
                                        border: 'none', padding: '1.8rem', borderRadius: '24px', fontSize: '1rem', fontWeight: 900,
                                        cursor: selectedProducts.length === 3 ? 'pointer' : 'not-allowed'
                                    }}
                                >
                                    ЗАПУСТИТЬ ПРОДАЖИ
                                </button>
                            </div>
                        </div>
                    )}

                    {gameState === 'result' && (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                            <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '2rem' }}>Результаты Запуска</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', marginBottom: '4rem' }}>
                                {selectedProducts.map((p, i) => (
                                    <div key={i} style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '2.5rem', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{p.potential === 'unicorn' ? '🦄' : p.potential === 'high' ? '🔥' : p.potential === 'medium' ? '📈' : '💩'}</div>
                                        <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>{p.name}</h3>
                                        <div style={{ fontSize: '0.7rem', color: '#8a90a4', marginBottom: '0.5rem' }}>ИТОГ:</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: p.potential.includes('unicorn') || p.potential === 'high' ? '#10b981' : '#ef4444' }}>
                                            {p.potential === 'unicorn' ? 'Единорог!' : p.potential === 'high' ? 'Хит Продаж' : p.potential === 'medium' ? 'Средне' : 'Провал'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={startGame} style={{ backgroundColor: '#fff', color: '#050814', border: 'none', padding: '1.5rem 4rem', borderRadius: '18px', fontSize: '1.1rem', fontWeight: 800, cursor: 'pointer' }}>ЕЩЕ РАЗ</button>
                        </div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    )
}

function StatRow({ label, value, color }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
            <span style={{ color: '#8a90a4' }}>{label}</span>
            <span style={{ fontWeight: 700, color: color || '#fff' }}>{value}</span>
        </div>
    )
}
