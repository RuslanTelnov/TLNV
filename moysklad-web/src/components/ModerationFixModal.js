'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ModerationFixModal({ isOpen, onClose, product, onFixApplied }) {
    const [loading, setLoading] = useState(false);

    const handleResubmit = async () => {
        setLoading(true);
        try {
            // Re-use apply-fix endpoint but just to reset status
            // We'll send a dummy update_field or make a new action type logic
            // Actually simplest is to send an update that effectively does nothing but trigger the side-effect (reset status)
            // Or better, let's just make a specific call directly here or reuse the endpoint cleanly.

            // Usage of existing apply-fix logic:
            // The existing endpoint resets status if we send 'update_field'. 
            // We can send a dummy field update or just use a dedicated 'resubmit' type if we add it.
            // Let's rely on the fact that we can just update 'kaspi_status' directly via supabase in the API.
            // But we can reuse the generic 'update_field' with a no-op or re-saving the name.

            const res = await fetch('/api/ai/apply-fix', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: product.id,
                    actionType: 'update_field',
                    payload: { field: 'name', value: product.name } // Re-save name to trigger reset logic
                })
            });

            if (!res.ok) throw new Error('Failed to resubmit');

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
                    backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)'
                }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    style={{
                        background: '#1e1e1e', padding: '2rem', borderRadius: '16px',
                        width: '90%', maxWidth: '500px', border: '1px solid #333',
                        color: '#fff', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>⚠️ Отклонено Модератором</h2>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                    </div>

                    <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px' }}>
                        <div style={{ fontSize: '0.9rem', color: '#EF4444', marginBottom: '0.5rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Причина отказа</div>
                        <div style={{ fontSize: '1.1rem', lineHeight: '1.5' }}>{product?.kaspi_details || 'Причина не указана'}</div>
                    </div>

                    <div style={{ textAlign: 'center', color: '#888', marginBottom: '2rem', fontSize: '0.9rem' }}>
                        Исправьте ошибку в карточке (в МойСклад или WB) и нажмите кнопку ниже для повторной выгрузки.
                    </div>

                    <button
                        onClick={handleResubmit}
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                            background: loading ? '#555' : 'var(--velveto-accent-primary)',
                            border: 'none', borderRadius: '10px',
                            color: '#fff', cursor: loading ? 'wait' : 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {loading ? 'Отправка...' : '🔄 Отправить на перепроверку'}
                    </button>

                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
