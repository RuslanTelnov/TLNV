'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { OnboardingTour } from '@/components/OnboardingTour'

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

    const highlightCards = [
        {
            title: "Заказы Kaspi",
            description: "Мониторинг и управление заказами Kaspi",
            href: "/orders",
            color: "linear-gradient(135deg, #f87171 0%, #b91c1c 100%)", // Red for Kaspi
            icon: "🚨"
        }
    ];

    const toolCards = [
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
            title: "Система Контроля",
            description: "Мониторинг очередей, ошибок и прогресса к 2000 карточек",
            href: "/conveyor",
            color: "linear-gradient(135deg, #10B981 0%, #3b82f6 100%)",
            icon: "⚙️"
        }
    ];

    const analyticsCards = [
        {
            title: "Анализ S-Parfum",
            description: "Мониторинг цен конкурентов и новинок S-Parfum",
            href: "/s-parfum",
            color: "linear-gradient(135deg, #c9a05a 0%, #a88241 100%)", // Gold
            icon: "✨"
        },
        {
            title: "Tоп Товаров WB",
            description: "Мониторинг топ выдачи и хитов продаж",
            href: "/wb-top",
            color: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)", // Pink/Purple
            icon: "🔥"
        },
        {
            title: "ABC / XYZ Анализ",
            description: "Классификация товаров по прибыли и стабильности спроса",
            href: "/analytics",
            color: "linear-gradient(135deg, #10b981 0%, #3b82f6 100%)", // Green to Blue
            icon: "📊"
        }
    ];

    const academyCards = [
        {
            title: "Вельвето Академия",
            description: "Развивающие игры и тренажеры для бизнеса",
            href: "/games",
            color: "linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)", // Purple to Pink
            icon: "🎓",
            badge: "NEW"
        }
    ];

    return (
        <div className="dashboard-container" style={{ minHeight: '100vh', background: 'var(--velveto-bg-primary)' }}>
            <style jsx global>{`
                .container-padding {
                    padding-top: 6rem;
                    padding-bottom: 4rem;
                    padding-left: 2rem; 
                    padding-right: 2rem;
                }
                .header-padding {
                    padding: 1.5rem 3rem;
                }
                .section-header-padding {
                    padding-left: 2rem;
                }
                .card-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
                    gap: 2.5rem;
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 0 2rem;
                }
                .welcome-title {
                    font-size: 4rem;
                }
                .card-padding {
                    padding: 3rem;
                }
                
                @media (max-width: 768px) {
                    .container-padding {
                        padding-top: 5rem;
                        padding-left: 1rem;
                        padding-right: 1rem;
                    }
                    .header-padding {
                        padding: 1rem 1.5rem;
                    }
                    .section-header-padding {
                        padding-left: 1rem;
                    }
                    .card-grid {
                        grid-template-columns: 1fr;
                        gap: 1.25rem;
                        padding: 0 1.25rem;
                    }
                    .welcome-title {
                        font-size: 2.5rem !important;
                    }
                    .card-padding {
                        padding: 1.5rem !important;
                        min-height: auto !important;
                    }
                    .card-icon {
                        width: 60px !important;
                        height: 60px !important;
                        font-size: 2rem !important;
                        margin-bottom: 1.5rem !important;
                    }
                    .section-title {
                        font-size: 1.1rem !important;
                        margin-bottom: 1.25rem !important;
                        margin-left: 1.25rem !important;
                        padding-left: 0.75rem !important;
                    }
                    .header-logo-text {
                        font-size: 1.4rem !important;
                    }
                    .header-badge {
                        display: none !important;
                    }
                }
            `}</style>

            {/* Header */}
            <header className="header-padding" style={{
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
                    <h1 id="tour-logo" className="header-logo-text" style={{
                        fontSize: '1.8rem',
                        fontWeight: '300',
                        letterSpacing: '0.18em',
                        color: 'var(--velveto-text-primary)',
                        textTransform: 'uppercase'
                    }}>
                        VELVETO
                    </h1>
                    <span className="header-badge" style={{
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
                    <div className="hide-mobile" style={{
                        color: 'var(--velveto-text-secondary)',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        letterSpacing: '0.05em',
                        display: 'none'
                    }}>
                        ADMIN
                    </div>
                    <Link href="/presentation" className="desktop-only" style={{ textDecoration: 'none' }}>
                        <motion.div
                            whileHover={{ scale: 1.1, color: '#fff' }}
                            style={{
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                color: 'var(--velveto-text-secondary)',
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                border: '1px solid rgba(255,255,255,0.2)',
                                padding: '0.4rem 0.8rem',
                                borderRadius: '4px',
                                marginRight: '1rem'
                            }}
                        >
                            PLAY DEMO
                        </motion.div>
                    </Link>
                    <Link href="/settings">
                        <motion.div
                            id="tour-settings"
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

            <main className="container-padding">
                <div style={{ marginBottom: '4rem', textAlign: 'center' }}>
                    <h2 className="welcome-title" style={{
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

                {/* Kaspi Orders Section - Dedicated */}
                <div id="tour-kaspi" style={{ marginBottom: '4rem' }}>
                    <h3 className="section-title section-header-padding" style={{
                        fontSize: '1.5rem',
                        fontWeight: '300',
                        color: '#ef4444',
                        marginBottom: '2rem',
                        borderLeft: '2px solid #ef4444',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em'
                    }}>
                        Kaspi
                    </h3>
                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="card-grid"
                    >
                        {highlightCards.map((card, index) => (
                            <Link key={index} href={card.href} style={{ textDecoration: 'none' }}>
                                <motion.div
                                    variants={item}
                                    whileHover={{ y: -5, scale: 1.01 }}
                                    className="velveto-card card-padding"
                                    style={{
                                        cursor: 'pointer',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        height: '100%',
                                        transition: 'all 0.3s ease',
                                        minHeight: '300px'
                                    }}
                                >
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

                                    <div className="card-icon" style={{
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
                                        paddingTop: '2rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        color: '#ef4444',
                                        fontWeight: '600',
                                        fontSize: '0.9rem',
                                        letterSpacing: '0.1em',
                                        textTransform: 'uppercase'
                                    }}>
                                        Открыть заказы <span style={{ marginLeft: '0.5rem' }}>→</span>
                                    </div>
                                </motion.div>
                            </Link>
                        ))}
                    </motion.div>
                </div>

                <div id="tour-tools" style={{ marginBottom: '4rem' }}>
                    <h3 className="section-title section-header-padding" style={{
                        fontSize: '1.5rem',
                        fontWeight: '300',
                        color: 'var(--velveto-text-secondary)',
                        marginBottom: '2rem',
                        borderLeft: '2px solid var(--velveto-accent-primary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em'
                    }}>
                        Инструменты Управления
                    </h3>
                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="card-grid"
                    >
                        {toolCards.map((card, index) => (
                            <Link key={index} href={card.href} style={{ textDecoration: 'none' }}>
                                <motion.div
                                    variants={item}
                                    whileHover={{ y: -5, scale: 1.01 }}
                                    className="velveto-card card-padding"
                                    style={{
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

                                    <div className="card-icon" style={{
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
                                        paddingTop: '2rem',
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
                </div>

                <div id="tour-analytics">
                    <h3 className="section-title section-header-padding" style={{
                        fontSize: '1.5rem',
                        fontWeight: '300',
                        color: 'var(--velveto-text-secondary)',
                        marginBottom: '2rem',
                        borderLeft: '2px solid var(--velveto-accent-primary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em'
                    }}>
                        Аналитика и Финансы
                    </h3>
                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="card-grid"
                    >
                        {analyticsCards.map((card, index) => (
                            <Link key={index} href={card.href} style={{ textDecoration: 'none' }}>
                                <motion.div
                                    variants={item}
                                    whileHover={{ y: -5, scale: 1.01 }}
                                    className="velveto-card card-padding"
                                    style={{
                                        cursor: 'pointer',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        height: '100%',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
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

                                    <div className="card-icon" style={{
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
                                        paddingTop: '2rem',
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
                </div>

                {/* Academy Section */}
                <div style={{ marginBottom: '4rem' }}>
                    <h3 className="section-title section-header-padding" style={{
                        fontSize: '1.5rem',
                        fontWeight: '300',
                        color: '#d946ef',
                        marginBottom: '2rem',
                        borderLeft: '2px solid #d946ef',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em'
                    }}>
                        Обучение и Развитие
                    </h3>
                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="card-grid"
                    >
                        {academyCards.map((card, index) => (
                            <Link key={index} href={card.href} style={{ textDecoration: 'none' }}>
                                <motion.div
                                    variants={item}
                                    whileHover={{ y: -5, scale: 1.01 }}
                                    className="velveto-card card-padding"
                                    style={{
                                        cursor: 'pointer',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        height: '100%',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
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
                                        position: 'absolute',
                                        top: '1rem',
                                        right: '1rem',
                                        background: '#d946ef',
                                        color: '#fff',
                                        fontSize: '0.7rem',
                                        fontWeight: 'bold',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        zIndex: 2
                                    }}>
                                        {card.badge}
                                    </div>

                                    <div className="card-icon" style={{
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
                                        paddingTop: '2rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        color: '#d946ef',
                                        fontWeight: '600',
                                        fontSize: '0.9rem',
                                        letterSpacing: '0.1em',
                                        textTransform: 'uppercase'
                                    }}>
                                        Играть сейчас <span style={{ marginLeft: '0.5rem' }}>→</span>
                                    </div>
                                </motion.div>
                            </Link>
                        ))}
                    </motion.div>
                </div>
            </main>
            <OnboardingTour />
        </div>
    )
}
