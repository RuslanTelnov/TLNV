'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function BackButton({ href = '/' }) {
    return (
        <Link href={href} style={{ textDecoration: 'none' }}>
            <motion.div
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                whileTap={{ scale: 0.95 }}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.8rem',
                    padding: '0.7rem 1.2rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '14px',
                    color: '#c3c9d9',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }}
            >
                <span style={{ fontSize: '1.2rem', lineHeight: 0 }}>←</span>
                <span>Назад</span>
            </motion.div>
        </Link>
    );
}
