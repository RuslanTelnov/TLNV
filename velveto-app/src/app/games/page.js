'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import BackButton from '@/components/BackButton'

export default function GamesHub() {
    const games = [
        {
            id: 'profit-hero',
            title: 'Герой Маржи',
            description: 'Аркадный тренажер для оттачивания бизнес-интуиции. Успей за 5 секунд рассчитать, принесет ли товар прибыль или убьет твой бюджет.',
            icon: '⚡',
            href: '/games/profit-hero',
            color: '#3b82f6',
            skills: ['Скорость', 'Интуиция']
        },
        {
            id: 'pl-architect',
            title: 'P&L Архитектор 2.0',
            description: 'Тяжелый симулятор юнит-экономики. Выполняй миссии, выживай в условиях кризиса логистики и демпинга конкурентов.',
            icon: '📊',
            href: '/games/pl-architect',
            color: '#10b981',
            skills: ['Стратегия', 'P&L']
        },
        {
            id: 'warehouse-tetris',
            title: 'Логистик-Тетрис',
            description: 'Оптимизируй каждый кубический сантиметр. Плотная упаковка — ключ к снижению фулфилмента и росту маржи.',
            icon: '📦',
            href: '/games/warehouse-tetris',
            color: '#8b5cf6',
            skills: ['Логистика', 'Оптимизация']
        },
        {
            id: 'scale-master',
            title: 'Эра Масштабирования',
            description: 'Питчинг инвесторам и жесткие переговоры с китайскими заводами. Получи капитал и выбей лучшие условия поставки.',
            icon: '📈',
            href: '/games/scale-master',
            color: '#0ea5e9',
            skills: ['Инвестиции', 'Переговоры']
        },
        {
            id: 'chat-master',
            title: 'Мастер Диалога PRO',
            description: 'Отработка сложной обратной связи. Превращай яростный негатив в лояльных фанатов бренда за считанные секунды.',
            icon: '💬',
            href: '/games/chat-master',
            color: '#ec4899',
            skills: ['PR', 'Коммуникации']
        },
        {
            id: 'supply-chain',
            title: 'Supply Chain Master',
            description: 'Глобальное управление цепочками поставок. Найди баланс между дефицитом и заморозкой оборотного капитала.',
            icon: '⛓️',
            href: '/games/supply-chain',
            color: '#6366f1',
            skills: ['Закупки', 'Планирование']
        }
    ]

    return (
        <div className="hub-container">
            <style jsx global>{`
                .hub-container {
                    min-height: 100vh;
                    background-color: #050814;
                    color: #fff;
                    padding: 5rem 2rem;
                    position: relative;
                    overflow-x: hidden;
                    overflow-y: visible; /* Ensure scroll isn't trapped */
                    width: 100%;
                }
                .ambient-bg {
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                    z-index: 0;
                }
                .hub-header {
                    max-width: 1300px;
                    margin: 0 auto 5rem auto;
                    position: relative;
                    z-index: 10;
                }
                .hub-title {
                    font-size: 4rem;
                    font-weight: 900;
                    letter-spacing: -1.5px;
                    margin-bottom: 0.8rem;
                    line-height: 1.1;
                    word-break: break-word;
                    text-transform: uppercase;
                }
                .hub-subtitle {
                    color: #8a90a4;
                    font-size: 1.3rem;
                    font-weight: 500;
                    opacity: 0.8;
                    margin: 0;
                }
                .games-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
                    gap: 2rem;
                    max-width: 1300px;
                    margin: 0 auto;
                    position: relative;
                    z-index: 10;
                }
                .game-card {
                    background: linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%);
                    background-color: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 32px;
                    padding: 3rem;
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    cursor: pointer;
                    position: relative;
                    overflow: hidden;
                    backdrop-filter: blur(20px);
                    transition: all 0.4s ease;
                    text-decoration: none;
                }
                .game-icon-box {
                    font-size: 3.5rem;
                    margin-bottom: 1.5rem;
                    background-color: rgba(255,255,255,0.03);
                    width: 90px;
                    height: 90px;
                    border-radius: 22px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid rgba(255,255,255,0.05);
                }

                @media (max-width: 1024px) {
                    .hub-container {
                        padding: 2rem 1rem !important;
                    }
                    .hub-header {
                        margin-bottom: 2.5rem !important;
                    }
                    .hub-title {
                        font-size: 1.8rem !important;
                        letter-spacing: -1px !important;
                        line-height: 1.2 !important;
                    }
                    .hub-subtitle {
                        font-size: 1rem !important;
                    }
                    .games-grid {
                        grid-template-columns: 1fr !important;
                        gap: 1.2rem !important;
                    }
                    .game-card {
                        padding: 1.8rem !important;
                    }
                    .game-icon-box {
                        width: 70px !important;
                        height: 70px !important;
                        font-size: 2.2rem !important;
                        margin-bottom: 1.2rem !important;
                    }
                    .game-description {
                        font-size: 0.9rem !important;
                    }
                }
            `}</style>

            <div className="ambient-bg">
                <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(255, 179, 90, 0.08) 0%, transparent 70%)', filter: 'blur(100px)' }} />
                <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)', filter: 'blur(100px)' }} />
            </div>

            <header className="hub-header">
                <div style={{ marginBottom: '1.5rem' }}><BackButton href="/" /></div>
                <h1 className="hub-title">
                    ВЕЛЬВЕТО <span style={{ color: '#ffb35a' }}>АКАДЕМИЯ</span>
                </h1>
                <p className="hub-subtitle">Бизнес-симуляторы для профессиональных селлеров</p>
            </header>

            <div className="games-grid">
                {games.map((game) => (
                    <Link href={game.href} key={game.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <motion.div
                            whileHover={{ y: -8, backgroundColor: 'rgba(255, 255, 255, 0.04)', borderColor: `${game.color}44`, boxShadow: `0 20px 40px rgba(0,0,0,0.4)` }}
                            className="game-card"
                        >
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: game.color }} />

                            <div className="game-icon-box">
                                {game.icon}
                            </div>

                            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '0.8rem', letterSpacing: '-0.5px' }}>{game.title}</h2>
                            <p className="game-description" style={{ color: '#94a3b8', lineHeight: 1.6, marginBottom: '2rem', flex: 1 }}>{game.description}</p>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
                                {game.skills.map(skill => (
                                    <span key={skill} style={{ fontSize: '0.6rem', fontWeight: 900, backgroundColor: 'rgba(255,255,255,0.04)', color: '#c3c9d9', padding: '0.4rem 0.9rem', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.05)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                        {skill}
                                    </span>
                                ))}
                            </div>

                            <div style={{ color: '#ffb35a', fontWeight: 900, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                                НАЧАТЬ ТРЕНИРОВКУ <motion.span animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 2 }}>→</motion.span>
                            </div>
                        </motion.div>
                    </Link>
                ))}
            </div>
            <div style={{ height: '5rem' }} />
        </div>
    )
}
