'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import BackButton from '@/components/BackButton'
import Link from 'next/link'
import confetti from 'canvas-confetti'

const TRENDS = [
    { id: 1, name: "Корейская косметика", category: "Beauty", surge: "+145%", type: "rising", image: "💄", description: "Массовый интерес к уходу за кожей 10 ступеней." },
    { id: 2, name: "Спиннеры 2.0", category: "Toys", surge: "-80%", type: "falling", image: "🎡", description: "Угасающий интерес, рынок перенасыщен." },
    { id: 3, name: "Умные бутылки для воды", category: "Sport", surge: "+62%", type: "rising", image: "💧", description: "Эко-тренды и контроль гидратации." },
    { id: 4, name: "Массажеры Гуаша", category: "Beauty", surge: "+120%", type: "rising", image: "💎", description: "Популярность в соцсетях растет." },
    { id: 5, name: "Чехлы для iPhone 6", category: "Tech", surge: "-95%", type: "falling", image: "📱", description: "Абсолютно устаревший сегмент." },
    { id: 6, name: "Складные электровелосипеды", category: "Eco", surge: "+85%", type: "rising", image: "🚲", description: "Развитие городской микромобильности." },
    { id: 7, name: "Семена Чиа", category: "Food", surge: "+40%", type: "rising", image: "🌱", description: "Стабильный рост в категории суперфудов." },
    { id: 8, name: "Пленочные фотоаппараты", category: "Photo", surge: "+55%", type: "rising", image: "📸", description: "Возврат к винтажной эстетике у молодежи." },
    { id: 9, name: "Моноподы (Селфи-палки)", category: "Photo", surge: "-70%", type: "falling", image: "🤳", description: "Заменились на стабилизаторы и дроны." },
    { id: 10, name: "Портативные ирригаторы", category: "Health", surge: "+110%", type: "rising", image: "🦷", description: "Тренд на домашнюю стоматологию." }
]

export default function TrendHunter() {
    const [gameState, setGameState] = useState('start')
    const [score, setScore] = useState(0)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [feedback, setFeedback] = useState(null)
    const [timeLeft, setTimeLeft] = useState(45)
    const [highScore, setHighScore] = useState(0)
    const [history, setHistory] = useState([])

    useEffect(() => {
        const saved = localStorage.getItem('trend-hunter-highscore')
        if (saved) setHighScore(parseInt(saved))
    }, [])

    const startGame = () => {
        setScore(0)
        setCurrentIndex(0)
        setTimeLeft(45)
        setHistory(shuffle([...TRENDS]))
        setGameState('playing')
        setFeedback(null)
    }

    const shuffle = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[array[j]]] = [array[array[j]], array[i]];
        }
        return array
    }

    const handleChoice = (decision) => {
        if (feedback) return
        const trend = history[currentIndex]
        const isCorrect = (decision === 'buy' && trend.type === 'rising') || (decision === 'pass' && trend.type === 'falling')

        setFeedback({ isCorrect, decision })
        if (isCorrect) {
            setScore(s => s + 20)
        } else {
            setScore(s => Math.max(0, s - 15))
        }

        setTimeout(() => {
            if (currentIndex >= history.length - 1) {
                setGameState('result')
            } else {
                setCurrentIndex(i => i + 1)
                setFeedback(null)
            }
        }, 1200)
    }

    useEffect(() => {
        let timer
        if (gameState === 'playing' && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(t => {
                    if (t <= 1) {
                        setGameState('result')
                        return 0
                    }
                    return t - 1
                })
            }, 1000)
        }
        return () => clearInterval(timer)
    }, [gameState, timeLeft])

    useEffect(() => {
        if (gameState === 'result' && score > highScore) {
            setHighScore(score)
            localStorage.setItem('trend-hunter-highscore', score.toString())
        }
    }, [gameState, score, highScore])

    const currentTrend = history[currentIndex]

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
                    <h1 style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '0.4em', color: '#8b5cf6', margin: 0 }}>TREND HUNTER</h1>
                    <div style={{ fontSize: '0.6rem', color: '#8a90a4', marginTop: '4px' }}>АНАЛИЗ РЫНКА</div>
                </div>
                <div style={{ display: 'flex', gap: '3rem' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.6rem', opacity: 0.5 }}>SCORE</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#8b5cf6' }}>{score}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.6rem', opacity: 0.5 }}>TIME</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>{timeLeft}s</div>
                    </div>
                </div>
            </header>

            <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                <AnimatePresence mode="wait">
                    {gameState === 'start' && (
                        <motion.div
                            key="start"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{ maxWidth: '600px', textAlign: 'center', backgroundColor: 'rgba(16, 21, 40, 0.7)', padding: '5rem', borderRadius: '40px', border: '1px solid rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(30px)' }}
                        >
                            <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>🎯</div>
                            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem' }}>Охотник за Трендами</h2>
                            <p style={{ color: '#c3c9d9', fontSize: '1.1rem', lineHeight: 1.8, marginBottom: '2.5rem' }}>
                                Быстро анализируйте карточки товаров. Решайте: <b>ЗАКУПАТЬ</b> (если тренд растет) или <b>ПРОПУСТИТЬ</b> (если он падает).
                            </p>
                            <button
                                onClick={startGame}
                                style={{ backgroundColor: '#8b5cf6', color: '#fff', border: 'none', padding: '1.5rem 5rem', borderRadius: '20px', fontSize: '1.2rem', fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                            >
                                Найти тренд
                            </button>
                        </motion.div>
                    )}

                    {gameState === 'playing' && currentTrend && (
                        <motion.div
                            key={currentTrend.id}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ x: feedback?.decision === 'buy' ? 500 : -500, opacity: 0, rotate: feedback?.decision === 'buy' ? 15 : -15 }}
                            style={{
                                width: '400px',
                                backgroundColor: 'rgba(16, 21, 40, 0.8)',
                                padding: '3rem',
                                borderRadius: '40px',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                backdropFilter: 'blur(20px)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '1.5rem',
                                position: 'relative'
                            }}
                        >
                            <div style={{ fontSize: '6rem', marginBottom: '1rem' }}>{currentTrend.image}</div>
                            <div style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', padding: '0.5rem 1.5rem', borderRadius: '100px', color: '#8b5cf6', fontSize: '0.7rem', fontWeight: 900 }}>{currentTrend.category}</div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, textAlign: 'center' }}>{currentTrend.name}</h2>
                            <p style={{ color: '#8a90a4', textAlign: 'center', fontSize: '0.9rem', lineHeight: 1.6 }}>{currentTrend.description}</p>

                            {feedback && (
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        backgroundColor: feedback.isCorrect ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)',
                                        borderRadius: '40px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        zIndex: 10
                                    }}
                                >
                                    <div style={{ fontSize: '4rem' }}>{feedback.isCorrect ? '✅' : '❌'}</div>
                                </motion.div>
                            )}

                            <div style={{ display: 'flex', gap: '1.5rem', width: '100%', marginTop: '1rem' }}>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleChoice('pass')}
                                    style={{ flex: 1, backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '2px solid #ef4444', color: '#ef4444', padding: '1.2rem', borderRadius: '20px', fontWeight: 900, cursor: 'pointer' }}
                                >
                                    ПРОПУСТИТЬ
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleChoice('buy')}
                                    style={{ flex: 1, backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '2px solid #10b981', color: '#10b981', padding: '1.2rem', borderRadius: '20px', fontWeight: 900, cursor: 'pointer' }}
                                >
                                    ЗАКУПАТЬ
                                </motion.button>
                            </div>
                        </motion.div>
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
                            <div style={{ fontSize: '6rem', marginBottom: '2rem' }}>📈</div>
                            <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1rem' }}>Анализ завершен</h2>
                            <p style={{ color: '#d1d5db', fontSize: '1.2rem', marginBottom: '3rem' }}>
                                Ваш портфель товаров сформирован. Посмотрим, насколько вы хороши в предсказании рыночных бурь.
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '4rem' }}>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '24px' }}>
                                    <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '0.8rem' }}>SCORE</div>
                                    <div style={{ fontSize: '4rem', fontWeight: 900, color: '#8b5cf6' }}>{score}</div>
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
                                    НОВЫЙ ПОИСК
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
