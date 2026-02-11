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
        title: 'VELVETO ECOSYSTEM',
        subtitle: 'Advanced Automation & Analytics Platform',
        bg: assets.intro,
        color: '#3b82f6',
        content: (
            <div className="flex flex-col gap-4">
                <div className="text-xl opacity-80">Next-Gen E-commerce Management</div>
                <div className="flex gap-4 mt-8">
                    <FeatureTag text="Next.js Core" />
                    <FeatureTag text="Python Automation" />
                    <FeatureTag text="AI Integrated" />
                </div>
            </div>
        )
    },
    {
        id: 'kaspi',
        title: 'AUTOMATED FULFILLMENT',
        subtitle: 'Kaspi.kz Integration Module',
        bg: assets.kaspi,
        color: '#ef4444',
        content: (
            <ul className="text-xl space-y-4 opacity-90">
                <li>🚀 <b className="text-white">Auto-Accept</b> orders in 1.4s</li>
                <li>📦 <b className="text-white">Smart Logistics</b> calculation</li>
                <li>🏷️ <b className="text-white">Label Generation</b> on fly</li>
                <li>🔍 <b className="text-white">Stock Sync</b> every 5 mins</li>
            </ul>
        )
    },
    {
        id: 'perfume',
        title: 'COMPETITIVE INTELLIGENCE',
        subtitle: 'S-Parfum Market Analysis',
        bg: assets.perfume,
        color: '#c9a05a',
        content: (
            <ul className="text-xl space-y-4 opacity-90">
                <li>✨ <b className="text-white">Real-time Pricing</b> breakdown</li>
                <li>💰 <b className="text-white">Net Margin</b> calculation</li>
                <li>📊 <b className="text-white">Tier System</b> (Luxury/Selective)</li>
                <li>🎯 <b className="text-white">Commission</b> optimization</li>
            </ul>
        )
    },
    {
        id: 'ai',
        title: 'AI POWERED CORE',
        subtitle: 'Neural Network Integration',
        bg: assets.ai,
        color: '#ec4899',
        content: (
            <ul className="text-xl space-y-4 opacity-90">
                <li>🧠 <b className="text-white">SEO Generation</b> for product cards</li>
                <li>🤖 <b className="text-white">Content Strategy</b> automation</li>
                <li>👁️ <b className="text-white">Computer Vision</b> for quality control</li>
                <li>📈 <b className="text-white">Predictive</b> analytics</li>
            </ul>
        )
    },
    {
        id: 'mobile',
        title: 'OMNICHANNEL ACCESS',
        subtitle: 'Native Mobile Experience',
        bg: assets.mobile,
        color: '#8b5cf6',
        content: (
            <ul className="text-xl space-y-4 opacity-90">
                <li>📱 <b className="text-white">iOS & Android</b> Native Apps</li>
                <li>⚡ <b className="text-white">PWA</b> Support</li>
                <li>🔔 <b className="text-white">Push Notifications</b> (Coming Soon)</li>
                <li>👆 <b className="text-white">Touch Optimized</b> Interface</li>
            </ul>
        )
    }
]

function FeatureTag({ text }) {
    return (
        <span className="px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-mono tracking-wider backdrop-blur-md">
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
