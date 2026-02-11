'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ModerationFixModal({ isOpen, onClose, product, onFixApplied }) {
    const [loading, setLoading] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);

    useEffect(() => {
        if (isOpen && product && product.kaspi_status === 'rejected') {
            fetchSuggestion();
        }
    }, [isOpen, product]);

    const fetchSuggestion = async () => {
        setAiLoading(true);
        setAiSuggestion(null);
        try {
            const res = await fetch('/api/ai/suggest-fix', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: product.id,
                    rejectionReason: product.kaspi_details,
                    productData: product
                })
            });
            const data = await res.json();
            if (data.analysis) {
                setAiSuggestion(data);
            }
        } catch (err) {
            console.error('AI Suggestion Error:', err);
        } finally {
            setAiLoading(false);
        }
    };

    const handleApplyFix = async (action) => {
        setLoading(true);
        try {
            // 1. Apply the fix (updates name/desc/etc and resets status to pending)
            const res = await fetch('/api/ai/apply-fix', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: product.id,
                    actionType: action.type,
                    payload: action.payload
                })
            });

            if (!res.ok) throw new Error('Failed to apply fix');

            // 2. Increment retry count and handle limit
            const currentRetries = (product.moderation_retries || 0) + 1;

            let updateData = {
                moderation_retries: currentRetries
            };

            // If reached limit (3), move to "closed"
            if (currentRetries >= 3) {
                updateData.kaspi_status = 'closed';
                updateData.kaspi_details = `Достигнут лимит попыток исправления (3). Последняя ошибка: ${product.kaspi_details}`;
                updateData.is_closed = true;
            }

            // In our system, the worker will pick up 'pending' status records and re-create them.
            // But we need to make sure the DB is updated with the retry count.
            // Note: apply-fix already sets status to 'pending'.

            const { error: dbError } = await supabase
                .schema('Parser')
                .table('wb_search_results')
                .update(updateData)
                .eq('id', product.id);

            if (dbError) throw dbError;

            if (onFixApplied) onFixApplied();
            onClose();
        } catch (err) {
            alert(`Ошибка: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleResubmit = async () => {
        setLoading(true);
        try {
            // Manual resubmit without changing fields
            const currentRetries = (product.moderation_retries || 0) + 1;

            let updateData = {
                kaspi_status: 'pending',
                kaspi_details: null,
                moderation_retries: currentRetries
            };

            if (currentRetries >= 3) {
                updateData.kaspi_status = 'closed';
                updateData.kaspi_details = `Достигнут лимит попыток исправления (3).`;
                updateData.is_closed = true;
            }

            const { error: dbError } = await supabase
                .schema('Parser')
                .table('wb_search_results')
                .update(updateData)
                .eq('id', product.id);

            if (dbError) throw dbError;

            if (onFixApplied) onFixApplied();
            onClose();
        } catch (err) {
            alert(`Ошибка: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)'
                }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    style={{
                        background: '#0B0F1A', padding: '2rem', borderRadius: '24px',
                        width: '95%', maxWidth: '600px', border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        maxHeight: '90vh', overflowY: 'auto'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ color: '#EF4444' }}>❌</span> Отклонено
                            </h2>
                            <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
                                {product?.kaspi_status === 'closed' ? 'Попытки исчерпаны' : `Попытка ${product?.moderation_retries || 0} из 3`}
                            </div>
                        </div>
                        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
                    </div>

                    {/* Rejection Details */}
                    <div style={{ marginBottom: '1.5rem', padding: '1.2rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '16px' }}>
                        <div style={{ fontSize: '0.8rem', color: '#EF4444', marginBottom: '0.5rem', fontWeight: 'bold' }}>ПРИЧИНА ОШИБКИ</div>
                        <div style={{ fontSize: '1rem', lineHeight: '1.6', color: '#fca5a5' }}>{product?.kaspi_details || 'Не указана'}</div>
                    </div>

                    {/* AI Analysis */}
                    {product?.kaspi_status !== 'closed' && (
                        <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '16px' }}>
                            <div style={{ fontSize: '0.8rem', color: '#3B82F6', marginBottom: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '1.2rem' }}>✨</span> AI АНАЛИЗ И РЕШЕНИЕ
                            </div>

                            {aiLoading ? (
                                <div style={{ padding: '1rem', textAlign: 'center', color: '#888' }}>
                                    <div className="loader" style={{ marginBottom: '10px' }}></div>
                                    Поиск решения...
                                </div>
                            ) : aiSuggestion ? (
                                <div>
                                    <div style={{ fontSize: '0.95rem', lineHeight: '1.5', color: '#93c5fd', marginBottom: '1.2rem' }}>
                                        {aiSuggestion.analysis}
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                        {aiSuggestion.actions?.map((action, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleApplyFix(action)}
                                                disabled={loading}
                                                style={{
                                                    padding: '0.8rem 1.2rem',
                                                    background: 'rgba(59, 130, 246, 0.2)',
                                                    border: '1px solid rgba(59, 130, 246, 0.4)',
                                                    borderRadius: '12px',
                                                    color: '#fff',
                                                    fontSize: '0.9rem',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    flex: '1 1 auto',
                                                    fontWeight: '600'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'}
                                            >
                                                {action.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div style={{ color: '#666', fontSize: '0.9rem' }}>Не удалось получить рекомендации от ИИ.</div>
                            )}
                        </div>
                    )}

                    {product?.kaspi_status !== 'closed' ? (
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={handleResubmit}
                                disabled={loading || aiLoading}
                                style={{
                                    flex: 2,
                                    padding: '1.1rem',
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                    background: 'transparent',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '14px',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {loading ? '...' : 'Отправить без изменений'}
                            </button>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '1rem', color: '#666', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                            Карточка перенесена в закрытые, так как не прошла модерацию после 3 попыток.
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
