'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import BackButton from '@/components/BackButton'
import Link from 'next/link'
import confetti from 'canvas-confetti'

// Game Constants
const GRID_SIZE = 10
const CELL_SIZE = 42 // Reduced to fit larger grid on screen
const CONTAINER_WIDTH = GRID_SIZE * CELL_SIZE
const CONTAINER_HEIGHT = GRID_SIZE * CELL_SIZE

// Polyomino shapes (Detailed Logistics "Cargo")
const SHAPES = [
    { name: 'Small-Box', cells: [[0, 0], [1, 0], [0, 1], [1, 1]], color: '#ffb35a' }, // 2x2
    { name: 'L-Crate', cells: [[0, 0], [0, 1], [0, 2], [1, 2]], color: '#10b981' }, // L
    { name: 'I-Tube (L)', cells: [[0, 0], [0, 1], [0, 2], [0, 3]], color: '#3b82f6' }, // 1x4
    { name: 'I-Tube (S)', cells: [[0, 0], [0, 1], [0, 2]], color: '#60a5fa' }, // 1x3
    { name: 'T-Parcel', cells: [[0, 0], [1, 0], [2, 0], [1, 1]], color: '#8b5cf6' }, // T
    { name: 'Z-Pallet', cells: [[0, 0], [1, 0], [1, 1], [2, 1]], color: '#ef4444' }, // Z
    { name: 'Long-Pallet', cells: [[0, 0], [1, 0], [2, 0], [3, 0]], color: '#f87171' }, // 4x1
    { name: 'Tiny-Box', cells: [[0, 0]], color: '#fbbf24' }, // 1x1
    { name: 'Column', cells: [[0, 0], [0, 1]], color: '#34d399' }, // 1x2
    { name: 'Giant-Crate', cells: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2]], color: '#4ade80' }, // 3x3
    { name: 'U-Cargo', cells: [[0, 0], [0, 1], [1, 1], [2, 1], [2, 0]], color: '#a78bfa' }, // U
    { name: 'W-Package', cells: [[0, 0], [0, 1], [1, 1], [1, 2], [2, 2]], color: '#f472b6' }, // W
    { name: 'Plus-Cargo', cells: [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]], color: '#fca5a5' }, // +
    { name: 'Stairs', cells: [[0, 0], [0, 1], [1, 1], [1, 2], [2, 2]], color: '#fb923c' }, // Stairs
    { name: 'Side-T', cells: [[0, 0], [0, 1], [0, 2], [1, 1]], color: '#818cf8' } // Side-T
]

export default function WarehouseTetris() {
    const [gameState, setGameState] = useState('start')
    const [score, setScore] = useState(0)
    const [grid, setGrid] = useState(Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(null)))
    const [nextShapes, setNextShapes] = useState([])
    const [preview, setPreview] = useState(null)
    const [timeLeft, setTimeLeft] = useState(60)
    const [highScore, setHighScore] = useState(0)
    const containerRef = useRef(null)

    // Load High Score
    useEffect(() => {
        const saved = localStorage.getItem('warehouse-tetris-highscore')
        if (saved) setHighScore(parseInt(saved))
    }, [])

    const [isMobile, setIsMobile] = useState(false)
    const [cellSize, setCellSize] = useState(CELL_SIZE)

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 1024
            setIsMobile(mobile)
            if (mobile) {
                // Calculate cell size based on screen width, but cap it
                const availableWidth = window.innerWidth - 48 // padding
                const calculated = Math.floor(availableWidth / GRID_SIZE)
                setCellSize(Math.min(calculated, 36))
            } else {
                setCellSize(CELL_SIZE)
            }
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const containerWidth = GRID_SIZE * cellSize
    const containerHeight = GRID_SIZE * cellSize

    const generateShapes = useCallback(() => {
        const newShapes = []
        for (let i = 0; i < 3; i++) {
            newShapes.push(SHAPES[Math.floor(Math.random() * SHAPES.length)])
        }
        setNextShapes(newShapes)
    }, [])

    const startGame = () => {
        setScore(0)
        setGrid(Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(null)))
        setTimeLeft(60)
        generateShapes()
        setGameState('playing')
    }

    const checkLines = useCallback((currentGrid) => {
        let linesCleared = 0
        const newGrid = [...currentGrid.map(row => [...row])]

        // Find rows and columns to clear
        const rowsToClear = []
        const colsToClear = []

        for (let y = 0; y < GRID_SIZE; y++) {
            if (newGrid[y].every(cell => cell !== null)) rowsToClear.push(y)
        }

        for (let x = 0; x < GRID_SIZE; x++) {
            let fullColumn = true
            for (let y = 0; y < GRID_SIZE; y++) {
                if (newGrid[y][x] === null) {
                    fullColumn = false
                    break
                }
            }
            if (fullColumn) colsToClear.push(x)
        }

        rowsToClear.forEach(y => newGrid[y] = Array(GRID_SIZE).fill(null))
        colsToClear.forEach(x => {
            for (let y = 0; y < GRID_SIZE; y++) newGrid[y][x] = null
        })

        linesCleared = rowsToClear.length + colsToClear.length

        if (linesCleared > 0) {
            setScore(s => s + linesCleared * 100)
            confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.8 },
                colors: ['#ffb35a', '#10b981']
            })
        }
        return newGrid
    }, [])

    const canPlace = (shape, x, y, currentGrid) => {
        return shape.cells.every(([dx, dy]) => {
            const nx = x + dx
            const ny = y + dy
            return nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE && currentGrid[ny][nx] === null
        })
    }

    const handleDrag = (shape, info) => {
        if (!containerRef.current) return
        const container = containerRef.current.getBoundingClientRect()

        const shapeWidth = Math.max(...shape.cells.map(c => c[0])) + 1
        const shapeHeight = Math.max(...shape.cells.map(c => c[1])) + 1

        const gridX = info.point.x - (container.left + 4)
        const gridY = info.point.y - (container.top + 4)

        const dropX = Math.round((gridX - (shapeWidth * cellSize) / 2) / cellSize)
        const dropY = Math.round((gridY - (shapeHeight * cellSize) / 2) / cellSize)

        if (canPlace(shape, dropX, dropY, grid)) {
            setPreview({ shape, x: dropX, y: dropY })
        } else {
            setPreview(null)
        }
    }

    const onDragEnd = (shape, index, event, info) => {
        if (!containerRef.current) return
        const container = containerRef.current.getBoundingClientRect()
        const shapeWidth = Math.max(...shape.cells.map(c => c[0])) + 1
        const shapeHeight = Math.max(...shape.cells.map(c => c[1])) + 1

        const gridX = info.point.x - (container.left + 4)
        const gridY = info.point.y - (container.top + 4)

        const dropX = Math.round((gridX - (shapeWidth * cellSize) / 2) / cellSize)
        const dropY = Math.round((gridY - (shapeHeight * cellSize) / 2) / cellSize)

        if (canPlace(shape, dropX, dropY, grid)) {
            const newGrid = [...grid.map(row => [...row])]
            shape.cells.forEach(([dx, dy]) => {
                newGrid[dropY + dy][dropX + dx] = shape.color
            })
            const clearedGrid = checkLines(newGrid)
            setGrid(clearedGrid)
            setScore(s => s + shape.cells.length * 10)

            const updatedNext = [...nextShapes]
            updatedNext[index] = SHAPES[Math.floor(Math.random() * SHAPES.length)]
            setNextShapes(updatedNext)
        }
        setPreview(null)
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
            localStorage.setItem('warehouse-tetris-highscore', score.toString())
        }
    }, [gameState, score, highScore])

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: '#050814',
            color: '#f5f5f5',
            fontFamily: "'Inter', sans-serif",
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto'
        }}>
            {/* Header */}
            <header style={{
                padding: isMobile ? '1rem 1.5rem' : '1.5rem 3rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: 'rgba(5, 8, 20, 0.9)',
                backdropFilter: 'blur(10px)',
                zIndex: 10
            }}>
                <BackButton href="/games" />
                {!isMobile && (
                    <div style={{ textAlign: 'center' }}>
                        <h1 style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '0.4em', color: '#10b981', margin: 0 }}>WAREHOUSE TETRIS</h1>
                        <div style={{ fontSize: '0.6rem', color: '#8a90a4', marginTop: '4px' }}>ОПТИМИЗАЦИЯ ЛОГИСТИКИ</div>
                    </div>
                )}
                <div style={{ display: 'flex', gap: isMobile ? '1rem' : '3rem' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.6rem', opacity: 0.5 }}>SCORE</div>
                        <div style={{ fontSize: isMobile ? '1rem' : '1.8rem', fontWeight: 900, color: '#10b981' }}>{score}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.6rem', opacity: 0.5 }}>TIME</div>
                        <div style={{ fontSize: isMobile ? '1rem' : '1.8rem', fontWeight: 900, color: timeLeft < 10 ? '#ef4444' : '#fff' }}>{timeLeft}s</div>
                    </div>
                </div>
            </header>

            <main style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '1rem' : '2rem', gap: isMobile ? '2rem' : '4rem', overflowY: 'auto' }}>
                <AnimatePresence mode="wait">
                    {gameState === 'start' && (
                        <motion.div
                            key="start"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{
                                maxWidth: '600px',
                                textAlign: 'center',
                                backgroundColor: 'rgba(16, 21, 40, 0.95)',
                                padding: isMobile ? '2rem' : '4rem',
                                borderRadius: '40px',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                backdropFilter: 'blur(30px)',
                                zIndex: 50,
                                margin: 'auto'
                            }}
                        >
                            <div style={{ fontSize: isMobile ? '3rem' : '5rem', marginBottom: '1.5rem' }}>📦</div>
                            <h2 style={{ fontSize: isMobile ? '1.8rem' : '2.5rem', fontWeight: 900, marginBottom: '1rem', color: '#fff' }}>Логистический Тетрис</h2>
                            <p style={{ color: '#c3c9d9', fontSize: isMobile ? '0.9rem' : '1.1rem', lineHeight: 1.8, marginBottom: '2.5rem' }}>
                                Упакуйте товары максимально плотно. Собирайте полные ряды и колонки, чтобы освободить место в контейнере.
                            </p>
                            <button
                                onClick={startGame}
                                style={{ backgroundColor: '#10b981', color: '#050814', border: 'none', padding: isMobile ? '1.2rem 3rem' : '1.5rem 5rem', borderRadius: '20px', fontSize: isMobile ? '1rem' : '1.2rem', fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em', width: isMobile ? '100%' : 'auto' }}
                            >
                                Начать смену
                            </button>
                        </motion.div>
                    )}

                    {gameState === 'playing' && (
                        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '2rem' : '5rem', alignItems: 'center' }}>
                            {/* Grid/Container */}
                            <div
                                ref={containerRef}
                                style={{
                                    width: containerWidth + 8,
                                    height: containerHeight + 8,
                                    backgroundColor: 'rgba(255,255,255,0.02)',
                                    border: '2px solid rgba(255,255,255,0.1)',
                                    display: 'grid',
                                    gridTemplateColumns: `repeat(${GRID_SIZE}, ${cellSize}px)`,
                                    gridTemplateRows: `repeat(${GRID_SIZE}, ${cellSize}px)`,
                                    borderRadius: '12px',
                                    padding: '4px',
                                    position: 'relative',
                                    touchAction: 'none'
                                }}
                            >
                                {grid.map((row, y) => row.map((cell, x) => {
                                    const isPreview = preview && preview.shape.cells.some(([dx, dy]) => preview.x + dx === x && preview.y + dy === y)
                                    return (
                                        <div
                                            key={`${x}-${y}`}
                                            style={{
                                                width: cellSize - 4,
                                                height: cellSize - 4,
                                                backgroundColor: cell || (isPreview ? `${preview.shape.color}44` : 'rgba(255,255,255,0.03)'),
                                                borderRadius: '6px',
                                                margin: '2px',
                                                transition: 'background-color 0.1s',
                                                border: isPreview ? `1px dashed ${preview.shape.color}` : 'none'
                                            }}
                                        />
                                    )
                                }))}
                            </div>

                            {/* Shape Queue */}
                            <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: isMobile ? '1rem' : '2rem', justifyContent: 'center', width: '100%' }}>
                                {nextShapes.map((shape, idx) => (
                                    <motion.div
                                        key={idx}
                                        drag
                                        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                                        dragElastic={0.1}
                                        dragMomentum={false}
                                        onDrag={(e, info) => handleDrag(shape, info)}
                                        onDragEnd={(e, info) => onDragEnd(shape, idx, e, info)}
                                        whileHover={{ scale: 1.05, cursor: 'grab' }}
                                        whileDrag={{ scale: 1.2, zIndex: 100, opacity: 0.8 }}
                                        style={{
                                            width: cellSize * 2.5,
                                            height: cellSize * 2.5,
                                            backgroundColor: 'rgba(255,255,255,0.03)',
                                            borderRadius: isMobile ? '12px' : '20px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            border: '1px solid rgba(255,255,255,0.05)',
                                            position: 'relative'
                                        }}
                                    >
                                        <div style={{ position: 'relative' }}>
                                            {shape.cells.map(([dx, dy], i) => (
                                                <div
                                                    key={i}
                                                    style={{
                                                        position: 'absolute',
                                                        width: (cellSize * (isMobile ? 0.7 : 0.85)) - 4,
                                                        height: (cellSize * (isMobile ? 0.7 : 0.85)) - 4,
                                                        backgroundColor: shape.color,
                                                        borderRadius: '4px',
                                                        left: dx * (cellSize * (isMobile ? 0.7 : 0.85)) - (Math.max(...shape.cells.map(c => c[0])) + 1) * (cellSize * (isMobile ? 0.7 : 0.85)) / 2,
                                                        top: dy * (cellSize * (isMobile ? 0.7 : 0.85)) - (Math.max(...shape.cells.map(c => c[1])) + 1) * (cellSize * (isMobile ? 0.7 : 0.85)) / 2,
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                                        border: '1px solid rgba(255,255,255,0.2)'
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {gameState === 'result' && (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{
                                maxWidth: '600px',
                                width: '100%',
                                textAlign: 'center',
                                backgroundColor: 'rgba(16, 21, 40, 0.8)',
                                padding: isMobile ? '2.5rem 1.5rem' : '5rem',
                                borderRadius: isMobile ? '30px' : '50px',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                backdropFilter: 'blur(30px)',
                                margin: 'auto'
                            }}
                        >
                            <div style={{ fontSize: isMobile ? '4rem' : '6rem', marginBottom: '1.5rem' }}>🚚</div>
                            <h2 style={{ fontSize: isMobile ? '2rem' : '3.1rem', fontWeight: 900, marginBottom: '0.8rem' }}>Смена окончена</h2>
                            <p style={{ color: '#d1d5db', fontSize: isMobile ? '0.95rem' : '1.2rem', marginBottom: isMobile ? '2rem' : '3rem', lineHeight: 1.6 }}>
                                Контейнер заполнен или время истекло. Вы отлично поработали над оптимизацией склада!
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isMobile ? '1rem' : '2rem', marginBottom: isMobile ? '2.5rem' : '4rem' }}>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: isMobile ? '1.2rem' : '2rem', borderRadius: '24px' }}>
                                    <div style={{ fontSize: '0.6rem', opacity: 0.5, marginBottom: '0.4rem' }}>SCORE</div>
                                    <div style={{ fontSize: isMobile ? '2.5rem' : '4rem', fontWeight: 900, color: '#10b981' }}>{score}</div>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: isMobile ? '1.2rem' : '2rem', borderRadius: '24px' }}>
                                    <div style={{ fontSize: '0.6rem', opacity: 0.5, marginBottom: '0.4rem' }}>BEST</div>
                                    <div style={{ fontSize: isMobile ? '2.5rem' : '4rem', fontWeight: 900 }}>{highScore}</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem' }}>
                                <button
                                    onClick={startGame}
                                    style={{ flex: 2, backgroundColor: '#fff', color: '#050814', border: 'none', padding: '1.2rem', borderRadius: '20px', fontSize: '1.1rem', fontWeight: 900, cursor: 'pointer' }}
                                >
                                    НОВАЯ ПОСТАВКА
                                </button>
                                <Link href="/games" style={{ flex: 1, textDecoration: 'none' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: isMobile ? '3.5rem' : 'auto', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', color: '#8a90a4', fontWeight: '900', fontSize: '1rem' }}>
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
