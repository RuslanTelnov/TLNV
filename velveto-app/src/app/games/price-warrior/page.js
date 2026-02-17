'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import BackButton from '@/components/BackButton'
import Link from 'next/link'

export default function PriceWarrior() {
    const [gameState, setGameState] = useState('start')
    const [profit, setProfit] = useState(100)
    const [marketShare, setMarketShare] = useState(30)
    const [userPrice, setUserPrice] = useState(1000)
    const [enemyPrice, setEnemyPrice] = useState(950)
    const [score, setScore] = useState(0)
    const [highScore, setHighScore] = useState(0)
    const [timeLeft, setTimeLeft] = useState(30)

    // Animation refs for enemies
    const enemyActionRef = useRef(null)

    useEffect(() => {
        const saved = localStorage.getItem('price-warrior-highscore')
        if (saved) setHighScore(parseInt(saved))
    }, [])

    const startGame = () => {
        setProfit(100)
        setMarketShare(30)
        setUserPrice(1000)
        setEnemyPrice(950)
        setScore(0)
        setTimeLeft(30)
        setGameState('playing')
    }

    const updateGameLogic = useCallback(() => {
        // Simple economics simulation
        const priceDiff = enemyPrice - userPrice

        // Update Market Share based on price difference
        setMarketShare(prev => {
            const delta = priceDiff / 50 // Positive if user is cheaper
            const newShare = Math.min(100, Math.max(0, prev + delta))
            return newShare
        })

        // Update Profit based on current price and share
        setProfit(prev => {
            const baseCost = 600
            const unitProfit = userPrice - baseCost
            const decay = 0.5
            const gain = (unitProfit * marketShare) / 2000
            const newProfit = Math.min(100, Math.max(0, prev - decay + gain))
            return newProfit
        })

        // AI Enemy logic
        if (Math.random() > 0.8) {
            setEnemyPrice(prev => {
                const change = (Math.random() - 0.5) * 100
                return Math.max(700, prev + change)
            })
        }
    }, [userPrice, enemyPrice, marketShare])

    useEffect(() => {
        let interval
        if (gameState === 'playing') {
            interval = setInterval(() => {
                updateGameLogic()
                setTimeLeft(t => {
                    if (t <= 0.1) {
                        setGameState('result')
                        return 0
                    }
                    return t - 0.1
                })
                setScore(s => s + Math.floor(marketShare / 10))
            }, 100)
        }
        return () => clearInterval(interval)
    }, [gameState, updateGameLogic, marketShare])

    useEffect(() => {
        if (profit <= 0 || marketShare <= 0) {
            setGameState('result')
        }
    }, [profit, marketShare])

    useEffect(() => {
        if (gameState === 'result' && score > highScore) {
            setHighScore(score)
            localStorage.setItem('price-warrior-highscore', score.toString())
        }
    }, [gameState, score, highScore])

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: '#050814',
            color: '#f5f5f5',
            fontFamily: "'Inter', sans-serif",
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            <header style={{
                padding: '1.5rem 3rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: 'rgba(5, 8, 20, 0.9)',
                backdropFilter: 'blur(10px)',
                zIndex: 10
            }}>
                <BackButton href="/games" />
                <div style={{ textAlign: 'center' }}>
                    <h1 style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '0.4em', color: '#ef4444', margin: 0 }}>PRICE WARRIOR</h1>
                    <div style={{ fontSize: '0.6rem', color: '#8a90a4', marginTop: '4px' }}>БИТВА ЗА ДОЛЮ РЫНКА</div>
                </div>
                <div style={{ display: 'flex', gap: '3rem' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.6rem', opacity: 0.5 }}>SCORE</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ef4444' }}>{score}</div>
                    </div>
                </div>
            </header>

            <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                <AnimatePresence mode="wait">
                    {gameState === 'start' && (
                        <motion.div
                            key="start"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{ maxWidth: '600px', textAlign: 'center', backgroundColor: 'rgba(16, 21, 40, 0.7)', padding: '5rem', borderRadius: '40px', border: '1px solid rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(30px)' }}
                        >
                            <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>⚔️</div>
                            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem' }}>Битва Цен</h2>
                            <p style={{ color: '#c3c9d9', fontSize: '1.1rem', lineHeight: 1.8, marginBottom: '2.5rem' }}>
                                Управляйте ценой, чтобы захватить рынок. Но помните: слишком низкая цена уничтожит ваш <b>ПРОФИТ</b>, а слишком высокая — <b>ДОЛЮ РЫНКА</b>.
                            </p>
                            <button
                                onClick={startGame}
                                style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '1.5rem 5rem', borderRadius: '20px', fontSize: '1.2rem', fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                            >
                                Вступить в бой
                            </button>
                        </motion.div>
                    )}

                    {gameState === 'playing' && (
                        <div style={{ width: '100%', maxWidth: '1000px', display: 'flex', flexDirection: 'column', gap: '4rem', alignItems: 'center' }}>
                            {/* HUD Stats */}
                            <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#10b981' }}>HP: ПРОФИТ</span>
                                        <span style={{ fontSize: '1.2rem', fontWeight: 900 }}>{Math.round(profit)}%</span>
                                    </div>
                                    <div style={{ height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden' }}>
                                        <motion.div
                                            animate={{ width: `${profit}%`, backgroundColor: profit < 30 ? '#ef4444' : '#10b981' }}
                                            style={{ height: '100%' }}
                                        />
                                    </div>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#3b82f6' }}>MP: ДОЛЯ РЫНКА</span>
                                        <span style={{ fontSize: '1.2rem', fontWeight: 900 }}>{Math.round(marketShare)}%</span>
                                    </div>
                                    <div style={{ height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden' }}>
                                        <motion.div
                                            animate={{ width: `${marketShare}%` }}
                                            style={{ height: '100%', backgroundColor: '#3b82f6' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Combat Arena */}
                            <div style={{ position: 'relative', width: '100%', height: '300px', background: 'rgba(255,255,255,0.02)', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🛡️</div>
                                    <div style={{ fontSize: '2rem', fontWeight: 900 }}>{Math.round(userPrice)} ₸</div>
                                    <div style={{ fontSize: '0.7rem', color: '#8a90a4' }}>ВАША ЦЕНА</div>
                                </div>
                                <div style={{ fontSize: '3rem', opacity: 0.2 }}>VS</div>
                                <div style={{ textAlign: 'center' }}>
                                    <motion.div
                                        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        style={{ fontSize: '4rem', marginBottom: '1rem' }}
                                    >
                                        🤖
                                    </motion.div>
                                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#ef4444' }}>{Math.round(enemyPrice)} ₸</div>
                                    <div style={{ fontSize: '0.7rem', color: '#8a90a4' }}>ЦЕНА КОНКУРЕНТА</div>
                                </div>
                            </div>

                            {/* Price Controller */}
                            <div style={{ width: '100%', background: 'rgba(255,255,255,0.03)', padding: '3rem', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                    <span style={{ fontSize: '0.8rem', color: '#8a90a4' }}>МИНИМУМ: 700 ₸</span>
                                    <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>РЕГУЛЯТОР ЦЕНЫ</span>
                                    <span style={{ fontSize: '0.8rem', color: '#8a90a4' }}>МАКСИМУМ: 1500 ₸</span>
                                </div>
                                <input
                                    type="range"
                                    min="700"
                                    max="1500"
                                    step="1"
                                    value={userPrice}
                                    onChange={(e) => setUserPrice(parseInt(e.target.value))}
                                    style={{
                                        width: '100%',
                                        height: '60px',
                                        appearance: 'none',
                                        background: 'linear-gradient(90deg, #ef4444, #10b981)',
                                        borderRadius: '30px',
                                        cursor: 'pointer',
                                        outline: 'none',
                                        padding: '0 20px'
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {gameState === 'result' && (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{
                                maxWidth: '600px',
                                textAlign: 'center',
                                backgroundColor: 'rgba(16, 21, 40, 0.8)',
                                padding: '5rem',
                                borderRadius: '50px',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                backdropFilter: 'blur(30px)'
                            }}
                        >
                            <div style={{ fontSize: '6rem', marginBottom: '2rem' }}>💀</div>
                            <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1rem' }}>Битва завершена</h2>
                            <p style={{ color: '#d1d5db', fontSize: '1.2rem', marginBottom: '3rem' }}>
                                Вы либо обанкротились, либо потеряли всякое влияние на рынке. В следующий раз действуйте осмотрительнее.
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '4rem' }}>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '24px' }}>
                                    <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '0.8rem' }}>SCORE</div>
                                    <div style={{ fontSize: '4rem', fontWeight: 900, color: '#ef4444' }}>{score}</div>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '24px' }}>
                                    <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '0.8rem' }}>BEST</div>
                                    <div style={{ fontSize: '4rem', fontWeight: 900 }}>{highScore}</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1.5rem' }}>
                                <button
                                    onClick={startGame}
                                    style={{ flex: 2, backgroundColor: '#fff', color: '#050814', border: 'none', padding: '1.5rem', borderRadius: '20px', fontSize: '1.2rem', fontWeight: 900, cursor: 'pointer' }}
                                >
                                    ВЕРНУТЬСЯ В БОЙ
                                </button>
                                <Link href="/games" style={{ flex: 1, textDecoration: 'none' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', color: '#8a90a4', fontWeight: '900', fontSize: '1rem' }}>
                                        В ХАБ
                                    </div>
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    )
}
