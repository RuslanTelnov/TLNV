'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

const slides = [
    {
        id: 'intro',
        title: 'ЭКОСИСТЕМА VELVETO',
        subtitle: 'ЕДИНЫЙ ЦЕНТР УПРАВЛЕНИЯ E-COMMERCE',
        content: 'Это не просто сервис — это ваш главный актив. Мы объединяем все маркетплейсы в одном окне. Вы получаете полный контроль над продажами, Склад/Логистику и Финансы в реальном времени.',
        bg: '/presentation/ecosystem.png',
        color: '#3b82f6'
    },
    {
        id: 'kaspi',
        title: 'РОБОТ-ЛОГИСТ KASPI',
        subtitle: '100% АВТОМАТИЗАЦИЯ ПОСТАВОК',
        content: 'Забудьте о ручном создании накладных. Наш робот сам заходит в кабинет Kaspi, скачивает заказы, создает документы в МойСклад и готовит акты для курьеров. Рост скорости обработки заказов в 5 раз.',
        bg: '/presentation/logistics.png',
        color: '#ef4444'
    },
    {
        id: 'analytics',
        title: 'УМНАЯ АНАЛИТИКА',
        subtitle: 'ABC-XYZ АНАЛИЗ И ПЛАНИРОВАНИЕ ЗАКУПОК',
        content: 'Система сама скажет, какой товар приносит прибыль, а какой — убытки. Автоматический расчет потребности склада на 30 дней вперед. Никаких упущенных продаж из-за отсутствия стока.',
        bg: '/presentation/analytics.png',
        color: '#10b981'
    },
    {
        id: 'parser',
        title: 'ПАРСИНГ И МОНИТОРИНГ',
        subtitle: 'ДАННЫЕ О КОНКУРЕНТАХ 24/7',
        content: 'Мы отслеживаем цены, остатки и позиции конкурентов на всех площадках. Автоматическое реагирование на изменения рынка и защита ваших маржинальных показателей.',
        bg: '/presentation/parser.png',
        color: '#f59e0b'
    },
    {
        id: 'future',
        title: 'МАСШТАБИРОВАНИЕ',
        subtitle: 'ГОТОВНОСТЬ К РОСТУ В 10 РАЗ',
        content: 'Архитектура Velveto готова к любым нагрузкам. Новые кабинеты, новые склады и новые страны подключаются за 15 минут. Мы растем вместе with вашим бизнесом.',
        bg: '/presentation/scaling.png',
        color: '#8b5cf6'
    }
]

export default function PresentationPage() {
    const [current, setCurrent] = useState(0)
    const [direction, setDirection] = useState(0)

    const nextSlide = () => {
        setDirection(1)
        setCurrent((prev) => (prev + 1) % slides.length)
    }

    const prevSlide = () => {
        setDirection(-1)
        setCurrent((prev) => (prev - 1 + slides.length) % slides.length)
    }

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ') nextSlide()
            if (e.key === 'ArrowLeft') prevSlide()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [current])

    const slide = slides[current]

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: '#050505',
            color: '#fff',
            overflow: 'hidden',
            fontFamily: 'Inter, system-ui, sans-serif',
            userSelect: 'none'
        }}>

            {/* Background Layer */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={slide.id + '-bg'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.15 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `url(${slide.bg})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'blur(80px) brightness(0.4)',
                        zIndex: 0
                    }}
                />
            </AnimatePresence>

            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.8) 100%)',
                zIndex: 1,
                pointerEvents: 'none'
            }} />

            {/* Top Bar: Controls */}
            <div style={{ position: 'absolute', top: '40px', left: '40px', zIndex: 100 }}>
                <Link href="/" style={{ textDecoration: 'none' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '14px 28px',
                        borderRadius: '16px',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.6)',
                        backdropFilter: 'blur(20px)',
                        transition: 'all 0.3s'
                    }} className="hover:bg-white/10 hover:text-white transition-all">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                            <polyline points="9 22 9 12 15 12 15 22"></polyline>
                        </svg>
                        <span style={{ fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '2px' }}>На главную</span>
                    </div>
                </Link>
            </div>

            {/* Bottom Bar: Navigation */}
            <div style={{
                position: 'absolute',
                bottom: '60px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 100,
                display: 'flex',
                alignItems: 'center',
                padding: '16px 40px',
                backgroundColor: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(30px)',
                borderRadius: '60px',
                border: '1px solid rgba(255,255,255,0.1)',
                gap: '40px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}>
                <button onClick={prevSlide} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }} className="hover:text-white transition-colors">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </button>

                <div style={{ display: 'flex', gap: '12px' }}>
                    {slides.map((_, idx) => (
                        <div key={idx} style={{
                            width: idx === current ? '40px' : '10px',
                            height: '6px',
                            borderRadius: '3px',
                            background: idx === current ? slides[idx].color : 'rgba(255,255,255,0.2)',
                            transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                            boxShadow: idx === current ? `0 0 25px ${slides[idx].color}88` : 'none'
                        }} />
                    ))}
                </div>

                <button onClick={nextSlide} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }} className="hover:text-white transition-colors">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                </button>
            </div>

            {/* Main Content Area */}
            <main style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                padding: '0 5%'
            }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)',
                    gap: '100px',
                    maxWidth: '1400px',
                    width: '100%',
                    alignItems: 'center'
                }} className="main-grid">

                    {/* Left Side: Content */}
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={slide.id + '-text'}
                            custom={direction}
                            initial={{ opacity: 0, x: direction > 0 ? -60 : 60 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: direction > 0 ? 60 : -60 }}
                            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                            style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div style={{
                                    color: slide.color,
                                    fontWeight: '900',
                                    letterSpacing: '8px',
                                    fontSize: '15px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '20px'
                                }}>
                                    <div style={{ width: '40px', height: '4px', background: slide.color }} />
                                    0{current + 1} // {slide.id.toUpperCase()}
                                </div>
                                <h1 style={{
                                    fontSize: 'min(8vw, 96px)',
                                    fontWeight: '950',
                                    margin: 0,
                                    lineHeight: 0.95,
                                    letterSpacing: '-5px',
                                    color: '#fff',
                                    textShadow: '0 20px 40px rgba(0,0,0,0.4)'
                                }}>
                                    {slide.title}
                                </h1>
                            </div>
                            <h2 style={{ fontSize: 'min(3vw, 36px)', fontWeight: '600', margin: 0, color: 'rgba(255,255,255,0.9)', lineHeight: 1.15 }}>
                                {slide.subtitle}
                            </h2>
                            <p style={{ fontSize: 'min(2vw, 22px)', lineHeight: 1.6, color: 'rgba(255,255,255,0.5)', maxWidth: '700px', margin: 0, fontWeight: '300' }}>
                                {slide.content}
                            </p>

                        </motion.div>
                    </AnimatePresence>

                    {/* Right Side: Visual */}
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={slide.id + '-img'}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                            style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}
                        >
                            <div style={{ position: 'absolute', width: '100%', height: '100%', background: slide.color, filter: 'blur(180px)', opacity: 0.15, borderRadius: '50%' }} />

                            <img
                                src={slide.bg}
                                alt={slide.title}
                                style={{
                                    width: '100%',
                                    maxHeight: '75vh',
                                    objectFit: 'contain',
                                    filter: 'drop-shadow(0 50px 100px rgba(0,0,0,0.8))',
                                    position: 'relative',
                                    zIndex: 2,
                                    borderRadius: '60px'
                                }}
                            />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            <style jsx>{`
                @media (max-width: 1024px) {
                    .main-grid {
                        grid-template-columns: 1fr !important;
                        gap: 60px !important;
                        padding-top: 100px;
                        text-align: center;
                    }
                    div[style*="flexDirection: column"] {
                        align-items: center !important;
                    }
                    p { max-width: 100% !important; }
                    div[style*="bottom: 60px"] { bottom: 30px !important; width: 90%; gap: 20px !important; padding: 12px 30px !important; }
                    div[style*="top: 40px"] { top: 20px !important; left: 20px !important; }
                    h1 { letter-spacing: -2px !important; }
                }
            `}</style>

        </div>
    )
}
