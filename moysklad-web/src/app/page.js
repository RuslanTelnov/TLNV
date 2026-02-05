'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function Home() {
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    }

    const cards = [
        {
            title: "Content Factory",
            description: "Генерация контента (SEO, Фото) с помощью ИИ",
            href: "/content-factory",
            color: "linear-gradient(135deg, #f472b6 0%, #db2777 100%)", // Pink
            icon: "🏭"
        },
        {
            title: "Номенклатуры WB",
            description: "Управление товарами Wildberries",
            href: "/wb-products",
            color: "linear-gradient(135deg, #cb11ab 0%, #481173 100%)", // WB colors roughly
            icon: "🛍️",
            backgroundImage: "url('https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')" // Shopping/E-commerce bg
        },
        {
            title: "Новые номенклатуры",
            description: "Недавно созданные товары",
            href: "/new-products",
            color: "linear-gradient(135deg, #10B981 0%, #059669 100%)", // Green
            icon: "✨"
        },
        {
            title: "Номенклатуры МойСклад",
            description: "Полная база товаров из МойСклад",
            href: "/ms-products",
            color: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", // Blue
            icon: "📦"
        },
        {
            title: "Market Scout",
            description: "Поиск и верификация товаров на WB",
            href: "/market-scout",
            color: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", // Amber/Orange
            icon: "🔍"
        },
        {
            title: "Tоп Товаров WB",
            description: "Мониторинг топ выдачи и хитов продаж",
            href: "/wb-top",
            color: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)", // Pink/Purple
            icon: "🔥"
        },
        {
            title: "Система Контроля",
            description: "Мониторинг очередей, ошибок и прогресса к 2000 карточек",
            href: "/conveyor",
            color: "linear-gradient(135deg, #10B981 0%, #3b82f6 100%)",
            icon: "⚙️"
        },

    ]

    return (
        <div style={{ minHeight: '100vh', background: 'var(--velveto-bg-primary)' }}>
            {/* Header */}
            <header style={{
                padding: '1.5rem 3rem',
                position: 'sticky',
                top: 0,
                zIndex: 100,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backdropFilter: 'blur(20px)',
                background: 'rgba(5, 8, 20, 0.8)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h1 style={{
                        fontSize: '1.8rem',
                        fontWeight: '300',
                        letterSpacing: '0.18em',
                        color: 'var(--velveto-text-primary)',
                        textTransform: 'uppercase'
                    }}>
                        VELVETO
                    </h1>
                    <span style={{
                        color: 'var(--velveto-accent-primary)',
                        fontSize: '0.7rem',
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        border: '1px solid var(--velveto-accent-primary)',
                        padding: '4px 8px',
                        borderRadius: '4px'
                    }}>
                        TECH
                    </span>
                </div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2rem'
                }}>
                    <div style={{
                        color: 'var(--velveto-text-secondary)',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        letterSpacing: '0.05em'
                    }}>
                        ADMIN PANEL
                    </div>
                    <Link href="/settings">
                        <motion.div
                            whileHover={{ rotate: 90 }}
                            style={{
                                cursor: 'pointer',
                                fontSize: '1.4rem',
                                opacity: 0.7,
                                display: 'flex'
                            }}
                        >
                            ⚙️
                        </motion.div>
                    </Link>
                </div>
            </header>

            <main className="container" style={{ paddingTop: '6rem', paddingBottom: '4rem' }}>
                <div style={{ marginBottom: '6rem', textAlign: 'center' }}>
                    <h2 style={{
                        fontSize: '4rem',
                        marginBottom: '1.5rem',
                        letterSpacing: '0.05em',
                        color: 'var(--velveto-text-primary)',
                        fontWeight: '200',
                        textTransform: 'uppercase'
                    }}>
                        Добро пожаловать
                    </h2>
                    <p style={{
                        color: 'var(--velveto-text-muted)',
                        fontSize: '1.2rem',
                        maxWidth: '600px',
                        margin: '0 auto',
                        lineHeight: '1.6'
                    }}>
                        Выберите модуль для начала работы с системой автоматизации
                    </p>
                </div>

                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                        gap: '2.5rem',
                        maxWidth: '1400px',
                        margin: '0 auto',
                        padding: '0 2rem'
                    }}
                >
                    {cards.map((card, index) => (
                        <Link key={index} href={card.href}>
                            <motion.div
                                variants={item}
                                whileHover={{ y: -10, scale: 1.02 }}
                                className="velveto-card"
                                style={{
                                    padding: '3rem',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    height: '100%',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {card.backgroundImage && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        backgroundImage: card.backgroundImage,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        opacity: 0.1,
                                        transition: 'opacity 0.3s ease',
                                        zIndex: 0,
                                        filter: 'grayscale(100%)'
                                    }} />
                                )}

                                {/* Gradient Background Effect */}
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: '2px',
                                    background: card.color,
                                    zIndex: 1,
                                    boxShadow: `0 0 20px ${card.color}`
                                }} />

                                <div style={{
                                    fontSize: '3rem',
                                    marginBottom: '2rem',
                                    background: 'rgba(255,255,255,0.03)',
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative',
                                    zIndex: 1,
                                    border: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    {card.icon}
                                </div>

                                <h3 style={{
                                    fontSize: '1.5rem',
                                    fontWeight: '400',
                                    color: 'var(--velveto-text-primary)',
                                    marginBottom: '1rem',
                                    letterSpacing: '0.05em',
                                    fontFamily: 'var(--velveto-font-display)',
                                    textTransform: 'uppercase'
                                }}>
                                    {card.title}
                                </h3>

                                <p style={{ color: 'var(--velveto-text-secondary)', lineHeight: '1.6', fontSize: '1rem' }}>
                                    {card.description}
                                </p>

                                <div style={{
                                    marginTop: 'auto',
                                    paddingTop: '3rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    color: 'var(--velveto-accent-primary)',
                                    fontWeight: '600',
                                    fontSize: '0.9rem',
                                    letterSpacing: '0.1em',
                                    textTransform: 'uppercase'
                                }}>
                                    Перейти <span style={{ marginLeft: '0.5rem' }}>→</span>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </motion.div>
            </main>
        </div>
    )
}
