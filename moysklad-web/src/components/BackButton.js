'use client';
import Link from 'next/link';

export default function BackButton({ href = '/' }) {
    return (
        <Link href={href} style={{ textDecoration: 'none' }}>
            <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                color: 'var(--velveto-text-secondary, #a1a1aa)',
                fontSize: '0.9rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginBottom: '1rem'
            }}>
                <span>←</span>
                <span>Назад</span>
            </div>
        </Link>
    );
}
