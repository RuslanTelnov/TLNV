'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const apiData = [
    {
        category: 'Authentication',
        endpoints: [
            {
                method: 'HEADER',
                path: 'x-api-key',
                description: 'All specialized API requests (V1) require authentication via the `x-api-key` header. You can find your current API key in the Dashboard Settings.',
                example: 'x-api-key: your_dashboard_secret_key'
            }
        ]
    },
    {
        category: 'Product Management (V1)',
        endpoints: [
            {
                method: 'GET',
                path: '/api/v1/products',
                description: 'Search and list products retrieved from Wildberries analytics.',
                params: [
                    { name: 'brand', type: 'string', desc: 'Filter by brand name (case-insensitive)' },
                    { name: 'limit', type: 'number', desc: 'Number of results (default 50)' },
                    { name: 'offset', type: 'number', desc: 'Pagination offset' }
                ],
                response: `{
  "data": [...],
  "pagination": { "total": 641, "limit": 1, "offset": 0 }
}`
            },
            {
                method: 'GET',
                path: '/api/v1/products/[id]',
                description: 'Retrieve detailed information about a specific product by its Wildberries ID.',
                response: `{ "id": "123", "name": "...", "price_kzt": 5000, ... }`
            },
            {
                method: 'PATCH',
                path: '/api/v1/products/[id]',
                description: 'Update localized product details in the dashboard database.',
                payload: `{ "price_kzt": 5500, "name": "Updated Name" }`,
                response: `{ "success": true, "data": { ... } }`
            }
        ]
    },
    {
        category: 'Automation & Conveyor',
        endpoints: [
            {
                method: 'GET',
                path: '/api/v1/automation',
                description: 'Check the status of the automated parsing queue.',
                response: `{
  "queue": [...],
  "status": "idle" 
}`
            },
            {
                method: 'POST',
                path: '/api/v1/automation',
                description: 'Trigger various automation tasks.',
                payload: `{
  "action": "parse" | "conveyor_start",
  "query": "search_term",
  "mode": "search" | "top",
  "page": 1
}`,
                response: `{ "success": true, "message": "Job queued", "job": { ... } }`
            },
            {
                method: 'DELETE',
                path: '/api/v1/automation',
                description: 'Clear all pending jobs in the automation queue.',
                response: `{ "message": "Queue cleared" }`
            }
        ]
    },
    {
        category: 'Kaspi Integration',
        endpoints: [
            {
                method: 'GET',
                path: '/api/v1/kaspi',
                description: 'Get Kaspi XML feed link and current status.',
                response: `{
  "xml_feed_url": "https://.../api/kaspi/xml-feed",
  "products_in_feed": 150,
  "status": "active"
}`
            },
            {
                method: 'POST',
                path: '/api/v1/kaspi',
                description: 'Manually queue a product for Kaspi card creation.',
                payload: `{ "id": "wb_product_id" }`,
                response: `{ "message": "Product queued for Kaspi creation", "id": "..." }`
            },
            {
                method: 'GET',
                path: '/api/kaspi/xml-feed',
                description: 'Public endpoint to serve the Kaspi XML price/stock feed. Used by Kaspi Merchant cabinet.',
                response: 'XML Data'
            }
        ]
    },
    {
        category: 'MoySklad Operations',
        endpoints: [
            {
                method: 'POST',
                path: '/api/oprihodovanie',
                description: 'Create a Supply (Оприходование) record in MoySklad for a specific product.',
                payload: `{
  "product": { "id": "...", "name": "...", "price_kzt": 0 },
  "quantity": 10
}`,
                response: `{ "success": true, "data": { "ms_id": "...", "name": "Supply #1" } }`
            }
        ]
    },
    {
        category: 'Content Generation (AI)',
        endpoints: [
            {
                method: 'POST',
                path: '/api/content/generate-text',
                description: 'Generate product descriptions or SEO text using OpenAI.',
                payload: `{ "prompt": "Write a description for socks", "context": "brand: Nike" }`,
                response: `{ "text": "Generated description..." }`
            },
            {
                method: 'POST',
                path: '/api/content/generate-image',
                description: 'Generate or modify product images using AI (Stability/DALL-E).',
                payload: `{ "prompt": "Product on a white background", "image_url": "..." }`,
                response: `{ "url": "https://...generated_image.png" }`
            }
        ]
    }
];

export default function DocsPage() {
    const [search, setSearch] = useState('');

    const filteredData = apiData.map(cat => ({
        ...cat,
        endpoints: cat.endpoints.filter(e =>
            e.path.toLowerCase().includes(search.toLowerCase()) ||
            cat.category.toLowerCase().includes(search.toLowerCase()) ||
            e.description.toLowerCase().includes(search.toLowerCase())
        )
    })).filter(cat => cat.endpoints.length > 0);

    return (
        <div style={{
            minHeight: '100vh',
            background: '#0a0a0b',
            color: '#e4e4e7',
            fontFamily: 'Inter, system-ui, sans-serif',
            padding: '2rem 1rem'
        }}>
            {/* Header */}
            <header style={{
                maxWidth: '1000px',
                margin: '0 auto 3rem auto',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                paddingBottom: '1.5rem'
            }}>
                <div>
                    <h1 style={{
                        fontSize: '2rem',
                        fontWeight: '800',
                        color: '#fff',
                        margin: 0,
                        letterSpacing: '-0.025em'
                    }}>
                        VELVETO <span style={{ color: '#888' }}>API DOCS</span>
                    </h1>
                    <p style={{ color: '#71717a', marginTop: '0.5rem' }}>
                        Reference for external application integration
                    </p>
                </div>
                <Link href="/settings" style={{
                    color: '#a1a1aa',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    border: '1px solid rgba(255,255,255,0.1)',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    transition: 'all 0.2s'
                }} onMouseOver={e => e.currentTarget.style.borderColor = '#fff'}
                    onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}>
                    Dashboard
                </Link>
            </header>

            {/* Main Content */}
            <main style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ marginBottom: '2.5rem' }}>
                    <input
                        type="text"
                        placeholder="Search endpoints..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            width: '100%',
                            background: '#18181b',
                            border: '1px solid #27272a',
                            padding: '1rem',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '1rem',
                            outline: 'none focus:border-white',
                            transition: 'border-color 0.2s'
                        }}
                    />
                </div>

                {filteredData.map((category, idx) => (
                    <motion.section
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        style={{ marginBottom: '4rem' }}
                    >
                        <h2 style={{
                            fontSize: '1.25rem',
                            fontWeight: '600',
                            color: '#fff',
                            marginBottom: '1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem'
                        }}>
                            <div style={{ width: '4px', height: '24px', background: '#3b82f6', borderRadius: '4px' }} />
                            {category.category}
                        </h2>

                        <div style={{ display: 'grid', gap: '2rem' }}>
                            {category.endpoints.map((ep, eIdx) => (
                                <div key={eIdx} style={{
                                    background: '#18181b',
                                    borderRadius: '12px',
                                    border: '1px solid #27272a',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        padding: '1.25rem',
                                        background: 'rgba(255,255,255,0.02)',
                                        borderBottom: '1px solid #27272a',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        flexWrap: 'wrap'
                                    }}>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            fontWeight: '800',
                                            padding: '0.25rem 0.6rem',
                                            borderRadius: '4px',
                                            background: ep.method === 'GET' ? '#1e3a8a' : ep.method === 'POST' ? '#14532d' : ep.method === 'DELETE' ? '#7f1d1d' : '#3f3f46',
                                            color: ep.method === 'GET' ? '#bfdbfe' : ep.method === 'POST' ? '#bbf7d0' : ep.method === 'DELETE' ? '#fecaca' : '#fff'
                                        }}>
                                            {ep.method}
                                        </span>
                                        <code style={{
                                            fontSize: '1rem',
                                            color: '#f4f4f5',
                                            fontWeight: '600'
                                        }}>
                                            {ep.path}
                                        </code>
                                    </div>

                                    <div style={{ padding: '1.5rem' }}>
                                        <p style={{ color: '#a1a1aa', margin: '0 0 1.5rem 0', lineHeight: 1.6 }}>
                                            {ep.description}
                                        </p>

                                        {ep.params && (
                                            <div style={{ marginBottom: '1.5rem' }}>
                                                <h4 style={{ fontSize: '0.875rem', color: '#fff', marginBottom: '0.75rem' }}>Query Parameters</h4>
                                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                                    <thead>
                                                        <tr style={{ textAlign: 'left', borderBottom: '1px solid #27272a' }}>
                                                            <th style={{ padding: '0.5rem 0', color: '#71717a' }}>Name</th>
                                                            <th style={{ padding: '0.5rem 0', color: '#71717a' }}>Type</th>
                                                            <th style={{ padding: '0.5rem 0', color: '#71717a' }}>Description</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {ep.params.map((p, pIdx) => (
                                                            <tr key={pIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                                                <td style={{ padding: '0.75rem 0', color: '#3b82f6', fontWeight: '500' }}>{p.name}</td>
                                                                <td style={{ padding: '0.75rem 0', color: '#d4d4d8' }}>{p.type}</td>
                                                                <td style={{ padding: '0.75rem 0', color: '#a1a1aa' }}>{p.desc}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}

                                        <div style={{ display: 'grid', gridTemplateColumns: ep.payload && ep.response ? '1fr 1fr' : '1fr', gap: '1rem' }}>
                                            {ep.payload && (
                                                <div>
                                                    <h4 style={{ fontSize: '0.875rem', color: '#fff', marginBottom: '0.75rem' }}>Request Body</h4>
                                                    <pre style={{
                                                        background: '#09090b',
                                                        padding: '1rem',
                                                        borderRadius: '8px',
                                                        fontSize: '0.8rem',
                                                        overflowX: 'auto',
                                                        border: '1px solid #27272a',
                                                        color: '#10b981'
                                                    }}>
                                                        {ep.payload}
                                                    </pre>
                                                </div>
                                            )}
                                            {ep.response && (
                                                <div>
                                                    <h4 style={{ fontSize: '0.875rem', color: '#fff', marginBottom: '0.75rem' }}>Response</h4>
                                                    <pre style={{
                                                        background: '#09090b',
                                                        padding: '1rem',
                                                        borderRadius: '8px',
                                                        fontSize: '0.8rem',
                                                        overflowX: 'auto',
                                                        border: '1px solid #27272a',
                                                        color: '#3b82f6'
                                                    }}>
                                                        {ep.response}
                                                    </pre>
                                                </div>
                                            )}
                                            {ep.example && !ep.payload && !ep.response && (
                                                <div>
                                                    <h4 style={{ fontSize: '0.875rem', color: '#fff', marginBottom: '0.75rem' }}>Example Value</h4>
                                                    <pre style={{
                                                        background: '#09090b',
                                                        padding: '1rem',
                                                        borderRadius: '8px',
                                                        fontSize: '0.8rem',
                                                        border: '1px solid #27272a',
                                                        color: '#facc15'
                                                    }}>
                                                        {ep.example}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.section>
                ))}
            </main>

            <footer style={{
                textAlign: 'center',
                padding: '4rem 0',
                color: '#52525b',
                fontSize: '0.875rem',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                marginTop: '4rem'
            }}>
                &copy; 2026 VELVETO. All documentation is subject to change. Use your private API key responsibly.
            </footer>
        </div>
    );
}
