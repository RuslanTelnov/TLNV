'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import BackButton from '@/components/BackButton'
import confetti from 'canvas-confetti'

const TAX_RATE = 0.03
const BASE_CONVERSION = 0.04
const RETURN_RATE = 0.12 // 12% returns

const MISSIONS = [
    {
        id: 'standard',
        title: 'Стандартный запуск',
        description: 'Классический сценарий: выведите новый товар на прибыль в 1.25 млн ₸.',
        icon: '🚀',
        targetProfit: 1250000,
        targetMargin: 15,
        targetRoi: 50,
        unitCost: 2000,
        fulfillment: 600,
        baseCpc: 125
    },
    {
        id: 'logistics_crisis',
        title: 'Кризис логистики',
        description: 'Стоимость фулфилмента выросла в 2.5 раза. Сможете ли вы перестроить модель?',
        icon: '🚛',
        targetProfit: 500000,
        targetMargin: 10,
        targetRoi: 30,
        unitCost: 1800,
        fulfillment: 1500,
        baseCpc: 100
    },
    {
        id: 'premium_brand',
        title: 'Премиум-бренд',
        description: 'Дорогой товар, дорогая реклама. Задача — удержать маржинальность 25%.',
        icon: '💎',
        targetProfit: 1000000,
        targetMargin: 25,
        targetRoi: 40,
        unitCost: 6500,
        fulfillment: 800,
        baseCpc: 250
    },
    {
        id: 'high_competition',
        title: 'Битва за трафик',
        description: 'Рынок перегрет средним CPC в 300 ₸. Найдите путь к прибыли в 800к.',
        icon: '⚔️',
        targetProfit: 800000,
        targetMargin: 12,
        targetRoi: 35,
        unitCost: 1200,
        fulfillment: 500,
        baseCpc: 300
    }
]

export default function PLArchitect() {
    const [gameState, setGameState] = useState('start')
    const [selectedMission, setSelectedMission] = useState(MISSIONS[0])
    const [month, setMonth] = useState(1)
    const [cash, setCash] = useState(2500000)
    const [history, setHistory] = useState([])
    const [currentEvent, setCurrentEvent] = useState(null)
    const [isSimulating, setIsSimulating] = useState(false)
    const [finalProfit, setFinalProfit] = useState(0)

    // Sliders (Player's Hypothesis)
    const [price, setPrice] = useState(7500)
    const [adBudget, setAdBudget] = useState(400000)
    const [cpc, setCpc] = useState(125)

    // Sync sliders with mission defaults
    useEffect(() => {
        setCpc(selectedMission.baseCpc)
        if (selectedMission.id === 'premium_brand') setPrice(25000)
        else setPrice(7500)
        setCash(2500000)
        setHistory([])
        setMonth(1)
        setCurrentEvent(null)
    }, [selectedMission])

    const EVENTS = [
        { title: 'Шторм на таможне', effect: 'Себестоимость +30%', apply: (s) => ({ ...s, unitCost: s.unitCost * 1.3 }) },
        { title: 'Демпинг конкурента', effect: 'Конверсия -40%', apply: (s) => ({ ...s, conv: 0.024 }) },
        { title: 'Виральный охват', effect: 'Бесплатный трафик!', apply: (s) => ({ ...s, extraTraffic: 500 }) },
        { title: 'Черная пятница', effect: 'Трафик x2, CPC x1.5', apply: (s) => ({ ...s, trafficMult: 2, cpcMult: 1.5 }) },
        { title: 'Проверка органов', effect: 'Штраф 200к ₸', apply: (s) => ({ ...s, fine: 200000 }) }
    ]

    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const runSimulation = () => {
        if (cash < adBudget) return alert('Недостаточно бюджета на рекламу!')

        setIsSimulating(true)

        // Pick a random event or nothing
        const event = Math.random() > 0.6 ? EVENTS[Math.floor(Math.random() * EVENTS.length)] : null
        setCurrentEvent(event)

        setTimeout(() => {
            let simParams = {
                unitCost: selectedMission.unitCost,
                fulfillment: selectedMission.fulfillment,
                conv: BASE_CONVERSION,
                trafficMult: 1,
                cpcMult: 1,
                extraTraffic: 0,
                fine: 0
            }

            if (event) {
                simParams = event.apply(simParams)
            }

            // Calculation Logic
            const saturationPoint = 750000
            const saturationFactor = adBudget > saturationPoint ? Math.pow(adBudget / saturationPoint, 1.3) : 1
            const effectiveAdBudget = adBudget / (saturationFactor * simParams.cpcMult)

            const traffic = Math.floor((effectiveAdBudget / (cpc * simParams.cpcMult)) * simParams.trafficMult) + simParams.extraTraffic
            const orders = Math.floor(traffic * simParams.conv)

            const successfulSales = Math.floor(orders * (1 - RETURN_RATE))
            const returnsCount = orders - successfulSales
            const returnProcessingFee = 750

            const revenue = successfulSales * price
            const marketplaceFee = revenue * 0.15
            const fulfillmentTotal = orders * simParams.fulfillment + returnsCount * returnProcessingFee
            const costOfGoods = orders * simParams.unitCost
            const taxTotal = revenue * TAX_RATE

            const netProfit = revenue - marketplaceFee - fulfillmentTotal - costOfGoods - adBudget - taxTotal - simParams.fine
            const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0
            const roi = adBudget > 0 ? (netProfit / adBudget) * 100 : 0

            const result = {
                month,
                event: event?.title || 'Спокойный рынок',
                netProfit,
                margin,
                roi,
                orders,
                revenue
            }

            setHistory([result, ...history])
            setCash(c => c + netProfit)
            setMonth(m => m + 1)
            setIsSimulating(false)

            if (netProfit > selectedMission.targetProfit && margin > selectedMission.targetMargin && roi > selectedMission.targetRoi) {
                setFinalProfit(netProfit)
                setGameState('result')
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 }
                })
            } else if (cash + netProfit <= 0) {
                alert('Вы банкрот! Игра окончена.')
                window.location.reload()
            }
        }, 1200)
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#050814', color: '#fff', padding: isMobile ? '1rem' : '3rem', fontFamily: 'Inter, sans-serif' }}>
            <header style={{ maxWidth: '1200px', margin: isMobile ? '0 auto 1.5rem auto' : '0 auto 3rem auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <BackButton href="/games" />
                <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#8a90a4', fontSize: isMobile ? '0.6rem' : '0.8rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Professional Grade</div>
                    <div style={{ fontSize: isMobile ? '1rem' : '1.2rem', fontWeight: 700, color: '#3b82f6' }}>P&L Architect 2.0</div>
                </div>
            </header>

            <main style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {gameState === 'start' && (
                    <div style={{ textAlign: 'center', padding: isMobile ? '1.5rem 0' : '3rem 0' }}>
                        <div style={{ fontSize: isMobile ? '3.5rem' : '5rem', marginBottom: '1.5rem' }}>🎮</div>
                        <h1 style={{ fontSize: isMobile ? '1.8rem' : '3rem', fontWeight: 900, marginBottom: '1rem', letterSpacing: '-1px' }}>Вызов для Аналитика</h1>
                        <p style={{ color: '#8a90a4', fontSize: isMobile ? '1rem' : '1.2rem', maxWidth: '600px', margin: '0 auto 2rem auto' }}>
                            Выберите сценарий и докажите, что ваша юнит-экономика выдержит любые условия рынка.
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))', gap: isMobile ? '1rem' : '1.5rem', maxWidth: '1200px', margin: '0 auto 3rem auto' }}>
                            {MISSIONS.map(m => (
                                <motion.div
                                    key={m.id}
                                    whileHover={{ y: -5, borderColor: 'rgba(59, 130, 246, 0.5)' }}
                                    onClick={() => setSelectedMission(m)}
                                    style={{
                                        backgroundColor: 'rgba(255,255,255,0.02)',
                                        padding: isMobile ? '1.2rem' : '2rem',
                                        borderRadius: '24px',
                                        border: `2px solid ${selectedMission.id === m.id ? '#3b82f6' : 'rgba(255,255,255,0.05)'}`,
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        background: selectedMission.id === m.id ? 'linear-gradient(145deg, rgba(59, 130, 246, 0.1) 0%, rgba(5, 8, 20, 0) 100%)' : 'none'
                                    }}
                                >
                                    <div style={{ fontSize: isMobile ? '2rem' : '2.5rem', marginBottom: '0.8rem' }}>{m.icon}</div>
                                    <h3 style={{ fontSize: isMobile ? '1.1rem' : '1.3rem', fontWeight: 800, marginBottom: '0.4rem', color: selectedMission.id === m.id ? '#3b82f6' : '#fff' }}>{m.title}</h3>
                                    <p style={{ fontSize: '0.85rem', color: '#8a90a4', lineHeight: '1.5', minHeight: isMobile ? 'auto' : '3rem' }}>{m.description}</p>

                                    <div style={{ marginTop: '1.2rem', paddingTop: '1.2rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '1rem' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.55rem', color: '#555', textTransform: 'uppercase' }}>Цель</div>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{(m.targetProfit / 1000).toLocaleString()}k ₸</div>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.55rem', color: '#555', textTransform: 'uppercase' }}>Маржа</div>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{m.targetMargin}%</div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <button
                            onClick={() => setGameState('playing')}
                            style={{
                                backgroundColor: '#3b82f6',
                                color: '#fff',
                                border: 'none',
                                padding: isMobile ? '1.2rem 2.5rem' : '1.5rem 5rem',
                                borderRadius: '24px',
                                fontSize: isMobile ? '1rem' : '1.2rem',
                                fontWeight: 900,
                                cursor: 'pointer',
                                boxShadow: '0 10px 30px rgba(59, 130, 246, 0.3)',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                width: isMobile ? '100%' : 'auto'
                            }}
                        >
                            ПРИНЯТЬ ВЫЗОВ
                        </button>
                    </div>
                )}

                {gameState === 'playing' && (
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) 420px', gap: isMobile ? '1.5rem' : '3rem' }}>
                        {/* Simulation View */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '1rem' : '2rem' }}>
                            {/* Monthly Event */}
                            <AnimatePresence mode="wait">
                                {currentEvent && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: isMobile ? '1.2rem' : '1.5rem', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: isMobile ? '1rem' : '1.5rem' }}
                                    >
                                        <div style={{ fontSize: isMobile ? '1.5rem' : '2rem' }}>⚡</div>
                                        <div>
                                            <div style={{ fontWeight: 800, color: '#ef4444', fontSize: '0.65rem', letterSpacing: '1px', textTransform: 'uppercase' }}>Событие рынка</div>
                                            <div style={{ fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: 800 }}>{currentEvent.title}: {currentEvent.effect}</div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Reports History */}
                            <div style={{ backgroundColor: 'rgba(255,255,255,0.01)', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)', padding: isMobile ? '1.5rem' : '2.5rem', height: isMobile ? '400px' : '600px', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)' }}>
                                <h2 style={{ fontSize: isMobile ? '1.2rem' : '1.6rem', marginBottom: isMobile ? '1rem' : '1.5rem', fontWeight: 800 }}>Отчеты по циклам</h2>
                                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem', paddingRight: '0.5rem' }}>
                                    {isSimulating && (
                                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ fontSize: '2rem', marginBottom: '1rem' }}>⌛</motion.div>
                                            <div style={{ color: '#8a90a4', fontSize: '0.8rem' }}>Просчет кассовых разрывов...</div>
                                        </div>
                                    )}
                                    {!isSimulating && history.length === 0 && (
                                        <div style={{ textAlign: 'center', padding: '2rem', color: '#4b5563', fontSize: '0.85rem' }}>
                                            История пуста. Настройте гипотезу и запустите цикл.
                                        </div>
                                    )}
                                    {history.map((h, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ x: -10, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.05)' }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                                                <span style={{ fontSize: '0.6rem', color: '#3b82f6', fontWeight: 900, textTransform: 'uppercase' }}>Месяц {h.month} • {h.event}</span>
                                                <span style={{ fontSize: '0.6rem', color: h.netProfit > 0 ? '#10b981' : '#ef4444', fontWeight: 900 }}>{h.netProfit > 0 ? 'SUCCESS' : 'LOSS'}</span>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.8rem' }}>
                                                <HistoryItem label="Чистая" value={h.netProfit} kzt color={h.netProfit > 0 ? '#10b981' : '#ef4444'} isMobile={isMobile} />
                                                <HistoryItem label="Выручка" value={h.revenue} kzt isMobile={isMobile} />
                                                <HistoryItem label="Заказы" value={h.orders} sub="шт" isMobile={isMobile} />
                                                <HistoryItem label="ROI" value={h.roi} sub="%" color={h.roi > 50 ? '#3b82f6' : '#fff'} isMobile={isMobile} />
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Controls */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '1.2rem' : '2rem' }}>
                            <div style={{ background: 'linear-gradient(145deg, #1d4ed8 0%, #3b82f6 100%)', color: '#fff', padding: isMobile ? '1.5rem' : '2rem', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 30px rgba(59, 130, 246, 0.2)' }}>
                                <div style={{ fontSize: '0.55rem', fontWeight: 800, opacity: 0.8, marginBottom: '0.3rem', letterSpacing: '1px', textTransform: 'uppercase' }}>Общий капитал:</div>
                                <div style={{ fontSize: isMobile ? '1.6rem' : '2.5rem', fontWeight: 900 }}>{Math.floor(cash).toLocaleString()} ₸</div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', backgroundColor: 'rgba(255,255,255,0.02)', padding: isMobile ? '1.5rem' : '2.5rem', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)', background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)' }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#3b82f6', marginBottom: '-0.2rem', textTransform: 'uppercase' }}>Параметры гипотезы:</div>
                                <ControlSlider label="Цена" value={price} min={2000} max={30000} onChange={setPrice} unit="₸" isMobile={isMobile} />
                                <ControlSlider label="Реклама" value={adBudget} min={50000} max={1500000} onChange={setAdBudget} unit="₸" isMobile={isMobile} />
                                <ControlSlider label="CPC" value={cpc} min={50} max={500} onChange={setCpc} unit="₸" isMobile={isMobile} />
                            </div>

                            <button
                                onClick={runSimulation}
                                disabled={isSimulating}
                                style={{
                                    backgroundColor: '#fff',
                                    color: '#050814',
                                    border: 'none',
                                    padding: isMobile ? '1.2rem' : '1.8rem',
                                    borderRadius: '24px',
                                    fontSize: isMobile ? '1rem' : '1.1rem',
                                    fontWeight: 900,
                                    cursor: isSimulating ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: '0 10px 40px rgba(255, 255, 255, 0.1)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px'
                                }}
                            >
                                {isSimulating ? 'РАСЧЕТ...' : 'НЕ КЛИКАТЬ БЕЗ ПЛАНА'}
                            </button>

                            <div style={{ fontSize: '0.65rem', color: '#6d7280', textAlign: 'center', lineHeight: '1.4', padding: '0.8rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '16px' }}>
                                Цель CRM: <b>{selectedMission.title}</b><br />
                                Нужно прибыли ≥ {selectedMission.targetProfit.toLocaleString()} ₸
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Result */}
                <AnimatePresence>
                    {gameState === 'result' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(5,8,20,0.98)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                style={{ backgroundColor: '#102040', padding: isMobile ? '2.5rem 1.5rem' : '4rem', borderRadius: '40px', textAlign: 'center', maxWidth: '450px', border: '1px solid rgba(255,255,255,0.1)', width: '100%', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}
                            >
                                <div style={{ fontSize: isMobile ? '3rem' : '4rem', marginBottom: '1rem' }}>📈</div>
                                <h2 style={{ fontSize: isMobile ? '1.6rem' : '2.2rem', fontWeight: 900, marginBottom: '1rem' }}>Модель Валидна!</h2>
                                <p style={{ color: '#94a3b8', marginBottom: '2.5rem', fontSize: isMobile ? '0.9rem' : '1rem', lineHeight: 1.6 }}>Ваш прогноз оказался точным. Система выдержала турбулентность рынка и вышла на целевую прибыль в <b>{Math.floor(finalProfit).toLocaleString()} ₸</b>.</p>
                                <button onClick={() => window.location.reload()} style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '1.2rem 3rem', borderRadius: '18px', fontSize: '1.1rem', fontWeight: 800, cursor: 'pointer', width: '100%' }}>ПЕРЕЙТИ К НОВОЙ ЦЕЛИ</button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    )
}

function HistoryItem({ label, value, sub, kzt, color, isMobile }) {
    return (
        <div>
            <div style={{ fontSize: '0.5rem', color: '#555', textTransform: 'uppercase', marginBottom: '0.1rem' }}>{label}</div>
            <div style={{ fontSize: isMobile ? '0.8rem' : '0.85rem', fontWeight: 800, color: color }}>
                {Math.abs(Math.floor(value)).toLocaleString()} {kzt ? '₸' : sub}
            </div>
        </div>
    )
}

function DataItem({ label, value, color, isNegative }) {
    const displayValue = typeof value === 'number'
        ? `${isNegative ? '-' : ''}${Math.abs(Math.floor(value)).toLocaleString()} ₸`
        : value
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#8a90a4', fontSize: '0.85rem' }}>{label}</span>
            <span style={{ fontWeight: 600, color: color }}>{displayValue}</span>
        </div>
    )
}

function ControlSlider({ label, value, min, max, onChange, unit, isMobile }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: 700 }}>
                <span style={{ color: '#8a90a4' }}>{label}</span>
                <span>{value.toLocaleString()} {unit}</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#3b82f6', cursor: 'pointer', height: '6px' }}
            />
        </div>
    )
}
