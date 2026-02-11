'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export function Settings() {
    const [keys, setKeys] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })

    useEffect(() => {
        fetchKeys()
    }, [])

    const fetchKeys = async () => {
        setLoading(true)
        setMessage({ type: '', text: '' })
        try {
            const res = await fetch('/api/settings/keys')
            const data = await res.json()

            if (res.ok) {
                setKeys(data)
            } else {
                console.error('API error:', data.error)
                setMessage({ type: 'error', text: data.error || 'Failed to load settings from server. Check logs.' })
                setKeys(null)
            }
        } catch (error) {
            console.error('Fetch error:', error)
            setMessage({ type: 'error', text: 'Network error or server is down. Could not fetch settings.' })
        }
        setLoading(false)
    }

    const handleChange = (name, value) => {
        setKeys(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSave = async () => {
        setSaving(true)
        setMessage({ type: '', text: '' })
        try {
            const res = await fetch('/api/settings/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(keys)
            })
            const result = await res.json()
            if (result.success) {
                setMessage({ type: 'success', text: 'Settings saved successfully!' })
                setTimeout(() => setMessage({ type: '', text: '' }), 3000)
                fetchKeys() // Refresh to get masked values back
            } else {
                setMessage({ type: 'error', text: result.error || 'Failed to save settings' })
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error saving settings' })
        }
        setSaving(false)
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--velveto-bg-primary)' }}>
            <header className="settings-header" style={{
                padding: '1.5rem 3rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backdropFilter: 'blur(20px)',
                background: 'rgba(5, 8, 20, 0.8)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link href="/">
                        <h1 className="logo-text" style={{
                            fontSize: '1.5rem',
                            fontWeight: '300',
                            letterSpacing: '0.18em',
                            color: 'var(--velveto-text-primary)',
                            textTransform: 'uppercase',
                            cursor: 'pointer'
                        }}>
                            VELVETO
                        </h1>
                    </Link>
                </div>
                <div className="desktop-only" style={{ color: 'var(--velveto-text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase' }}>
                    Settings & API Keys
                </div>
            </header>

            <main className="container" style={{ paddingTop: '4rem', maxWidth: '1000px', margin: '0 auto', paddingBottom: '4rem' }}>
                <div className="settings-page-header" style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <Link href="/">
                            <div style={{ color: 'var(--velveto-accent-primary)', cursor: 'pointer', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                ← На главную
                            </div>
                        </Link>
                        <h2 className="title-text" style={{ fontSize: '2.5rem', fontWeight: '200', color: 'var(--velveto-text-primary)' }}>НАСТРОЙКИ</h2>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="save-button"
                        style={{
                            background: 'var(--velveto-accent-primary)',
                            color: '#000',
                            border: 'none',
                            padding: '0.8rem 2rem',
                            borderRadius: '4px',
                            fontWeight: '600',
                            cursor: (saving || loading) ? 'not-allowed' : 'pointer',
                            opacity: (saving || loading) ? 0.7 : 1,
                            transition: 'all 0.2s',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em'
                        }}
                    >
                        {saving ? 'Сохранение...' : 'Сохранить изменения'}
                    </button>
                </div>

                {message.text && (
                    <div style={{
                        padding: '1rem',
                        marginBottom: '2rem',
                        borderRadius: '4px',
                        background: message.type === 'success' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                        border: `1px solid ${message.type === 'success' ? '#4CAF50' : '#F44336'}`,
                        color: message.type === 'success' ? '#4CAF50' : '#F44336',
                        textAlign: 'center'
                    }}>
                        {message.text}
                    </div>
                )}

                {loading ? (
                    <div style={{ color: 'var(--velveto-text-secondary)' }}>Загрузка...</div>
                ) : !keys ? (
                    <div style={{
                        padding: '3rem',
                        textAlign: 'center',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px dashed rgba(255,255,255,0.1)',
                        borderRadius: '8px'
                    }}>
                        <p style={{ color: 'var(--velveto-text-secondary)', marginBottom: '1.5rem' }}>
                            Не удалось загрузить настройки. Пожалуйста, проверьте подключение к базе данных.
                        </p>
                        <button
                            onClick={fetchKeys}
                            style={{
                                background: 'transparent',
                                border: '1px solid var(--velveto-accent-primary)',
                                color: 'var(--velveto-accent-primary)',
                                padding: '0.5rem 1.5rem',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Повторить попытку
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                        {/* Section: Autonomous Mode */}
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="velveto-card" style={{ padding: '2rem', border: '1px solid var(--velveto-accent-primary)', boxShadow: '0 0 20px rgba(255, 215, 0, 0.1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--velveto-text-primary)' }}>🤖 АВТОНОМНЫЙ РЕЖИМ (24/7)</h3>
                                    <p style={{ margin: '0.5rem 0 0', color: 'var(--velveto-text-secondary)', fontSize: '0.9rem' }}>
                                        Если включено, парсер будет работать непрерывно. Когда задачи закончатся, он сам добавит новые ключевые слова в очередь.
                                    </p>
                                </div>
                                <div
                                    onClick={() => handleChange('IS_AUTONOMOUS_MODE', !keys.IS_AUTONOMOUS_MODE)}
                                    style={{
                                        width: '60px', height: '34px', background: keys.IS_AUTONOMOUS_MODE ? 'var(--velveto-accent-primary)' : '#555',
                                        borderRadius: '34px', position: 'relative', cursor: 'pointer', transition: 'all 0.3s'
                                    }}
                                >
                                    <div style={{
                                        width: '26px', height: '26px', background: '#fff', borderRadius: '50%',
                                        position: 'absolute', top: '4px', left: keys.IS_AUTONOMOUS_MODE ? '30px' : '4px',
                                        transition: 'all 0.3s', boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
                                    }} />
                                </div>
                            </div>
                        </motion.div>

                        {/* Section: Airtable Integration */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <h3 style={{ color: 'var(--velveto-text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', paddingLeft: '0.5rem' }}>Airtable Integration</h3>
                            {['AIRTABLE_API_KEY', 'AIRTABLE_BASE_ID', 'AIRTABLE_TABLE_NAME'].map(name => (
                                <SettingInput key={name} name={name} value={keys[name]} onChange={handleChange} />
                            ))}
                        </div>

                        {/* Section: Other Keys */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <h3 style={{ color: 'var(--velveto-text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', paddingLeft: '0.5rem' }}>Standard API Keys</h3>
                            {Object.entries(keys)
                                .filter(([k]) => !['IS_AUTONOMOUS_MODE', 'AIRTABLE_API_KEY', 'AIRTABLE_BASE_ID', 'AIRTABLE_TABLE_NAME'].includes(k))
                                .map(([name, value]) => (
                                    <SettingInput key={name} name={name} value={value} onChange={handleChange} />
                                ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}

function SettingInput({ name, value, onChange }) {
    const isSensitive = name.includes('PASSWORD') || name.includes('TOKEN') || name.includes('KEY');
    return (
        <motion.div className="velveto-card" style={{ padding: '1.5rem 2rem', border: '1px solid rgba(255,255,255,0.03)' }}>
            <div style={{ color: 'var(--velveto-accent-primary)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                {name.replace(/_/g, ' ')}
            </div>
            <input
                type="text"
                value={value === 'Not Set' ? '' : value}
                placeholder={value === 'Not Set' ? 'Введите значение...' : ''}
                onChange={(e) => onChange(name, e.target.value)}
                style={{
                    width: '100%', fontSize: '1rem', color: 'var(--velveto-text-primary)', fontFamily: 'monospace',
                    background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.8rem', borderRadius: '4px', outline: 'none'
                }}
            />
        </motion.div>
    );
}

const styles = `
    @media (max-width: 768px) {
        .settings-header {
            padding: 1rem !important;
        }
        .logo-text {
            font-size: 1.2rem !important;
        }
        main {
            padding: 2rem 1rem !important;
        }
        .settings-page-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 1.5rem !important;
        }
        .title-text {
            font-size: 2rem !important;
        }
        .save-button {
            width: 100% !important;
        }
        .desktop-only {
            display: none !important;
        }
    }
`

export function StyleTag() {
    return <style dangerouslySetInnerHTML={{ __html: styles }} />
}

// Wrap export to include styles
const SettingsWithStyles = () => (
    <>
        <StyleTag />
        <Settings />
    </>
)

export default SettingsWithStyles

