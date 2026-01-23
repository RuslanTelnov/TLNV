'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function ProductPage() {
    const { id } = useParams()
    const [product, setProduct] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (id) fetchProduct()
    }, [id])

    async function fetchProduct() {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .single()

            if (error) throw error
            setProduct(data)
        } catch (error) {
            console.error('Error fetching product:', error.message)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="container"><h1 className="title-gradient">Загрузка...</h1></div>
    if (!product) return <div className="container"><h1>Товар не найден</h1></div>

    return (
        <div style={{ minHeight: '100vh', background: 'var(--velveto-bg-primary)', padding: '2rem' }}>
            <main className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <Link href="/" style={{ textDecoration: 'none' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '3rem',
                        padding: '0.75rem 1.5rem',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        color: 'var(--velveto-text-primary)',
                        fontWeight: '600',
                        fontSize: '1rem',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        backdropFilter: 'blur(10px)',
                        fontFamily: 'var(--velveto-font-ui)'
                    }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.borderColor = 'var(--velveto-accent-primary)'
                            e.currentTarget.style.color = 'var(--velveto-accent-primary)'
                            e.currentTarget.style.transform = 'translateX(-5px)'
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                            e.currentTarget.style.color = 'var(--velveto-text-primary)'
                            e.currentTarget.style.transform = 'translateX(0)'
                        }}
                    >
                        <span>←</span> Назад к списку
                    </div>
                </Link>

                <div className="velveto-card" style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1.5fr',
                    gap: '4rem',
                    alignItems: 'start',
                    background: 'var(--velveto-bg-secondary)',
                    padding: '3rem',
                    borderRadius: '32px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}>
                    <div>
                        {product.image_url ? (
                            <img
                                src={product.image_url}
                                alt={product.name}
                                style={{
                                    width: '100%',
                                    borderRadius: '24px',
                                    boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)',
                                    border: '1px solid rgba(255, 255, 255, 0.05)'
                                }}
                            />
                        ) : (
                            <div style={{
                                width: '100%',
                                aspectRatio: '1/1',
                                background: 'rgba(255, 255, 255, 0.02)',
                                borderRadius: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--velveto-text-muted)',
                                border: '1px solid rgba(255, 255, 255, 0.05)'
                            }}>
                                Нет фото
                            </div>
                        )}
                    </div>

                    <div>
                        <h1 style={{
                            fontSize: '3rem',
                            marginBottom: '1rem',
                            color: 'var(--velveto-text-primary)',
                            fontWeight: '200',
                            lineHeight: '1.2'
                        }}>
                            {product.name}
                        </h1>
                        <p style={{
                            fontSize: '1.25rem',
                            color: 'var(--velveto-text-muted)',
                            marginBottom: '3rem',
                            letterSpacing: '0.05em'
                        }}>
                            Артикул: <span style={{ color: 'var(--velveto-text-primary)', fontWeight: '600' }}>{product.article}</span>
                        </p>

                        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: '1fr 1fr' }}>
                            <div style={{
                                padding: '1.5rem',
                                background: 'rgba(255, 255, 255, 0.02)',
                                borderRadius: '16px',
                                border: '1px solid rgba(255, 255, 255, 0.05)'
                            }}>
                                <p style={{ color: 'var(--velveto-text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Розничная цена</p>
                                <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--velveto-accent-primary)' }}>
                                    {product.price ? (product.price / 100).toLocaleString('ru-RU') : 0} ₸
                                </p>
                            </div>

                            <div style={{
                                padding: '1.5rem',
                                background: 'rgba(255, 255, 255, 0.02)',
                                borderRadius: '16px',
                                border: '1px solid rgba(255, 255, 255, 0.05)'
                            }}>
                                <p style={{ color: 'var(--velveto-text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Мин. цена</p>
                                <p style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--velveto-status-warning)' }}>
                                    {product.min_price ? (product.min_price / 100).toLocaleString('ru-RU') : 0} ₸
                                </p>
                            </div>

                            <div style={{
                                padding: '1.5rem',
                                background: 'rgba(255, 255, 255, 0.02)',
                                borderRadius: '16px',
                                border: '1px solid rgba(255, 255, 255, 0.05)'
                            }}>
                                <p style={{ color: 'var(--velveto-text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Себестоимость</p>
                                <p style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--velveto-text-secondary)' }}>
                                    {product.cost_price ? (product.cost_price).toLocaleString('ru-RU') : 0} ₸
                                </p>
                            </div>

                            <div style={{
                                padding: '1.5rem',
                                background: 'rgba(255, 255, 255, 0.02)',
                                borderRadius: '16px',
                                border: '1px solid rgba(255, 255, 255, 0.05)'
                            }}>
                                <p style={{ color: 'var(--velveto-text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Поставщик</p>
                                <p style={{ fontSize: '1.25rem', color: 'var(--velveto-text-primary)' }}>{product.supplier || 'Не указан'}</p>
                            </div>

                            <div style={{
                                padding: '1.5rem',
                                background: 'rgba(255, 255, 255, 0.02)',
                                borderRadius: '16px',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                gridColumn: '1 / -1'
                            }}>
                                <p style={{ color: 'var(--velveto-text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Страна</p>
                                <p style={{ fontSize: '1.25rem', color: 'var(--velveto-text-primary)' }}>{product.country || 'Не указана'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 mt-8" style={{ marginTop: '2rem' }}>
                        <button
                            onClick={async () => {
                                if (!confirm('Добавить в XML фид для авто-создания?')) return;
                                try {
                                    const res = await fetch('/api/kaspi/mark-in-feed', {
                                        method: 'POST',
                                        body: JSON.stringify({ id: product.id, is_in_feed: true })
                                    });
                                    if (res.ok) alert('Добавлено в фид! Kaspi скоро увидит товар.');
                                    else alert('Ошибка');
                                } catch (e) { alert(e.message); }
                            }}
                            style={{
                                background: 'var(--velveto-accent-primary)',
                                color: 'white',
                                padding: '1rem 2rem',
                                borderRadius: '12px',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '1.1rem'
                            }}
                        >
                            В XML Фид
                        </button>
                    </div>

                </div>
            </main>
        </div>
    )
}

