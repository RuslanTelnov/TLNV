'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function MsProducts() {
    const router = useRouter()
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedImage, setSelectedImage] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [exportingId, setExportingId] = useState(null)
    const [successIds, setSuccessIds] = useState(new Set())
    const [error, setError] = useState(null)
    const itemsPerPage = 25

    useEffect(() => {
        fetchProducts()

        const channel = supabase
            .channel('products_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'products'
                },
                (payload) => {
                    console.log('Change received!', payload)
                    fetchProducts()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    // Reset to first page when search query changes
    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery])

    async function fetchProducts() {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('name', { ascending: true })

            if (error) throw error

            console.log('Fetched products:', data.length)
            const target = data.find(p => String(p.article) === '123873313')
            if (target) {
                console.log('✅ Found target product:', target)
            } else {
                console.log('❌ Target product 123873313 NOT found in fetched data')
            }

            setProducts(data || [])
            setError(null)
        } catch (error) {
            console.error('Error fetching products:', error.message)
            setError('Ошибка загрузки товаров: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleExportToOzon = async (e, product) => {
        e.preventDefault()
        e.stopPropagation()

        if (exportingId) return // Prevent multiple clicks
        if (successIds.has(product.id)) return

        // if (!confirm(`Выгрузить "${product.name}" на Ozon?`)) return

        setExportingId(product.id)

        try {
            const response = await fetch('/api/ozon/create-card', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ product }),
            })

            const data = await response.json()

            if (data.success) {
                setSuccessIds(prev => new Set(prev).add(product.id))
                // alert(`✅ Успешно! Задача на создание создана.\n\n${data.message}`) // Removed alert for smoother UX
            } else {
                alert(`❌ Ошибка: ${data.error || 'Неизвестная ошибка'}\n\nOutput: ${data.output}`)
            }
        } catch (error) {
            console.error('Export error:', error)
            alert(`❌ Ошибка сети: ${error.message}`)
        } finally {
            setExportingId(null)
        }
    }

    const filteredProducts = products.filter(product => {
        const query = searchQuery.toLowerCase().trim()
        return (
            (product.name && product.name.toLowerCase().includes(query)) ||
            (product.article && String(product.article).toLowerCase().includes(query))
        )
    })

    // Pagination Logic
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
    const indexOfLastItem = currentPage * itemsPerPage
    const indexOfFirstItem = indexOfLastItem - itemsPerPage
    const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem)

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    if (loading) return <div className="container"><h1 className="title-gradient">Загрузка...</h1></div>

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

    const handleImageClick = (e, imageUrl) => {
        e.preventDefault()
        e.stopPropagation()
        setSelectedImage(imageUrl)
    }

    const placeholders = [
        'https://images.unsplash.com/photo-1557683316-973673baf926?w=400&q=80', // Gradient 1
        'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=400&q=80', // Gradient 2
        'https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=400&q=80', // Gradient 3
        'https://images.unsplash.com/photo-1557682260-96773eb01377?w=400&q=80', // Gradient 4
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80'  // Abstract
    ]

    return (
        <div style={{ minHeight: '100vh', background: 'var(--velveto-bg-primary)' }}>
            {/* Image Modal */}
            {selectedImage && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(5, 8, 20, 0.95)',
                        backdropFilter: 'blur(10px)',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                    }}
                    onClick={() => setSelectedImage(null)}
                >
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        style={{
                            background: 'var(--velveto-bg-secondary)',
                            padding: '1rem',
                            borderRadius: '16px',
                            maxWidth: '600px',
                            maxHeight: '80vh',
                            width: '90%',
                            position: 'relative',
                            cursor: 'default',
                            border: '1px solid var(--velveto-accent-primary)',
                            boxShadow: '0 0 50px rgba(0,0,0,0.5)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setSelectedImage(null)}
                            style={{
                                position: 'absolute',
                                top: '-20px',
                                right: '-20px',
                                background: 'var(--velveto-status-error)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: '40px',
                                height: '40px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '1.2rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                            }}
                        >
                            ✕
                        </button>
                        <img
                            src={selectedImage}
                            alt="Preview"
                            style={{
                                width: '100%',
                                height: 'auto',
                                borderRadius: '8px',
                                objectFit: 'contain',
                                maxHeight: '70vh'
                            }}
                        />
                    </motion.div>
                </div>
            )}

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
                <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Link href="/">
                            <h1 style={{
                                fontSize: '1.8rem',
                                fontWeight: '300',
                                letterSpacing: '0.18em',
                                color: 'var(--velveto-text-primary)',
                                cursor: 'pointer',
                                textTransform: 'uppercase'
                            }}>
                                VELVETO
                            </h1>
                        </Link>
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

                    {/* Navigation Tabs */}
                    <nav style={{ display: 'flex', gap: '2rem' }}>
                        <Link href="/" style={{
                            color: 'var(--velveto-text-muted)',
                            fontSize: '0.9rem',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            transition: 'color 0.3s'
                        }}>
                            Главная
                        </Link>
                        <Link href="/ms-products" style={{
                            color: 'var(--velveto-accent-primary)',
                            fontSize: '0.9rem',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            fontWeight: '600',
                            textShadow: '0 0 10px rgba(255, 179, 90, 0.4)'
                        }}>
                            Номенклатуры МойСклад
                        </Link>
                    </nav>
                </div>
                <div style={{
                    color: 'var(--velveto-text-secondary)',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    letterSpacing: '0.05em'
                }}>
                    ADMIN PANEL
                </div>
            </header>

            <main className="container" style={{ padding: '4rem 2rem', maxWidth: '1400px', margin: '0 auto' }}>
                <div style={{ marginBottom: '4rem', textAlign: 'center' }}>
                    <h2 style={{
                        fontSize: '3.5rem',
                        marginBottom: '1rem',
                        color: 'var(--velveto-text-primary)',
                        fontWeight: '200',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase'
                    }}>
                        Номенклатуры <span style={{ color: 'var(--velveto-accent-primary)' }}>МойСклад</span>
                    </h2>
                    <p style={{ color: 'var(--velveto-text-muted)', fontSize: '1.1rem' }}>
                        Полный список товаров и остатков из системы МойСклад
                    </p>
                </div>

                {/* Search Bar */}
                <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'center', position: 'relative', maxWidth: '600px', margin: '0 auto 3rem' }}>
                    <input
                        type="text"
                        placeholder="Поиск по названию или артикулу..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            maxWidth: '600px',
                            padding: '1rem 1.5rem',
                            borderRadius: '12px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            background: 'rgba(255, 255, 255, 0.03)',
                            color: 'var(--velveto-text-primary)',
                            fontSize: '1rem',
                            outline: 'none',
                            transition: 'all 0.3s',
                            fontFamily: 'var(--velveto-font-ui)'
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = 'var(--velveto-accent-primary)';
                            e.target.style.boxShadow = '0 0 15px rgba(255, 179, 90, 0.1)';
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                            e.target.style.boxShadow = 'none';
                        }}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            style={{
                                position: 'absolute',
                                right: '1rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                color: 'var(--velveto-text-muted)',
                                cursor: 'pointer',
                                fontSize: '1.2rem'
                            }}
                        >
                            ✕
                        </button>
                    )}
                </div>

                {error && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--velveto-status-error)', fontSize: '1.2rem' }}>
                        {error}
                        <button onClick={fetchProducts} style={{ marginLeft: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>Повторить</button>
                    </div>
                )}

                {!loading && !error && filteredProducts.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--velveto-text-muted)' }}>
                        <h3>Ничего не найдено</h3>
                        <p>Попробуйте изменить поисковый запрос</p>
                        {products.length === 0 && <p>Список товаров пуст (возможно, ошибка загрузки)</p>}
                    </div>
                )}

                <motion.div
                    className="ms-table-container"
                    variants={container}
                    initial="hidden"
                    animate="show"
                    key={currentPage}
                >
                    <table className="ms-table">
                        <thead>
                            <tr>
                                <th style={{ width: '80px' }}>Фото</th>
                                <th>Наименование</th>
                                <th>Артикул</th>
                                <th>Мин. цена</th>
                                <th>Розничная</th>
                                <th>Себестоимость</th>
                                <th>Остаток</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.map((product, index) => (
                                <tr
                                    key={product.id}
                                    onClick={() => router.push(`/product/${product.id}`)}
                                    style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                                    className="hover:bg-white/5"
                                >
                                    <td>
                                        <img
                                            src={product.image_url || placeholders[product.id % placeholders.length]}
                                            alt={product.name}
                                            className="ms-thumb"
                                            style={{ cursor: 'zoom-in', border: '1px solid rgba(255,255,255,0.1)' }}
                                            onClick={(e) => handleImageClick(e, product.image_url || placeholders[product.id % placeholders.length])}
                                        />
                                    </td>
                                    <td className="ms-cell-name" style={{ color: 'var(--velveto-text-primary)' }}>{product.name}</td>
                                    <td className="ms-cell-article" style={{ color: 'var(--velveto-text-muted)' }}>{product.article}</td>
                                    <td style={{ fontWeight: '600', color: 'var(--velveto-status-warning)' }}>
                                        {product.min_price ? (product.min_price / 100).toLocaleString('ru-RU') : 0} ₸
                                    </td>
                                    <td className="ms-cell-price" style={{ color: 'var(--velveto-accent-primary)' }}>
                                        {product.price ? (product.price / 100).toLocaleString('ru-RU') : 0} ₸
                                    </td>
                                    <td>
                                        {product.cost_price && (
                                            <span className="cost-price" style={{ color: 'var(--velveto-text-secondary)' }}>
                                                {(Number(product.cost_price)).toLocaleString('ru-RU')} ₸
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <span style={{
                                            fontWeight: 'bold',
                                            color: product.stock > 0 ? 'var(--velveto-status-success)' : 'var(--velveto-status-error)'
                                        }}>
                                            {product.stock || 0}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            onClick={(e) => handleExportToOzon(e, product)}
                                            disabled={exportingId === product.id || successIds.has(product.id)}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: '6px',
                                                background: successIds.has(product.id)
                                                    ? 'var(--velveto-status-success)'
                                                    : (exportingId === product.id ? 'var(--velveto-text-muted)' : 'var(--velveto-accent-primary)'),
                                                color: 'var(--velveto-bg-primary)',
                                                border: 'none',
                                                cursor: (exportingId === product.id || successIds.has(product.id)) ? 'default' : 'pointer',
                                                fontWeight: '600',
                                                fontSize: '0.8rem',
                                                transition: 'all 0.2s',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                minWidth: '140px', // Fixed width to prevent jumping
                                                justifyContent: 'center'
                                            }}
                                        >
                                            {exportingId === product.id && (
                                                <motion.span
                                                    animate={{ rotate: 360 }}
                                                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                                    style={{
                                                        display: 'inline-block',
                                                        width: '12px',
                                                        height: '12px',
                                                        border: '2px solid rgba(255,255,255,0.3)',
                                                        borderTop: '2px solid white',
                                                        borderRadius: '50%'
                                                    }}
                                                />
                                            )}
                                            {successIds.has(product.id) ? (
                                                <motion.span
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                                                >
                                                    ✓ Выгружено
                                                </motion.span>
                                            ) : (
                                                exportingId === product.id ? 'Загрузка...' : 'Выгрузка на Ozon'
                                            )}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </motion.div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '1.5rem',
                        marginTop: '3rem',
                        paddingBottom: '2rem'
                    }}>
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            style={{
                                padding: '0.75rem 1.5rem',
                                borderRadius: '12px',
                                background: currentPage === 1 ? 'rgba(255,255,255,0.02)' : 'rgba(255, 255, 255, 0.05)',
                                color: currentPage === 1 ? 'var(--velveto-text-muted)' : 'var(--velveto-text-primary)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s',
                                fontFamily: 'var(--velveto-font-ui)'
                            }}
                        >
                            ← Назад
                        </button>

                        <span style={{ color: 'var(--velveto-text-secondary)', fontSize: '1rem', letterSpacing: '0.05em' }}>
                            Страница <span style={{ color: 'var(--velveto-accent-primary)', fontWeight: 'bold' }}>{currentPage}</span> из {totalPages}
                        </span>

                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            style={{
                                padding: '0.75rem 1.5rem',
                                borderRadius: '12px',
                                background: currentPage === totalPages ? 'rgba(255,255,255,0.02)' : 'rgba(255, 255, 255, 0.05)',
                                color: currentPage === totalPages ? 'var(--velveto-text-muted)' : 'var(--velveto-text-primary)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s',
                                fontFamily: 'var(--velveto-font-ui)'
                            }}
                        >
                            Вперед →
                        </button>
                    </div>
                )}
            </main>

            {/* Debug Footer */}
            <div style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'rgba(0,0,0,0.8)',
                color: '#0f0',
                padding: '0.5rem',
                fontSize: '0.8rem',
                fontFamily: 'monospace',
                zIndex: 9999,
                pointerEvents: 'none'
            }}>
                Debug: Products={products.length} | Filtered={filteredProducts.length} | Page={currentPage}/{totalPages} | Search="{searchQuery}" | Loading={String(loading)} | Error={String(error)}
            </div>
        </div>
    )
}
