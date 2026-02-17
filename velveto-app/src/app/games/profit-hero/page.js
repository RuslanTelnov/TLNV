'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import BackButton from '@/components/BackButton'
import confetti from 'canvas-confetti'

export default function ProfitHero() {
    const [gameState, setGameState] = useState('start')
    const [score, setScore] = useState(0)
    const [highScore, setHighScore] = useState(0)
    const [timer, setTimer] = useState(5)
    const [currentProduct, setCurrentProduct] = useState(null)
    const [feedback, setFeedback] = useState(null)
    const [level, setLevel] = useState(1)
    const [streak, setStreak] = useState(0)
    const [multiplier, setMultiplier] = useState(1)

    useEffect(() => {
        const saved = localStorage.getItem('profitHeroHighScore')
        if (saved) setHighScore(parseInt(saved))
    }, [])

    const generateProduct = useCallback((currentScore = 0) => {
        const levelCalc = Math.floor(currentScore / 5) + 1
        setLevel(levelCalc)

        const buyPrice = Math.floor(Math.random() * 5000) + 500
        const sellPrice = buyPrice + (Math.random() * 2500 - 500)

        // Dynamic costs based on level
        const commissionPercent = levelCalc >= 2 ? Math.floor(Math.random() * 15) + 5 : 0
        const commission = Math.round(sellPrice * (commissionPercent / 100))

        const logisticsPerc = levelCalc >= 3 ? Math.floor(Math.random() * 10) + 5 : 0
        const logistics = levelCalc >= 3 ? Math.floor(buyPrice * (logisticsPerc / 100)) + 150 : 0

        const taxPerc = levelCalc >= 4 ? 3 : 0 // 3% simplified RK tax
        const tax = Math.round(sellPrice * (taxPerc / 100))

        const realProfit = sellPrice - buyPrice - commission - logistics - tax
        const isProfitable = realProfit > 0

        const productNames = [
            'Наушники X-Bass', 'Лампа Minimal', 'Йога-мат Pro', 'Кружка Nemo', 'Чехол Glossy',
            'Смарт-часы', 'Пауэрбанк 10k', 'Рюкзак City', 'Мышь Stealth', 'Клавиатура RGB'
        ]

        return {
            name: productNames[Math.floor(Math.random() * productNames.length)],
            buyPrice,
            sellPrice: Math.round(sellPrice),
            commissionPercent,
            commission,
            logistics,
            tax,
            isProfitable,
            realProfit: Math.round(realProfit),
            level: levelCalc
        }
    }, [])

    const startGame = () => {
        setGameState('playing')
        setScore(0)
        setTimer(5)
        setStreak(0)
        setMultiplier(1)
        setCurrentProduct(generateProduct(0))
        setFeedback(null)
    }

    const handleAnswer = (answer) => {
        if (answer === currentProduct.isProfitable) {
            const nextScore = score + 1 * multiplier
            setScore(nextScore)
            setStreak(s => s + 1)

            // Multiplier logic
            if ((streak + 1) % 5 === 0) setMultiplier(m => m + 1)

            setFeedback('correct')

            // Time bonus: +1s for correct answer
            setTimer(t => Math.min(t + 1.2, 5))

            confetti({
                particleCount: 50,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#3b82f6', '#10b981']
            })
            setTimeout(() => {
                setCurrentProduct(generateProduct(nextScore))
                setFeedback(null)
            }, 500)
        } else {
            setFeedback('wrong')
            setTimeout(() => endGame(), 600)
        }
    }

    const endGame = () => {
        setGameState('result')
        if (score > highScore) {
            setHighScore(score)
            localStorage.setItem('profitHeroHighScore', score.toString())
        }
    }

    useEffect(() => {
        let interval
        if (gameState === 'playing' && !feedback) {
            interval = setInterval(() => {
                setTimer((t) => {
                    if (t <= 0.1) {
                        endGame()
                        return 0
                    }
                    return t - 0.1
                })
            }, 100)
        }
        return () => clearInterval(interval)
    }, [gameState, feedback])

    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const containerStyle = {
        position: 'fixed',
        inset: 0,
        backgroundColor: '#050814',
        color: '#f5f5f5',
        fontFamily: "'Inter', sans-serif",
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

    const mainStyle = {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: isMobile ? 'flex-start' : 'center',
        padding: isMobile ? '1.2rem' : '2rem',
        position: 'relative',
        zIndex: 5,
        paddingTop: isMobile ? '1.5rem' : '2rem'
    }

    const cardStyle = {
        backgroundColor: 'rgba(16, 21, 40, 0.7)',
        backdropFilter: 'blur(30px)',
        borderRadius: '32px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        padding: isMobile ? '1.8rem' : '3rem',
        textAlign: 'center',
        maxWidth: '600px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
    }

    return (
        <div style={containerStyle}>
            <header style={headerStyle}>
                <BackButton href="/games" />
                <div style={{ textAlign: 'center' }}>
                    <h1 style={{ fontSize: isMobile ? '0.9rem' : '1.2rem', fontWeight: 300, letterSpacing: '0.4em', margin: 0, color: '#ffb35a' }}>PROFIT HERO</h1>
                </div>
                <div style={{ display: 'flex', gap: isMobile ? '1rem' : '3rem' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.55rem', color: '#8a90a4', textTransform: 'uppercase', letterSpacing: '1px' }}>High Score</div>
                        <div style={{ fontSize: isMobile ? '1.3rem' : '1.8rem', fontWeight: 800, fontFamily: 'monospace', color: '#ffb35a' }}>{highScore}</div>
                    </div>
                </div>
            </header>

            <main style={mainStyle}>
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
                    <div style={{ position: 'absolute', top: '20%', left: '20%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, transparent 70%)', filter: 'blur(80px)' }} />
                </div>

                <AnimatePresence mode="wait">
                    {gameState === 'start' && (
                        <motion.div
                            key="start"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={cardStyle}
                        >
                            <div style={{ fontSize: isMobile ? '3.5rem' : '5rem', marginBottom: '1.5rem' }}>🔥</div>
                            <h2 style={{ fontSize: isMobile ? '1.8rem' : '2.8rem', fontWeight: 900, marginBottom: '1rem', letterSpacing: '-1px' }}>Битва за Маржу</h2>
                            <p style={{ color: '#94a3b8', fontSize: isMobile ? '0.95rem' : '1.1rem', lineHeight: 1.6, marginBottom: '2.5rem' }}>
                                У тебя есть <span style={{ color: '#ffb35a', fontWeight: 800 }}>5 секунд</span> на анализ.
                                Успеешь ли ты вычислить прибыль после комиссий, логистики и налогов?
                            </p>
                            <button
                                onClick={startGame}
                                style={{
                                    backgroundColor: '#ffb35a',
                                    color: '#050814',
                                    border: 'none',
                                    padding: isMobile ? '1.2rem' : '1.5rem 4rem',
                                    borderRadius: '20px',
                                    fontSize: isMobile ? '1.1rem' : '1.2rem',
                                    fontWeight: 900,
                                    cursor: 'pointer',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    width: isMobile ? '100%' : 'auto',
                                    boxShadow: '0 10px 30px rgba(255, 179, 90, 0.3)'
                                }}
                            >
                                ВПЕРЕД!
                            </button>
                        </motion.div>
                    )}

                    {gameState === 'playing' && currentProduct && (
                        <motion.div
                            key="playing"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: isMobile ? '1.2rem' : '2rem', position: 'relative', zIndex: 10 }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 0.5rem' }}>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '1px' }}>LVL {level}</div>
                                    <div style={{ fontSize: isMobile ? '2.8rem' : '4rem', fontWeight: 900, lineHeight: 1 }}>{score}</div>
                                    {multiplier > 1 && <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 900, marginTop: '0.3rem' }}>x{multiplier} MULTIPLIER</div>}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '1px' }}>STREAK: {streak}</div>
                                    <div style={{ fontSize: isMobile ? '2.8rem' : '4rem', fontWeight: 900, lineHeight: 1, fontFamily: 'monospace', color: timer < 2 ? '#ef4444' : '#3b82f6' }}>
                                        {timer.toFixed(1)}
                                    </div>
                                </div>
                            </div>

                            <div style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                                <motion.div
                                    initial={{ width: '100%' }}
                                    animate={{ width: `${(timer / 5) * 100}%` }}
                                    transition={{ duration: 0.1, ease: 'linear' }}
                                    style={{ height: '100%', backgroundColor: timer < 2 ? '#ef4444' : '#3b82f6', boxShadow: `0 0 15px ${timer < 2 ? '#ef4444' : '#3b82f6'}44` }}
                                />
                            </div>

                            <div style={{
                                backgroundColor: 'rgba(16, 21, 40, 0.7)',
                                backdropFilter: 'blur(30px)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '32px',
                                padding: isMobile ? '1.5rem' : '3rem',
                                position: 'relative',
                                overflow: 'hidden',
                                boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
                            }}>
                                <div style={{ fontSize: isMobile ? '0.65rem' : '0.75rem', color: '#3b82f6', fontWeight: 900, marginBottom: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                                    {level === 1 && '💡 Юнит-экономика: База'}
                                    {level === 2 && '📊 Учет комиссий площадки'}
                                    {level === 3 && '🚛 Логистическое плечо'}
                                    {level >= 4 && '🏦 Финальный расчет (Налоги)'}
                                </div>
                                <h3 style={{ fontSize: isMobile ? '1.8rem' : '2.8rem', fontWeight: 900, marginBottom: isMobile ? '1.5rem' : '2.5rem', letterSpacing: '-0.5px' }}>{currentProduct.name}</h3>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isMobile ? '1.2rem' : '3rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.8rem' }}>
                                    <div>
                                        <div style={{ fontSize: '0.65rem', opacity: 0.4, fontWeight: 800, textTransform: 'uppercase' }}>ЗАКУПКА</div>
                                        <div style={{ fontSize: isMobile ? '1.3rem' : '2.2rem', fontWeight: 900 }}>{currentProduct.buyPrice} ₸</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.65rem', opacity: 0.4, fontWeight: 800, textTransform: 'uppercase' }}>ПРОДАЖА</div>
                                        <div style={{ fontSize: isMobile ? '1.3rem' : '2.2rem', fontWeight: 900, color: '#ffb35a' }}>{currentProduct.sellPrice} ₸</div>
                                    </div>
                                </div>

                                <div style={{ marginTop: '1.8rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    {level >= 2 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.03)', padding: '0.9rem 1.2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>Комиссия ({currentProduct.commissionPercent}%)</span>
                                            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ef4444' }}>-{currentProduct.commission} ₸</span>
                                        </div>
                                    )}
                                    {level >= 3 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.03)', padding: '0.9rem 1.2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>Логистика</span>
                                            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ef4444' }}>-{currentProduct.logistics} ₸</span>
                                        </div>
                                    )}
                                    {level >= 4 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.03)', padding: '0.9rem 1.2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>Налоги (simplified)</span>
                                            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ef4444' }}>-{currentProduct.tax} ₸</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isMobile ? '1rem' : '1.5rem' }}>
                                <button
                                    onClick={() => handleAnswer(true)}
                                    disabled={feedback}
                                    style={{
                                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                        border: '2px solid #10b981',
                                        color: '#10b981',
                                        padding: isMobile ? '1.4rem' : '2.2rem',
                                        borderRadius: '24px',
                                        fontSize: isMobile ? '1.1rem' : '1.5rem',
                                        fontWeight: 900,
                                        cursor: 'pointer',
                                        boxShadow: '0 10px 30px rgba(16, 185, 129, 0.15)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px'
                                    }}
                                >
                                    ПЛЮС
                                </button>
                                <button
                                    onClick={() => handleAnswer(false)}
                                    disabled={feedback}
                                    style={{
                                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                        border: '2px solid #ef4444',
                                        color: '#ef4444',
                                        padding: isMobile ? '1.4rem' : '2.2rem',
                                        borderRadius: '24px',
                                        fontSize: isMobile ? '1.1rem' : '1.5rem',
                                        fontWeight: 900,
                                        cursor: 'pointer',
                                        boxShadow: '0 10px 30px rgba(239, 68, 68, 0.15)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px'
                                    }}
                                >
                                    МИНУС
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {gameState === 'result' && (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={cardStyle}
                        >
                            <div style={{ fontSize: isMobile ? '3.5rem' : '5rem', marginBottom: '1.5rem' }}>📊</div>
                            <h2 style={{ fontSize: isMobile ? '1.8rem' : '2.5rem', fontWeight: 900, marginBottom: '0.5rem', letterSpacing: '-1px' }}>
                                {score < 10 && 'Младший аналитик'}
                                {score >= 10 && score < 25 && 'Мастер Маржи'}
                                {score >= 25 && score < 50 && 'Финансовый Директор'}
                                {score >= 50 && 'Волк с Wall Street'}
                            </h2>
                            <p style={{ color: '#8a90a4', marginBottom: '2.5rem', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Твой финальный ранг в Velveto</p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isMobile ? '1rem' : '2rem', marginBottom: '2.5rem' }}>
                                <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', padding: isMobile ? '1.5rem' : '2.2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ fontSize: '0.6rem', fontWeight: 800, opacity: 0.5, marginBottom: '0.6rem', textTransform: 'uppercase' }}>ОТВЕТОВ</div>
                                    <div style={{ fontSize: isMobile ? '1.8rem' : '3.5rem', fontWeight: 900, color: '#ffb35a' }}>{score}</div>
                                </div>
                                <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', padding: isMobile ? '1.5rem' : '2.2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ fontSize: '0.6rem', fontWeight: 800, opacity: 0.5, marginBottom: '0.6rem', textTransform: 'uppercase' }}>РЕКОРД</div>
                                    <div style={{ fontSize: isMobile ? '1.8rem' : '3.5rem', fontWeight: 900, color: '#fff' }}>{highScore}</div>
                                </div>
                            </div>

                            <button
                                onClick={startGame}
                                style={{
                                    backgroundColor: '#fff',
                                    color: '#050814',
                                    border: 'none',
                                    width: '100%',
                                    padding: '1.3rem',
                                    borderRadius: '20px',
                                    fontSize: '1.1rem',
                                    fontWeight: 900,
                                    cursor: 'pointer',
                                    marginBottom: '1.2rem',
                                    transition: 'all 0.2s'
                                }}
                            >
                                ПОПРОБОВАТЬ СНОВА
                            </button>
                            <Link href="/games" style={{ textDecoration: 'none' }}>
                                <span style={{ color: '#8a90a4', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px' }}>Вернуться в меню</span>
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    )
}
