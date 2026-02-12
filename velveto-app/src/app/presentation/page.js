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

            {/* Background Image with Blur and Overlay */}
            <AnimatePresence initial={false} mode="wait">
                <motion.div
                    key={slide.id + '-bg'}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    style={{
                        position: 'absolute', inset: 0,
                        backgroundImage: `url(${slide.bg})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'blur(40px) brightness(0.3)',
                        zIndex: 0
                    }}
                />
            </AnimatePresence>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.4) 100%)', zIndex: 1 }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.2), transparent 20%, transparent 80%, rgba(0,0,0,0.2))', zIndex: 1 }} />

            {/* Main Content */}
            <div className="relative z-10 h-full flex items-center justify-center p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 max-w-[1600px] w-full gap-8 md:gap-16 items-center">

                    {/* Left: Text Content */}
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={slide.id + '-text'}
                            custom={direction}
                            initial={{ x: direction > 0 ? -50 : 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: direction > 0 ? 50 : -50, opacity: 0 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="flex flex-col gap-4 md:gap-8 order-2 md:order-1"
                        >
                            <div
                                className="inline-flex items-center text-[0.75rem] md:text-[0.875rem] font-bold uppercase mb-1 md:mb-2"
                                style={{
                                    color: slide.color,
                                    letterSpacing: '0.4em',
                                    borderLeft: `4px solid ${slide.color}`,
                                    paddingLeft: '1rem',
                                }}
                            >
                                0{current + 1} // {slide.id.toUpperCase()}
                            </div>

                            <h1 className="text-3xl md:text-8xl font-black leading-[1.1] tracking-tight" style={{
                                background: `linear-gradient(to bottom right, #fff 30%, ${slide.color} 100%)`,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                margin: 0,
                                filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))'
                            }}>
                                {slide.title}
                            </h1>

                            <h2 className="text-lg md:text-3xl font-medium text-white/80 m-0 tracking-wide max-w-2xl leading-snug">
                                {slide.subtitle}
                            </h2>

                            <div className="mt-4 md:mt-10 text-gray-200 text-base md:text-xl leading-relaxed">
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
                            className="relative w-full flex justify-center items-center order-1 md:order-2"
                        >
                            <div style={{
                                position: 'absolute',
                                inset: '5%',
                                background: slide.color,
                                filter: 'blur(120px)',
                                opacity: 0.2,
                                borderRadius: '50%'
                            }} />
                            <div className="relative w-full h-full flex justify-center items-center p-4">
                                <img
                                    src={slide.bg}
                                    alt={slide.title}
                                    className="max-h-[35vh] md:max-h-[70vh] w-full object-contain rounded-[2rem] md:rounded-[2.5rem] border border-white/10"
                                    style={{
                                        filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.7))',
                                        transform: 'perspective(1500px) rotateY(-5deg) rotateX(2deg)',
                                    }}
                                />
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Navigation Controls */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:bottom-12 md:right-12 flex items-center gap-6 z-50">
                <button
                    onClick={prevSlide}
                    className="group w-14 h-14 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center cursor-pointer backdrop-blur-xl hover:bg-white/10 hover:border-white/30 active:scale-95 transition-all duration-300"
                    aria-label="Previous slide"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </button>

                <div className="flex items-center gap-2 mx-2">
                    {slides.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => {
                                setDirection(idx > current ? 1 : -1)
                                setCurrent(idx)
                            }}
                            className="transition-all duration-300"
                            style={{
                                width: idx === current ? '24px' : '6px',
                                height: '6px',
                                borderRadius: '3px',
                                background: idx === current ? slide.color : 'rgba(255,255,255,0.2)',
                            }}
                        />
                    ))}
                </div>

                <button
                    onClick={nextSlide}
                    className="group w-14 h-14 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center cursor-pointer backdrop-blur-xl hover:bg-white/10 hover:border-white/30 active:scale-95 transition-all duration-300"
                    aria-label="Next slide"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                </button>
            </div>

            {/* Home Link */}
            <Link href="/" className="absolute top-6 left-6 md:top-8 md:left-8 z-50 group no-underline">
                <div className="flex items-center gap-2 md:gap-3 text-white/60 group-hover:text-white transition-colors py-1.5 px-3 md:py-2 md:px-4 rounded-lg md:rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                    <span className="text-[10px] md:text-sm font-bold tracking-[0.2em] uppercase">На главную</span>
                </div>
            </Link>

        </div >
    )
}
