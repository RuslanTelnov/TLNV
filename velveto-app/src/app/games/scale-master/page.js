'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import BackButton from '@/components/BackButton'
import confetti from 'canvas-confetti'

// --- STORY DATA ---
const STORY = [
    {
        id: 'intro',
        scene: 'Night Office',
        text: '3 часа ночи. Твой склад пуст, а кассовый разрыв давит как бетонная плита. У тебя есть один шанс: завтра в 10:00 встреча с «Акулой» из G-Capital. Тебе нужны 50 миллионов тенге, чтобы захватить рынок.',
        cta: 'Принять вызов',
        next: 'stats_select'
    },
    {
        id: 'pitch_start',
        scene: 'Sky Tower 42nd Floor',
        character: 'Дмитрий (Инвестор)',
        text: '— Слушай, я видел сотни таких как ты. Все хотят «масштабироваться». Но цифры не врут. Покажи мне, почему я не должен выкинуть твой проект в корзину прямо сейчас?',
        options: [
            { text: 'Давить на ROI и долю рынка (Логика)', skill: 'logic', value: 15, response: '— Хм, интересные цифры. Продолжай.' },
            { text: 'Рассказать историю успеха и миссию (Харизма)', skill: 'charisma', value: 15, response: '— Красиво поешь. Посмотрим, что за этим стоит.' },
            { text: 'Показать слабые места конкурентов (Агрессия)', skill: 'aggression', value: 15, response: '— Жестко. Мне нравится такой напор.' }
        ]
    }
]

const PITCH_QUESTIONS = [
    {
        id: 'cac_question',
        q: 'Дмитрий лениво крутит ручку: — Твой CAC (стоимость привлечения) растет уже три месяца. Как ты собираешься его удерживать при масштабировании на х10?',
        options: [
            { text: 'Мы переходим на собственную нейросеть для закупа трафика.', value: 25, impact: 'trust', detail: '— Нейросети? Это модно. Но покажи мне тесты.' },
            { text: 'Просто зальем рынок деньгами и вытесним всех!', value: -35, impact: 'trust', detail: '— Ты просто хочешь сжечь мои деньги. Вон отсюда.' },
            { text: 'CAC стабилизируется за счет LTV и повторных продаж.', value: 15, impact: 'trust', detail: '— Стандартно, но надежно. Ладно.' }
        ]
    },
    {
        id: 'team_question',
        q: '— Окей, а кто за всем этим стоит? Кто твои топы? Если ты завтра попадешь под автобус, мой капитал сгорит вместе с тобой?',
        options: [
            { text: 'У нас сильная команда сооснователей из BigTech.', value: 20, impact: 'trust', detail: '— Это уже серьезный разговор.' },
            { text: 'Я сам контролирую каждый процесс 24/7.', value: -15, impact: 'trust', detail: '— Ты — бутылочное горлышко. Это огромный риск.' },
            { text: 'Мы строим систему, которая работает автономно.', value: 10, impact: 'trust', detail: '— Звучит как план.' }
        ]
    },
    {
        id: 'exit_question',
        q: '— И последний вопрос. Какой мой выход? Когда и кому мы продадим этот бизнес через 3 года?',
        options: [
            { text: 'Нацелены на IPO или поглощение экосистемой.', value: 20, impact: 'trust', detail: '— Амбициозно. Мне нравится.' },
            { text: 'Будем просто платить жирные дивиденды.', value: 5, impact: 'trust', detail: '— Скучно, но честно.' },
            { text: 'Там видно будет, рынок покажет.', value: -25, impact: 'trust', detail: '— У тебя нет стратегии выхода. Плохо.' }
        ]
    }
]

const SHENZHEN_VIBE = [
    {
        character: 'Мистер Ван (Владелец завода)',
        text: 'Вы стоите в цеху, где собирают твой товар. Вокруг шум станков. Мистер Ван улыбается, но в глазах — холодный расчет. — Мой завод работает на Apple. Зачем мне тратить время на твой мелкий заказ, если ты просишь такую низкую цену?',
        options: [
            { text: 'Показать годовой план закупок от инвестора (Давить объемом)', win: 0.8, price: -2, response: '— Теперь я вижу серьезные намерения.' },
            { text: 'Предложить 50% предоплаты наличными (Риск)', win: 0.95, price: -1, response: '— Вы понимаете бизнес. Хорошо.' },
            { text: 'Намекнуть на инспекцию качества (Жестко)', win: 0.4, price: -4, response: '— Вы слишком самоуверенны для новичка.' }
        ]
    }
]

export default function ScaleMaster() {
    const [gameState, setGameState] = useState('start')
    const [scene, setScene] = useState('intro')
    const [heroStats, setHeroStats] = useState({ logic: 10, charisma: 10, aggression: 10 })
    const [trust, setTrust] = useState(40) // Target 100
    const [budget, setBudget] = useState(0)
    const [tension, setTension] = useState(20)
    const [step, setStep] = useState(0)
    const [dialogue, setDialogue] = useState('')
    const [narration, setNarration] = useState(STORY[0].text)

    const nextScene = (id) => {
        setScene(id)
        if (id === 'pitch_1') setDialogue(PITCH_QUESTIONS[0].q)
        if (id === 'china_start') setNarration('Перелет Алматы — Шэньчжэнь. Ты в Китае. Бюджет подтвержден, но битва за юнит-экономику только начинается.')
    }

    const handleChoice = (opt) => {
        let nextTrust = trust
        if (opt.impact === 'trust') {
            nextTrust = Math.max(0, Math.min(100, trust + opt.value))
            setTrust(nextTrust)
        }

        if (opt.skill) setHeroStats(s => ({ ...s, [opt.skill]: s[opt.skill] + opt.value }))

        setDialogue(opt.detail || opt.response)

        setTimeout(() => {
            if (nextTrust <= 0) {
                setScene('failure')
                return
            }

            if (scene === 'pitch_start') {
                nextScene('pitch_1')
            } else if (scene === 'pitch_1') {
                if (step < PITCH_QUESTIONS.length - 1) {
                    setStep(s => s + 1)
                    setDialogue('')
                } else {
                    if (nextTrust >= 70) {
                        setBudget(50000000)
                        nextScene('china_start')
                    } else {
                        setScene('failure')
                    }
                }
            }
        }, 2000)
    }

    const handleDeal = (opt) => {
        const roll = Math.random() < opt.win
        setTension(t => t + 40)

        if (roll) {
            setBudget(b => b * 1.5)
            setDialogue('Мистер Ван пожимает руку. Контракт твой!')
            confetti({ particleCount: 200, spread: 100 })
            setTimeout(() => setScene('success'), 2500)
        } else {
            setDialogue('Мистер Ван уходит. Сделка сорвана.')
            setTimeout(() => setScene('failure'), 2500)
        }
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#02040a', color: '#e2e8f0', fontFamily: 'Outfit, sans-serif' }}>
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(14, 165, 233, 0.1) 0%, transparent 70%)', filter: 'blur(100px)' }} />
                <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, transparent 70%)', filter: 'blur(100px)' }} />
            </div>

            <header style={{ position: 'relative', zIndex: 10, padding: '2rem 4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <BackButton href="/games" />
                <div style={{ display: 'flex', gap: '3rem' }}>
                    <StatItem label="РЕСУРСЫ" value={`${(budget / 1000000).toFixed(1)}M`} color="#10b981" />
                    <StatItem label="ДОВЕРИЕ" value={`${trust}%`} color="#0ea5e9" />
                    <StatItem label="НАПРЯЖЕНИЕ" value={`${tension}%`} color="#ef4444" />
                </div>
            </header>

            <main style={{ position: 'relative', zIndex: 10, maxWidth: '1000px', margin: '4rem auto', padding: '0 2rem' }}>
                <AnimatePresence mode="wait">
                    {scene === 'intro' && (
                        <SceneLayout key="intro" emoji="🌇" title="Эра Масштабирования" text={STORY[0].text}>
                            <HeroButton onClick={() => nextScene('pitch_start')}>ЗАНЯТЬ МЕСТО В ОЧЕРЕДИ</HeroButton>
                        </SceneLayout>
                    )}

                    {scene === 'pitch_start' && (
                        <DialogLayout key="pitch_start" character="Дмитрий" title="G-Capital Tower" text={STORY[1].text} dialogue={dialogue}>
                            {STORY[1].options.map((opt, i) => (
                                <ChoiceButton key={i} onClick={() => handleChoice(opt)}>{opt.text}</ChoiceButton>
                            ))}
                        </DialogLayout>
                    )}

                    {scene === 'pitch_1' && (
                        <DialogLayout key="pitch_1" character="Дмитрий" title={`Битва за чек (${step + 1}/${PITCH_QUESTIONS.length})`} text={PITCH_QUESTIONS[step].q} dialogue={dialogue}>
                            {PITCH_QUESTIONS[step].options.map((opt, i) => (
                                <ChoiceButton key={i} onClick={() => handleChoice(opt)}>{opt.text}</ChoiceButton>
                            ))}
                        </DialogLayout>
                    )}

                    {scene === 'china_start' && (
                        <SceneLayout key="china" emoji="🇨🇳" title="Шэньчжэнь: Фабрика №8" text={SHENZHEN_VIBE[0].text} dialogue={dialogue}>
                            {SHENZHEN_VIBE[0].options.map((opt, i) => (
                                <ChoiceButton key={i} onClick={() => handleDeal(opt)}>{opt.text}</ChoiceButton>
                            ))}
                        </SceneLayout>
                    )}

                    {scene === 'success' && (
                        <SceneLayout key="success" emoji="💎" title="Твоя Империя Создана" text="Ты сделал невозможное. Инвестиции получены, завод работает на твоих условиях. Капитализация компании взлетела до небес.">
                            <HeroButton onClick={() => window.location.reload()}>ЕЩЕ ОДИН КРУГ</HeroButton>
                        </SceneLayout>
                    )}

                    {scene === 'failure' && (
                        <SceneLayout key="failure" emoji="💀" title="Банкротство" text="Мир маркетплейсов жесток. Тебе не хватило аргументов или удачи. Ты остался с пустыми руками и полным складом долгов.">
                            <HeroButton onClick={() => window.location.reload()}>ПОПРОБОВАТЬ СНОВА</HeroButton>
                        </SceneLayout>
                    )}
                </AnimatePresence>
            </main>
        </div>
    )
}

function StatItem({ label, value, color }) {
    return (
        <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.6rem', color: '#8a90a4', fontWeight: 800, letterSpacing: '2px', marginBottom: '4px' }}>{label}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color }}>{value}</div>
        </div>
    )
}

function SceneLayout({ title, text, emoji, children, dialogue }) {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '5rem', marginBottom: '2rem' }}>{emoji}</div>
            <h1 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '2rem', background: 'linear-gradient(to right, #fff, #8a90a4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{title}</h1>
            <p style={{ fontSize: '1.2rem', color: '#94a3b8', lineHeight: 1.8, marginBottom: '3rem', maxWidth: '700px', margin: '0 auto 3rem auto' }}>{text}</p>
            {dialogue && <p style={{ backgroundColor: 'rgba(14, 165, 233, 0.1)', padding: '1.5rem', borderRadius: '16px', color: '#0ea5e9', fontWeight: 700, marginBottom: '2rem' }}>{dialogue}</p>}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem' }}>{children}</div>
        </motion.div>
    )
}

function DialogLayout({ character, title, text, children, dialogue }) {
    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '4rem' }}>
            <div>
                <div style={{ fontSize: '0.8rem', color: '#0ea5e9', fontWeight: 800, letterSpacing: '3px', marginBottom: '1rem' }}>{title}</div>
                <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '2rem' }}>{character}</h2>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '2.5rem', borderRadius: '32px', position: 'relative' }}>
                    <p style={{ fontSize: '1.3rem', lineHeight: 1.6, color: '#f1f5f9' }}>{text}</p>
                    {dialogue && <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)', color: '#0ea5e9', fontWeight: 600 }}>{dialogue}</div>}
                </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignSelf: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#8a90a4', marginBottom: '1rem', fontWeight: 800 }}>ТВОЙ ОТВЕТ:</div>
                {children}
            </div>
        </motion.div>
    )
}

const HeroButton = ({ children, onClick }) => (
    <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        style={{ backgroundColor: '#0ea5e9', color: '#fff', border: 'none', padding: '1.5rem 4rem', borderRadius: '24px', fontSize: '1.2rem', fontWeight: 900, cursor: 'pointer', boxShadow: '0 10px 40px rgba(14, 165, 233, 0.3)' }}
    >
        {children}
    </motion.button>
)

const ChoiceButton = ({ children, onClick }) => (
    <motion.button
        whileHover={{ x: 10, backgroundColor: 'rgba(14, 165, 233, 0.15)', borderColor: '#0ea5e9' }}
        onClick={onClick}
        style={{ textAlign: 'left', padding: '1.2rem 1.8rem', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.02)', color: '#fff', cursor: 'pointer', fontSize: '0.95rem', transition: 'all 0.3s' }}
    >
        {children}
    </motion.button>
)
