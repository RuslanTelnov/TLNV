'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import BackButton from '@/components/BackButton'
import confetti from 'canvas-confetti'

const TAX_RATE = 0.06 // 6% USN
const AD_CONVERSION = 0.03 // 3% average conversion

export default function PLArchitect() {
    const [gameState, setGameState] = useState('start')
    const [targetProfit, setTargetProfit] = useState(150000)

    // Sliders
    const [price, setPrice] = useState(1200)
    const [adBudget, setAdBudget] = useState(50000)
    const [cpc, setCpc] = useState(15)
    const [unitCost, setUnitCost] = useState(450)
    const [fulfillment, setFulfillment] = useState(80)
    const [commission, setCommission] = useState(15) // 15%

    // Calculations
    const salesVolume = Math.floor((adBudget / cpc) * AD_CONVERSION)
    const revenue = salesVolume * price
    const marketplaceFee = revenue * (commission / 100)
    const fulfillmentTotal = salesVolume * fulfillment
    const costOfGoods = salesVolume * unitCost
    const taxTotal = revenue * TAX_RATE
    const netProfit = revenue - marketplaceFee - fulfillmentTotal - costOfGoods - adBudget - taxTotal
    const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0

    const isSuccess = netProfit >= targetProfit && margin > 10

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
                    <div style={{ color: '#8a90a4', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Миссия</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#3b82f6' }}>Архитектор P&L</div>
                </div>
            </header>

            <main style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 400px', gap: '3rem' }}>
                {/* Visual Terminal */}
                <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)', padding: '3rem', backdropFilter: 'blur(20px)' }}>
                    <h2 style={{ fontSize: '2rem', marginBottom: '2rem', fontWeight: 800 }}>Структура отчета (P&L)</h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <DataItem label="Выручка" value={revenue} color="#fff" />
                        <DataItem label="Налог (6%)" value={-taxTotal} color="#ef4444" isNegative />
                        <DataItem label="Комиссия маркетплейса" value={-marketplaceFee} color="#ef4444" isNegative />
                        <DataItem label="Логистика и фулфилмент" value={-fulfillmentTotal} color="#ef4444" isNegative />
                        <DataItem label="Себестоимость товара" value={-costOfGoods} color="#ef4444" isNegative />
                        <DataItem label="Рекламный бюджет" value={-adBudget} color="#ef4444" isNegative />

                        <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '1rem 0' }} />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <div>
                                <div style={{ fontSize: '0.8rem', color: '#8a90a4' }}>ЧИСТАЯ ПРИБЫЛЬ</div>
                                <div style={{ fontSize: '3.5rem', fontWeight: 900, color: netProfit > 0 ? '#10b981' : '#ef4444' }}>
                                    {Math.floor(netProfit).toLocaleString()} ₽
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.8rem', color: '#8a90a4' }}>МАРЖИНАЛЬНОСТЬ</div>
                                <div style={{ fontSize: '2rem', fontWeight: 800 }}>{margin.toFixed(1)}%</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div style={{ backgroundColor: '#10b981', color: '#050814', padding: '2rem', borderRadius: '24px' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 800, opacity: 0.8 }}>ЦЕЛЬ ПО ПРИБЫЛИ</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 900 }}>{targetProfit.toLocaleString()} ₽</div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', backgroundColor: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '24px' }}>
                        <ControlSlider label="Розничная цена (₽)" value={price} min={500} max={5000} onChange={setPrice} />
                        <ControlSlider label="Рекламный бюджет (₽)" value={adBudget} min={10000} max={300000} onChange={setAdBudget} />
                        <ControlSlider label="Стоимость клика CPC (₽)" value={cpc} min={5} max={50} onChange={setCpc} />
                    </div>

                    <button
                        onClick={handleAction}
                        style={{
                            backgroundColor: isSuccess ? '#3b82f6' : 'rgba(255,255,255,0.05)',
                            color: isSuccess ? '#fff' : '#4b5563',
                            border: 'none',
                            padding: '1.5rem',
                            borderRadius: '20px',
                            fontSize: '1.1rem',
                            fontWeight: 800,
                            cursor: isSuccess ? 'pointer' : 'not-allowed',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        УТВЕРДИТЬ МОДЕЛЬ
                    </button>
                    {!isSuccess && <div style={{ fontSize: '0.8rem', color: '#ef4444', textAlign: 'center' }}>Цель не достигнута или маржа ниже 10%</div>}
                </div>
            </main>

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
        </div>
    )
}

function DataItem({ label, value, color, isNegative }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#8a90a4', fontSize: '0.9rem' }}>{label}</span>
            <span style={{ fontWeight: 600, color: color }}>{isNegative ? '-' : ''}{Math.abs(Math.floor(value)).toLocaleString()} ₽</span>
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
