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

    const mainStyle = {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        position: 'relative',
        zIndex: 5
    }

    const cardStyle = {
        backgroundColor: 'rgba(16, 21, 40, 0.6)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        padding: '3rem',
        textAlign: 'center',
        maxWidth: '600px',
        width: '100%',
        boxShadow: '0 18px 60px rgba(0,0,0,0.45)'
    }

    return (
        <div style={containerStyle}>
            <header style={headerStyle}>
                <BackButton href="/games" />
                <div style={{ textAlign: 'center' }}>
                    <h1 style={{ fontSize: '1.2rem', fontWeight: 300, letterSpacing: '0.3em', margin: 0, color: '#ffb35a' }}>ГЕРОЙ МАРЖИ</h1>
                </div>
                <div style={{ display: 'flex', gap: '3rem' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.6rem', color: '#8a90a4', textTransform: 'uppercase' }}>High Score</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'monospace', color: '#ffb35a' }}>{highScore}</div>
                    </div>
                </div>
            </header>

            <main style={mainStyle}>
                <AnimatePresence mode="wait">
                    {gameState === 'start' && (
                        <motion.div
                            key="start"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={cardStyle}
                        >
                            <div style={{ fontSize: '5rem', marginBottom: '2rem' }}>💰</div>
                            <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>Проверка интуиции</h2>
                            <p style={{ color: '#c3c9d9', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '2.5rem' }}>
                                У тебя есть <span style={{ color: '#ffb35a', fontWeight: 'bold' }}>5 секунд</span>, чтобы понять:
                                прибылен ли этот товар после вычета всех комиссий и логистики?
                            </p>
                            <button
                                onClick={startGame}
                                style={{
                                    backgroundColor: '#ffb35a',
                                    color: '#050814',
                                    border: 'none',
                                    padding: '1.2rem 3rem',
                                    borderRadius: '18px',
                                    fontSize: '1.1rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    textTransform: 'uppercase'
                                }}
                            >
                                Начать игру
                            </button>
                        </motion.div>
                    )}

                    {gameState === 'playing' && currentProduct && (
                        <motion.div
                            key="playing"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '2rem' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontSize: '0.6rem', opacity: 0.5, textTransform: 'uppercase' }}>Уровень {level}</div>
                                    <div style={{ fontSize: '4rem', fontWeight: 800, lineHeight: 1 }}>{score}</div>
                                    {multiplier > 1 && <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 900 }}>x{multiplier} MULTIPLIER</div>}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.6rem', opacity: 0.5, textTransform: 'uppercase' }}>Комбо: {streak}</div>
                                    <div style={{ fontSize: '4rem', fontWeight: 800, lineHeight: 1, fontFamily: 'monospace', color: timer < 2 ? '#ef4444' : '#3b82f6' }}>
                                        {timer.toFixed(1)}
                                    </div>
                                </div>
                            </div>

                            <div style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                <motion.div
                                    initial={{ width: '100%' }}
                                    animate={{ width: `${(timer / 5) * 100}%` }}
                                    transition={{ duration: 0.1, ease: 'linear' }}
                                    style={{ height: '100%', backgroundColor: timer < 2 ? '#ef4444' : '#3b82f6' }}
                                />
                            </div>

                            <div style={{
                                backgroundColor: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                borderRadius: '32px',
                                padding: '3rem',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                <div style={{ fontSize: '0.7rem', color: '#3b82f6', fontWeight: 'bold', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                                    {level === 1 && '💡 Базовая аналитика'}
                                    {level === 2 && '📊 Учет комиссий'}
                                    {level === 3 && '🚛 Логистический расчет'}
                                    {level >= 4 && '🏦 Полный цикл (Налоги)'}
                                </div>
                                <h3 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '2.5rem' }}>{currentProduct.name}</h3>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2rem' }}>
                                    <div>
                                        <div style={{ fontSize: '0.6rem', opacity: 0.5 }}>ЦЕНА ЗАКУПА</div>
                                        <div style={{ fontSize: '2rem', fontWeight: 700 }}>{currentProduct.buyPrice} ₸</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.6rem', opacity: 0.5 }}>ЦЕНА ПРОДАЖИ</div>
                                        <div style={{ fontSize: '2rem', fontWeight: 700, color: '#ffb35a' }}>{currentProduct.sellPrice} ₸</div>
                                    </div>
                                </div>

                                <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {level >= 2 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.02)', padding: '1rem 1.5rem', borderRadius: '12px' }}>
                                            <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>Комиссия ({currentProduct.commissionPercent}%)</span>
                                            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#ef4444' }}>-{currentProduct.commission} ₸</span>
                                        </div>
                                    )}
                                    {level >= 3 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.02)', padding: '1rem 1.5rem', borderRadius: '12px' }}>
                                            <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>Логистика</span>
                                            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#ef4444' }}>-{currentProduct.logistics} ₸</span>
                                        </div>
                                    )}
                                    {level >= 4 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.02)', padding: '1rem 1.5rem', borderRadius: '12px' }}>
                                            <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>Налоги (Simplified)</span>
                                            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#ef4444' }}>-{currentProduct.tax} ₸</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <button
                                    onClick={() => handleAnswer(true)}
                                    disabled={feedback}
                                    style={{
                                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                        border: '1px solid #10b981',
                                        color: '#10b981',
                                        padding: '2rem',
                                        borderRadius: '24px',
                                        fontSize: '1.5rem',
                                        fontWeight: 800,
                                        cursor: 'pointer'
                                    }}
                                >
                                    В ПЛЮС
                                </button>
                                <button
                                    onClick={() => handleAnswer(false)}
                                    disabled={feedback}
                                    style={{
                                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                        border: '1px solid #ef4444',
                                        color: '#ef4444',
                                        padding: '2rem',
                                        borderRadius: '24px',
                                        fontSize: '1.5rem',
                                        fontWeight: 800,
                                        cursor: 'pointer'
                                    }}
                                >
                                    В МИНУС
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
                            <div style={{ fontSize: '5rem', marginBottom: '2rem' }}>📈</div>
                            <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                                {score < 10 && 'Младший закупщик'}
                                {score >= 10 && score < 25 && 'Мастер Маржи'}
                                {score >= 25 && score < 50 && 'Финансовый Директор'}
                                {score >= 50 && 'Волк с Wall Street'}
                            </h2>
                            <p style={{ color: '#8a90a4', marginBottom: '2.5rem' }}>Твой финальный ранг в Velveto Academy</p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
                                <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '2rem', borderRadius: '20px' }}>
                                    <div style={{ fontSize: '0.6rem', opacity: 0.5, marginBottom: '0.5rem' }}>ПРАВИЛЬНЫХ ОТВЕТОВ</div>
                                    <div style={{ fontSize: '3rem', fontWeight: 700, color: '#ffb35a' }}>{score}</div>
                                </div>
                                <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '2rem', borderRadius: '20px' }}>
                                    <div style={{ fontSize: '0.6rem', opacity: 0.5, marginBottom: '0.5rem' }}>ТВОЙ РЕКОРД</div>
                                    <div style={{ fontSize: '3rem', fontWeight: 700, color: '#fff' }}>{highScore}</div>
                                </div>
                            </div>

                            <button
                                onClick={startGame}
                                style={{
                                    backgroundColor: '#fff',
                                    color: '#050814',
                                    border: 'none',
                                    width: '100%',
                                    padding: '1.5rem',
                                    borderRadius: '18px',
                                    fontSize: '1.1rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    marginBottom: '1rem'
                                }}
                            >
                                Попробовать снова
                            </button>
                            <Link href="/games">
                                <span style={{ color: '#8a90a4', fontSize: '0.9rem', cursor: 'pointer' }}>Вернуться в меню</span>
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    )
}
