'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function ContentFactoryPage() {
    const [activeTab, setActiveTab] = useState('text')
    const [articleSearch, setArticleSearch] = useState('')
    const [product, setProduct] = useState('')
    const [keywords, setKeywords] = useState('')
    const [tone, setTone] = useState('Профессиональный')
    const [generatedText, setGeneratedText] = useState('')
    const [isGeneratingText, setIsGeneratingText] = useState(false)

    const [visualStyle, setVisualStyle] = useState('Студийный минимализм')
    const [generatedImages, setGeneratedImages] = useState([])
    const [isGeneratingImages, setIsGeneratingImages] = useState(false)

    const [uploadedImage, setUploadedImage] = useState(null)
    const fileInputRef = useRef(null)

    const handleImageUpload = (e) => {
        const file = e.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setUploadedImage(reader.result)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleGenerateText = async () => {
        if (!product) {
            alert('Пожалуйста, выберите товар или найдите его по артикулу')
            return
        }
        setIsGeneratingText(true)
        setGeneratedText('') // Clear previous text
        try {
            const res = await fetch('/api/content/generate-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product, keywords, tone })
            })

            if (!res.ok) {
                throw new Error(`Server error: ${res.status}`)
            }

            const data = await res.json()

            if (data.error) {
                throw new Error(data.error)
            }

            setGeneratedText(data.text)
        } catch (e) {
            console.error(e)
            alert('Ошибка при генерации текста: ' + e.message)
        } finally {
            setIsGeneratingText(false)
        }
    }

    const handleGenerateImages = async () => {
        setIsGeneratingImages(true)
        setGeneratedImages([]) // Clear previous images
        try {
            const res = await fetch('/api/content/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    style: visualStyle,
                    image: uploadedImage, // Send the base64 image
                    product: product // Send product name for prompt generation
                })
            })

            if (!res.ok) {
                const text = await res.text()
                throw new Error(`Server error: ${res.status} - ${text.substring(0, 100)}`)
            }

            const data = await res.json()

            if (data.error) {
                throw new Error(data.error)
            }

            setGeneratedImages(data.images)
        } catch (e) {
            console.error(e)
            alert('Ошибка при генерации изображений: ' + e.message)
        } finally {
            setIsGeneratingImages(false)
        }
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--velveto-bg-primary)', color: 'var(--velveto-text-primary)' }}>
            {/* Header */}
            <header style={{
                padding: '1.5rem 3rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(5, 8, 20, 0.8)',
                backdropFilter: 'blur(20px)',
                position: 'sticky',
                top: 0,
                zIndex: 100
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--velveto-text-muted)', fontSize: '1.2rem' }}>←</span>
                        <span style={{ color: 'var(--velveto-text-secondary)', fontSize: '0.9rem', letterSpacing: '0.1em' }}>НАЗАД</span>
                    </Link>
                    <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }}></div>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', letterSpacing: '0.1em', fontWeight: '300' }}>
                        КОНТЕНТ <span style={{ color: '#f472b6', fontWeight: '600' }}>ЗАВОД</span>
                    </h1>
                </div>
            </header>

            <main className="container" style={{ padding: '3rem', maxWidth: '1400px', margin: '0 auto' }}>

                {/* Product Selector with Search */}
                <div style={{ marginBottom: '3rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--velveto-text-muted)', fontSize: '0.9rem' }}>ВЫБЕРИТЕ ТОВАР ИЛИ НАЙДИТЕ ПО АРТИКУЛУ</label>
                    <div style={{ display: 'flex', gap: '1rem', maxWidth: '800px' }}>
                        <select
                            value={product}
                            onChange={(e) => setProduct(e.target.value)}
                            style={{
                                flex: 1,
                                padding: '1rem',
                                background: '#ffffff',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                color: '#000000',
                                fontSize: '1.1rem',
                                outline: 'none'
                            }}
                        >
                            <option value="">Выберите товар из МойСклад...</option>
                            <option value="Беспроводные наушники X1">Беспроводные наушники X1 (Арт: 10293)</option>
                            <option value="Смарт-часы Series 8">Смарт-часы Series 8 (Арт: 48291)</option>
                            <option value="Робот-пылесос">Робот-пылесос (Арт: 55921)</option>
                            {/* If the product is not in the list, add it dynamically so it shows up */}
                            {product && !["Беспроводные наушники X1", "Смарт-часы Series 8", "Робот-пылесос"].includes(product) && (
                                <option value={product}>{product}</option>
                            )}
                        </select>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="text"
                                placeholder="Артикул"
                                value={articleSearch}
                                onChange={(e) => setArticleSearch(e.target.value)}
                                style={{
                                    width: '150px',
                                    padding: '1rem',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    color: 'white',
                                    fontSize: '1rem',
                                    outline: 'none'
                                }}
                            />
                            <button
                                onClick={async () => {
                                    if (!articleSearch) return;

                                    try {
                                        const res = await fetch(`/api/moysklad/search?article=${articleSearch}`);
                                        const data = await res.json();

                                        if (data.error) {
                                            alert('Товар не найден');
                                        } else {
                                            setProduct(data.name);
                                            alert(`Найден товар: ${data.name}`);
                                        }
                                    } catch (e) {
                                        console.error(e);
                                        alert('Ошибка поиска');
                                    }
                                }}
                                style={{
                                    padding: '0 1.5rem',
                                    background: 'var(--velveto-accent-primary)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontSize: '1.2rem'
                                }}
                            >
                                🔍
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    {['text', 'visual'].map(tab => (
                        <div
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: '1rem 0',
                                cursor: 'pointer',
                                color: activeTab === tab ? '#f472b6' : 'var(--velveto-text-muted)',
                                fontWeight: activeTab === tab ? '600' : '400',
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                position: 'relative',
                                borderBottom: activeTab === tab ? '2px solid #f472b6' : '2px solid transparent',
                                marginBottom: '-1px'
                            }}
                        >
                            {tab === 'text' ? 'Текстовая Студия' : 'Визуальная Студия'}
                        </div>
                    ))}
                </div>

                {/* Text Studio */}
                {activeTab === 'text' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}
                    >
                        {/* Inputs */}
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: '400' }}>Настройки Генерации</h2>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--velveto-text-muted)' }}>Ключевые слова</label>
                                <input
                                    type="text"
                                    value={keywords}
                                    onChange={(e) => setKeywords(e.target.value)}
                                    placeholder="например: беспроводные, бас, шумоподавление"
                                    style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', color: 'white' }}
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--velveto-text-muted)' }}>Тон текста</label>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    {['Профессиональный', 'Дружелюбный', 'Люкс', 'Срочный'].map(tone => (
                                        <button
                                            key={tone}
                                            onClick={() => setTone(tone)}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                background: tone === tone ? (tone === tone ? '#f472b6' : 'rgba(255,255,255,0.05)') : 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '100px',
                                                color: 'white',
                                                cursor: 'pointer'
                                            }}
                                        >{tone}</button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleGenerateText}
                                disabled={isGeneratingText}
                                style={{ width: '100%', padding: '1rem', background: 'linear-gradient(135deg, #f472b6 0%, #db2777 100%)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 'bold', cursor: 'pointer', marginTop: '1rem', opacity: isGeneratingText ? 0.7 : 1 }}
                            >
                                {isGeneratingText ? 'ГЕНЕРАЦИЯ...' : 'СГЕНЕРИРОВАТЬ ОПИСАНИЕ'}
                            </button>
                        </div>

                        {/* Output */}
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: '400' }}>Результат</h2>
                            <div style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--velveto-text-muted)', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                                {generatedText ? (
                                    <div style={{ width: '100%', whiteSpace: 'pre-wrap', textAlign: 'left' }}>{generatedText}</div>
                                ) : (
                                    'Сгенерированный текст появится здесь...'
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Visual Studio */}
                {activeTab === 'visual' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '3rem' }}
                    >
                        {/* Controls */}
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: '400' }}>Фотостудия</h2>

                            <div
                                style={{ marginBottom: '2rem', textAlign: 'center', padding: '2rem', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                />

                                {uploadedImage ? (
                                    <div style={{ position: 'relative', width: '100%', height: '200px' }}>
                                        <img src={uploadedImage} alt="Reference" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setUploadedImage(null);
                                                if (fileInputRef.current) fileInputRef.current.value = '';
                                            }}
                                            style={{
                                                position: 'absolute',
                                                top: '10px',
                                                right: '10px',
                                                background: 'rgba(0,0,0,0.5)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: '30px',
                                                height: '30px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📤</div>
                                        <div>Загрузить референс</div>
                                    </>
                                )}
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--velveto-text-muted)' }}>Стиль</label>
                                <select
                                    value={visualStyle}
                                    onChange={(e) => setVisualStyle(e.target.value)}
                                    style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', color: 'white' }}
                                >
                                    <option>Студийный минимализм</option>
                                    <option>Лайфстайл / Интерьер</option>
                                    <option>Неон / Киберпанк</option>
                                    <option>Природа / Органика</option>
                                </select>
                            </div>

                            <button
                                onClick={handleGenerateImages}
                                disabled={isGeneratingImages}
                                style={{ width: '100%', padding: '1rem', background: 'linear-gradient(135deg, #f472b6 0%, #db2777 100%)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 'bold', cursor: 'pointer', marginTop: '1rem', opacity: isGeneratingImages ? 0.7 : 1 }}
                            >
                                {isGeneratingImages ? 'ГЕНЕРАЦИЯ...' : 'СГЕНЕРИРОВАТЬ (v2)'}
                            </button>
                        </div>

                        {/* Gallery */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                            {generatedImages.length > 0 ? generatedImages.map((img, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    style={{ aspectRatio: '1', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden' }}
                                >
                                    <img src={img} alt="Generated" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </motion.div>
                            )) : (
                                [1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} style={{ aspectRatio: '1', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}></div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}

            </main>
        </div>
    )
}
