'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

// Assets Mapping
const assets = {
    intro: '/assets/presentation/presentation_intro_bg_1770805223390.png',
    kaspi: '/assets/presentation/presentation_kaspi_icon_1770805241888.png',
    perfume: '/assets/presentation/presentation_perfume_icon_1770805261559.png',
    ai: '/assets/presentation/presentation_ai_brain_1770805282386.png',
    mobile: '/assets/presentation/presentation_mobile_mockup_1770805319426.png',
}

const slides = [
    {
        id: 'intro',
        title: 'ЭКОСИСТЕМА VELVETO',
        subtitle: 'Единый центр управления E-commerce',
        bg: assets.intro,
        color: '#3b82f6',
        content: (
            <div className="flex flex-col gap-4">
                <div className="text-xl opacity-90 leading-relaxed">
                    Это не просто дашборд. Это <b>операционная система</b> вашего бизнеса. <br />
                    Мы объединили управление заказами, складом, аналитику и маркетинг в одном окне. <br />
                    Вы получаете <b>полный контроль</b> над процессами, исключая человеческий фактор и ошибки.
                </div>
                <div className="flex gap-4 mt-8">
                    <FeatureTag text="Склад" />
                    <FeatureTag text="Логистика" />
                    <FeatureTag text="Финансы" />
                    <FeatureTag text="Маркетинг" />
                </div>
            </div>
        )
    },
    {
        id: 'kaspi',
        title: 'РОБОТ-ЛОГИСТ KASPI',
        subtitle: 'Мгновенная обработка заказов 24/7',
        bg: assets.kaspi,
        color: '#ef4444',
        content: (
            <ul className="text-xl space-y-4 opacity-90">
                <li>🚀 <b className="text-white">Скорость</b>: Авто-прием заказа за 1.4 секунды. Вы никогда не упустите клиента.</li>
                <li>📦 <b className="text-white">Умная логистика</b>: Расчет габаритов и выбор тарифа. Экономия до 30% на ошибках.</li>
                <li>📄 <b className="text-white">Документы</b>: Этикетки и накладные печатаются одной кнопкой.</li>
                <li>🔍 <b className="text-white">Склад</b>: Синхронизация остатков каждые 5 минут. Нет отмен из-за "нет в наличии".</li>
            </ul>
        )
    },
    {
        id: 'perfume',
        title: 'БИЗНЕС-ПАНЕЛЬ S-PARFUM',
        subtitle: 'Ваше конкурентное преимущество',
        bg: assets.perfume,
        color: '#c9a05a',
        content: (
            <ul className="text-xl space-y-4 opacity-90">
                <li>💰 <b className="text-white">Чистая прибыль</b>: Система считает всё — от закупа до налога. Вы видите реальные деньги.</li>
                <li>👁️ <b className="text-white">Рынок на ладони</b>: Мониторинг цен конкурентов в реальном времени.</li>
                <li>📊 <b className="text-white">Глубокая аналитика</b>: Детализация продаж по коллекциям (Exclusive vs Luxury).</li>
                <li>🎯 <b className="text-white">Стратегия</b>: Понимайте, какой товар "качает", а какой тянет вниз.</li>
            </ul>
        )
    },
    {
        id: 'ai',
        title: 'НЕЙРОСЕТЕВОЕ ЯДРО',
        subtitle: 'Контент-отдел, который не спит',
        bg: assets.ai,
        color: '#ec4899',
        content: (
            <ul className="text-xl space-y-4 opacity-90">
                <li>✍️ <b className="text-white">SEO-тексты</b>: Генерация продающих описаний с ключевыми словами за секунды.</li>
                <li>🔝 <b className="text-white">Продвижение</b>: Оптимизированные карточки быстрее попадают в ТОП выдачи.</li>
                <li>🎨 <b className="text-white">Фото-контент</b>: AI улучшает качество и генерирует инфографику (в разработке).</li>
                <li>⚙️ <b className="text-white">Автоматизация</b>: Нейросеть берет на себя рутину, освобождая ваше время.</li>
            </ul>
        )
    },
    {
        id: 'mobile',
        title: 'БИЗНЕС В КАРМАНЕ',
        subtitle: 'Управление из любой точки мира',
        bg: assets.mobile,
        color: '#8b5cf6',
        content: (
            <ul className="text-xl space-y-4 opacity-90">
                <li>📱 <b className="text-white">Нативные приложения</b>: Полноценная работа на iOS и Android.</li>
                <li>🔔 <b className="text-white">Уведомления</b>: Будьте в курсе каждой продажи и статуса склада.</li>
                <li>🌍 <b className="text-white">Свобода</b>: Весь функционал десктопа в телефоне. Контролируйте бизнес даже в отпуске.</li>
                <li>🔒 <b className="text-white">Безопасность</b>: Ваши данные защищены современными протоколами шифрования.</li>
            </ul>
        )
    }
]

function FeatureTag({ text }) {
    return (
        <span className="px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-mono tracking-wider backdrop-blur-md text-white">
            {text}
        </span>
    )
}

export default function PresentationPage() {
    const [current, setCurrent] = useState(0)
    const [direction, setDirection] = useState(0)

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight' || e.key === 'Space') {
                nextSlide()
            } else if (e.key === 'ArrowLeft') {
                prevSlide()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [current])

    const nextSlide = () => {
        setDirection(1)
        setCurrent(prev => (prev + 1) % slides.length)
    }

    const prevSlide = () => {
        setDirection(-1)
        setCurrent(prev => (prev - 1 + slides.length) % slides.length)
    }

    const slide = slides[current]

    return (
        <div style={{ height: '100vh', width: '100vw', background: '#000', overflow: 'hidden', position: 'relative', fontFamily: 'Inter, sans-serif' }}>

            {/* Background Image with Blur */}
            <AnimatePresence initial={false} mode="wait">
                <motion.div
                    key={slide.id + '-bg'}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 0.4, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    style={{
                        position: 'absolute', inset: 0,
                        backgroundImage: `url(${slide.bg})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'blur(30px) brightness(0.5)',
                        zIndex: 0
                    }}
                />
            </AnimatePresence>

            {/* Main Content */}
            <div style={{ zIndex: 10, position: 'relative', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', maxWidth: '1600px', width: '90%', gap: '4rem', alignItems: 'center' }}>

                    {/* Left: Text Content */}
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={slide.id + '-text'}
                            custom={direction}
                            initial={{ x: direction > 0 ? -50 : 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: direction > 0 ? 50 : -50, opacity: 0 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
                        >
                            <div style={{
                                display: 'inline-block',
                                color: slide.color,
                                fontSize: '1rem',
                                letterSpacing: '0.3em',
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                borderLeft: `4px solid ${slide.color}`,
                                paddingLeft: '1rem'
                            }}>
                                0{current + 1} // {slide.id.toUpperCase()}
                            </div>

                            <h1 style={{
                                fontSize: '5rem',
                                lineHeight: '1',
                                fontWeight: '800',
                                background: `linear-gradient(to right, #fff, ${slide.color})`,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                margin: 0
                            }}>
                                {slide.title}
                            </h1>

                            <h2 style={{ fontSize: '2rem', fontWeight: '300', color: 'rgba(255,255,255,0.7)', margin: 0 }}>
                                {slide.subtitle}
                            </h2>

                            <div style={{ marginTop: '2rem', color: '#ccc' }}>
                                {slide.content}
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Right: Hero Image */}
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={slide.id + '-img'}
                            custom={direction}
                            initial={{ scale: 0.8, opacity: 0, rotateY: direction > 0 ? 45 : -45 }}
                            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                            exit={{ scale: 0.8, opacity: 0, rotateY: direction > 0 ? -45 : 45 }}
                            transition={{ duration: 0.7, type: "spring" }}
                            style={{
                                position: 'relative',
                                width: '100%',
                                aspectRatio: '1/1',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}
                        >
                            <div style={{
                                position: 'absolute',
                                inset: '10%',
                                background: slide.color,
                                filter: 'blur(100px)',
                                opacity: 0.3,
                                borderRadius: '50%'
                            }} />
                            <img
                                src={slide.bg}
                                alt={slide.title}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    filter: 'drop-shadow(0 20px 50px rgba(0,0,0,0.5))',
                                    transform: 'perspective(1000px) rotateY(-10deg)',
                                    borderRadius: '2rem'
                                }}
                            />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Navigation Controls */}
            <div style={{ position: 'absolute', bottom: '3rem', right: '3rem', display: 'flex', gap: '1rem', zIndex: 50 }}>
                <button onClick={prevSlide} style={{
                    padding: '1rem', borderRadius: '50%', background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer',
                    backdropFilter: 'blur(10px)'
                }}>
                    ←
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 1rem' }}>
                    {slides.map((_, idx) => (
                        <div key={idx} style={{
                            width: idx === current ? '30px' : '10px',
                            height: '4px',
                            borderRadius: '2px',
                            background: idx === current ? '#fff' : 'rgba(255,255,255,0.2)',
                            transition: 'all 0.3s'
                        }} />
                    ))}
                </div>
                <button onClick={nextSlide} style={{
                    padding: '1rem', borderRadius: '50%', background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer',
                    backdropFilter: 'blur(10px)'
                }}>
                    →
                </button>
            </div>

            {/* Home Link */}
            <Link href="/" style={{ position: 'absolute', top: '2rem', left: '2rem', zIndex: 100, textDecoration: 'none' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', letterSpacing: '0.1em', uppercase: 'true'
                }}>
                    <span>✕</span> CLOSE PRESENTATION
                </div>
            </Link>

        </div>
    )
}
