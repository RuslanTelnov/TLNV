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
            description: 'Тренируй навык быстрого расчета юнит-экономики. У тебя есть всего 5 секунд, чтобы определить прибыльность товара!',
            icon: '💰',
            href: '/games/profit-hero',
            color: '#ffb35a',
            skills: ['Математика', 'Бизнес-анализ']
        },
        {
            id: 'tycoon',
            title: 'Marketplace Tycoon',
            description: 'Управляй капиталом и запасами в условиях меняющегося рынка. Выживи и заработай максимум за 10 ходов.',
            icon: '🏢',
            href: '/games/tycoon',
            color: '#fbbf24',
            skills: ['Стратегия', 'Риск-менеджмент']
        },
        {
            id: 'chat-master',
            title: 'Мастер Обратной Связи PRO',
            description: 'Научись виртуозно отвечать на сложные отзывы. Сохраняй репутацию бренда и лояльность клиентов в стрессовых ситуациях.',
            icon: '💬',
            href: '/games/chat-master',
            color: '#f59e0b',
            skills: ['Коммуникации', 'PR-менеджмент']
        },
        {
            id: 'warehouse-tetris',
            title: 'Логистический Тетрис',
            description: 'Оптимизируй загрузку контейнеров. Пакуй товары максимально плотно, чтобы снизить затраты на логистику.',
            icon: '📦',
            href: '/games/warehouse-tetris',
            color: '#10b981',
            skills: ['Логистика', 'Пространственное мышление']
        },
        {
            id: 'trend-hunter',
            title: 'Охотник за Трендами',
            description: 'Почувствуй пульс рынка. Быстро анализируй товары и решай, во что инвестировать сегодня.',
            icon: '🎯',
            href: '/games/trend-hunter',
            color: '#8b5cf6',
            skills: ['Анализ трендов', 'Интуиция']
        },
        {
            id: 'price-warrior',
            title: 'Битва Цен',
            description: 'Вступи в ценовую войну с конкурентами. Удерживай долю рынка, не жертвуя при этом прибылью своего бизнеса.',
            icon: '⚔️',
            href: '/games/price-warrior',
            color: '#ef4444',
            skills: ['Ценообразование', 'Тактика']
        }
    ]

    const containerStyle = {
        minHeight: '100vh',
        backgroundColor: '#050814',
        color: '#fff',
        padding: '5rem',
        position: 'relative',
        overflowX: 'hidden'
    }

    const gridStyle = {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '2.5rem',
        maxWidth: '1300px',
        margin: '0 auto'
    }

    const cardStyle = (color) => ({
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '32px',
        padding: '3rem',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'all 0.4s ease',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        backdropFilter: 'blur(10px)'
    })

    return (
        <div style={containerStyle}>
            {/* Ambient Background */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(255, 179, 90, 0.05) 0%, transparent 70%)', filter: 'blur(100px)' }} />
                <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, transparent 70%)', filter: 'blur(100px)' }} />
            </div>

            <header style={{ maxWidth: '1300px', margin: '0 auto 5rem auto', position: 'relative', zIndex: 10 }}>
                <BackButton href="/" />
                <h1 style={{ fontSize: '4rem', fontWeight: 800, letterSpacing: '-0.02em', marginTop: '2rem', marginBottom: '1rem' }}>
                    Вельвето <span style={{ color: '#ffb35a' }}>Академия</span>
                </h1>
                <p style={{ color: '#8a90a4', fontSize: '1.2rem', fontWeight: 300 }}>Профессиональный тренажер для селлеров маркетплейсов</p>
            </header>

            <div style={gridStyle}>
                {games.map((game) => (
                    <Link href={game.href} key={game.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <motion.div
                            whileHover={{ y: -10, backgroundColor: 'rgba(255, 255, 255, 0.04)', borderColor: `${game.color}44` }}
                            style={cardStyle(game.color)}
                        >
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: game.color }} />

                            <div style={{ fontSize: '4rem', marginBottom: '2rem', backgroundColor: 'rgba(255,255,255,0.03)', width: '100px', height: '100px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center' }}>
                                {game.icon}
                            </div>

                            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '1rem', textTransform: 'none', letterSpacing: 'normal' }}>{game.title}</h2>
                            <p style={{ color: '#8a90a4', fontSize: '1rem', lineHeight: 1.6, marginBottom: '2.5rem', flex: 1 }}>{game.description}</p>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', marginBottom: '2rem' }}>
                                {game.skills.map(skill => (
                                    <span key={skill} style={{ fontSize: '0.7rem', fontWeight: 700, backgroundColor: 'rgba(255,255,255,0.05)', color: '#c3c9d9', padding: '0.5rem 1rem', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.05)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        {skill}
                                    </span>
                                ))}
                            </div>

                            <div style={{ color: '#ffb35a', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                Начать тренировку <span>→</span>
                            </div>
                        </motion.div>
                    </Link>
                ))}
            </div>
        </div>
    )
}
