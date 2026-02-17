'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import BackButton from '@/components/BackButton'
import confetti from 'canvas-confetti'

const TAX_RATE = 0.06
const BASE_CONVERSION = 0.04
const RETURN_RATE = 0.12 // 12% returns

export default function PLArchitect() {
    const [gameState, setGameState] = useState('start')
    const [month, setMonth] = useState(1)

    // Sliders
    const [price, setPrice] = useState(1500)
    const [adBudget, setAdBudget] = useState(80000)
    const [cpc, setCpc] = useState(25)

    // Fixed Costs
    const [unitCost, setUnitCost] = useState(400)
    const [fulfillment, setFulfillment] = useState(120)

    // Advanced Logic: Diminishing returns on Ad Spend
    // The more you spend, the more expensive the acquisition becomes
    const saturationPoint = 150000
    const saturationFactor = adBudget > saturationPoint ? Math.pow(adBudget / saturationPoint, 1.3) : 1
    const effectiveAdBudget = adBudget / saturationFactor

    const traffic = Math.floor(effectiveAdBudget / cpc)
    const orders = Math.floor(traffic * BASE_CONVERSION)

    // Returns logic
    const successfulSales = Math.floor(orders * (1 - RETURN_RATE))
    const returnsCount = orders - successfulSales
    const returnProcessingFee = 150 // Cost of shipping back + check

    const revenue = successfulSales * price
    const marketplaceFee = revenue * 0.15 // 15% commission
    const fulfillmentTotal = orders * fulfillment + returnsCount * returnProcessingFee
    const costOfGoods = orders * unitCost
    const taxTotal = revenue * TAX_RATE

    const netProfit = revenue - marketplaceFee - fulfillmentTotal - costOfGoods - adBudget - taxTotal
    const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0
    const roi = adBudget > 0 ? (netProfit / adBudget) * 100 : 0

    const isSuccess = netProfit > 250000 && margin > 15 && roi > 50

    const handleAction = () => {
        if (isSuccess) {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 }
            })
            setGameState('result')
        }
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#050814', color: '#fff', padding: '3rem', fontFamily: 'Inter, sans-serif' }}>
            <header style={{ maxWidth: '1200px', margin: '0 auto 3rem auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <BackButton href="/games" />
                <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#8a90a4', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Professional Grade</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#3b82f6' }}>P&L Architect 2.0</div>
                </div>
            </header>

            <main style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {gameState === 'start' && (
                    <div style={{ textAlign: 'center', padding: '5rem 0' }}>
                        <div style={{ fontSize: '6rem', marginBottom: '2rem' }}>📈</div>
                        <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1.5rem' }}>Архитектор Юнит-Экономики</h1>
                        <p style={{ color: '#8a90a4', maxWidth: '750px', margin: '0 auto 3rem auto', fontSize: '1.2rem', lineHeight: '1.8' }}>
                            Ваша задача — масштабировать бренд до прибыли 250,000₽ в месяц.
                            Помните: бесконечный рекламный бюджет ведет к выгоранию аудитории и росту стоимости заказа.
                            Учтите возвраты (12%) и налоги.
                        </p>
                        <button onClick={() => setGameState('playing')} style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '1.5rem 4rem', borderRadius: '20px', fontSize: '1.2rem', fontWeight: 800, cursor: 'pointer' }}>
                            НАЧАТЬ РАСЧЕТ
                        </button>
                    </div>
                )}

                {gameState === 'playing' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '3rem' }}>
                        {/* Terminal */}
                        <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.05)', padding: '3.5rem', backdropFilter: 'blur(30px)' }}>
                            <h2 style={{ fontSize: '1.8rem', marginBottom: '2.5rem', fontWeight: 800 }}>Операционный отчет</h2>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                <DataItem label="Продажи (успешные)" value={`${successfulSales} шт / ${revenue.toLocaleString()} ₽`} color="#fff" />
                                <DataItem label="Возвраты (Ozon/WB)" value={`${returnsCount} шт (-${(returnsCount * returnProcessingFee).toLocaleString()} ₽)`} color="#ef4444" isNegative />
                                <DataItem label="Маркетинг (Эффективный)" value={`-${adBudget.toLocaleString()} ₽ ${saturationFactor > 1 ? '(Выгорание!)' : ''}`} color={saturationFactor > 1.2 ? '#ef4444' : '#fff'} isNegative />
                                <DataItem label="Логистика и хранение" value={`-${fulfillmentTotal.toLocaleString()} ₽`} color="#ef4444" isNegative />
                                <DataItem label="Закупка товара" value={`-${costOfGoods.toLocaleString()} ₽`} color="#ef4444" isNegative />

                                <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '1.5rem 0' }} />

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', color: '#8a90a4', marginBottom: '0.5rem' }}>ЧИСТАЯ ПРИБЫЛЬ</div>
                                        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: netProfit > 0 ? '#10b981' : '#ef4444' }}>
                                            {Math.floor(netProfit).toLocaleString()} ₽
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.7rem', color: '#8a90a4', marginBottom: '0.5rem' }}>ROI МАРКЕТИНГА</div>
                                        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: roi > 50 ? '#3b82f6' : '#fff' }}>{Math.floor(roi)}%</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Controls */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div style={{ backgroundColor: '#3b82f6', color: '#fff', padding: '2rem', borderRadius: '32px', border: '4px solid rgba(255,255,255,0.1)' }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 800, opacity: 0.8, marginBottom: '0.5rem' }}>ЦЕЛЬ К ПФОРМИРОВАНИЮ</div>
                                <div style={{ fontSize: '2rem', fontWeight: 900 }}>250,000 ₽ <span style={{ fontSize: '1rem', fontWeight: 400, opacity: 0.6 }}>/ мес</span></div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem', backgroundColor: 'rgba(255,255,255,0.03)', padding: '2.5rem', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <ControlSlider label="Цена продажи" value={price} min={800} max={6000} onChange={setPrice} unit="₽" />
                                <ControlSlider label="Бюджет рекламы" value={adBudget} min={10000} max={500000} onChange={setAdBudget} unit="₽" />
                                <ControlSlider label="Ставка CPC" value={cpc} min={10} max={100} onChange={setCpc} unit="₽" />
                            </div>

                            <button
                                onClick={handleAction}
                                style={{
                                    backgroundColor: isSuccess ? '#10b981' : 'rgba(255,255,255,0.05)',
                                    color: isSuccess ? '#050814' : '#4b5563',
                                    border: 'none',
                                    padding: '1.8rem',
                                    borderRadius: '24px',
                                    fontSize: '1.2rem',
                                    fontWeight: 900,
                                    cursor: isSuccess ? 'pointer' : 'not-allowed',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: isSuccess ? '0 0 30px rgba(16, 185, 129, 0.4)' : 'none'
                                }}
                            >
                                УТВЕРДИТЬ СТРАТЕГИЮ
                            </button>

                            {!isSuccess && (
                                <div style={{ fontSize: '0.85rem', color: '#8a90a4', textAlign: 'center', lineHeight: '1.5' }}>
                                    Требования: Маржа {'>'} 15%, ROI {'>'} 50%, <br />Прибыль {'>'} 250к
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Modal Result */}
                <AnimatePresence>
                    {gameState === 'result' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(5,8,20,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                style={{ backgroundColor: '#102040', padding: '4rem', borderRadius: '40px', textAlign: 'center', maxWidth: '500px', border: '1px solid rgba(255,255,255,0.1)' }}
                            >
                                <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>🎯</div>
                                <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem' }}>Модель утверждена!</h2>
                                <p style={{ color: '#8a90a4', marginBottom: '2.5rem' }}>Вы создали устойчивую бизнес-модель. Ваша чистая прибыль составит {Math.floor(netProfit).toLocaleString()} ₽.</p>
                                <button onClick={() => window.location.reload()} style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '1.2rem 3rem', borderRadius: '16px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer' }}>ЕЩЕ РАЗ</button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    )
}

function DataItem({ label, value, color, isNegative }) {
    const displayValue = typeof value === 'number'
        ? `${isNegative ? '-' : ''}${Math.abs(Math.floor(value)).toLocaleString()} ₽`
        : value
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#8a90a4', fontSize: '0.9rem' }}>{label}</span>
            <span style={{ fontWeight: 600, color: color }}>{displayValue}</span>
        </div>
    )
}

function ControlSlider({ label, value, min, max, onChange }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700 }}>
                <span style={{ color: '#8a90a4' }}>{label}</span>
                <span>{value.toLocaleString()}</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#3b82f6', cursor: 'pointer' }}
            />
        </div>
    )
}
