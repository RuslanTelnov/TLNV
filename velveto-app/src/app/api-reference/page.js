'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const API_GROUPS = [
    {
        title: 'Аутентификация',
        description: 'Безопасность и доступ к API через ключи.',
        endpoints: [
            {
                method: 'HEADER',
                path: 'x-api-key',
                description: 'Все запросы к специализированным эндпоинтам (V1) требуют передачи API-ключа. Ключ можно найти в настройках панели управления.',
                example: 'x-api-key: ваш_секретный_ключ'
            }
        ]
    },
    {
        title: 'Управление продуктами (V1)',
        description: 'Нормализованный API для работы с базой товаров и аналитикой.',
        endpoints: [
            {
                method: 'GET',
                path: '/api/v1/products',
                description: 'Поиск и получение списка товаров из обогащенной базы данных.',
                params: [
                    { name: 'brand', type: 'string', desc: 'Фильтр по названию бренда (без учета регистра)', required: false },
                    { name: 'limit', type: 'number', desc: 'Количество результатов на страницу (по умолчанию 50)', required: false },
                    { name: 'offset', type: 'number', desc: 'Смещение для пагинации', required: false }
                ],
                response: `{
  "data": [
    { "id": "123", "name": "Товар", "price_kzt": 5000, "brand": "Nike" }
  ],
  "pagination": { "total": 150, "limit": 50, "offset": 0 }
}`
            },
            {
                method: 'GET',
                path: '/api/v1/products/[id]',
                description: 'Получение детальной информации о конкретном товаре по его артикулу Wildberries.',
                params: [
                    { name: 'id', type: 'string', desc: 'Артикул товара WB', required: true }
                ],
                response: `{
  "id": "123873313",
  "name": "Кроссовки женские",
  "specs": { "color": "Blue", "material": "Mesh" },
  "price_kzt": 15000
}`
            },
            {
                method: 'PATCH',
                path: '/api/v1/products/[id]',
                description: 'Локальное обновление данных товара в базе дашборда.',
                params: [
                    { name: 'id', type: 'string', desc: 'Артикул товара WB', required: true }
                ],
                payload: `{
  "price_kzt": 15500,
  "name": "Обновленное название"
}`,
                response: `{ "success": true, "data": { ... } }`
            }
        ]
    },
    {
        title: 'Автоматизация и Конвейер',
        description: 'Управление очередями парсинга и процессом создания товаров.',
        endpoints: [
            {
                method: 'GET',
                path: '/api/v1/automation',
                description: 'Получение текущего состояния очереди задач автоматизации.',
                response: `{
  "queue": [ { "id": 1, "query": "socks", "status": "pending" } ],
  "status": "idle"
}`
            },
            {
                method: 'POST',
                path: '/api/v1/automation',
                description: 'Запуск задач парсинга или процессов конвейера.',
                payload: `{
  "action": "parse",
  "query": "search_term",
  "mode": "search",
  "page": 1
}`,
                response: `{ "success": true, "message": "Задача добавлена в очередь" }`
            },
            {
                method: 'GET',
                path: '/api/conveyor/status',
                description: 'Детальная телеметрия работающего процесса конвейера.',
                response: `{ "active": true, "processed": 10, "current": "Article 123" }`
            }
        ]
    },
    {
        title: 'Интеграция с Маркетплейсами',
        description: 'Управление выгрузкой на Kaspi и Ozon.',
        endpoints: [
            {
                method: 'GET',
                path: '/api/kaspi/xml-feed',
                description: 'Публичная ссылка на XML-фид цен и остатков для Kaspi Merchant.',
                response: 'XML Data (Standard Kaspi Format)'
            },
            {
                method: 'POST',
                path: '/api/ozon/create-card',
                description: 'Запрос на создание карточки товара на Ozon.',
                payload: `{ "product": { "name": "...", "price": 1000, "article": "..." } }`,
                response: `{ "success": true, "task_id": "..." }`
            }
        ]
    },
    {
        title: 'Операции МойСклад',
        description: 'Прямая интеграция с системой складского учета.',
        endpoints: [
            {
                method: 'GET',
                path: '/api/moysklad/search',
                description: 'Поиск товара в системе МойСклад по артикулу.',
                params: [{ name: 'article', type: 'string', desc: 'Артикул в МойСклад', required: true }],
                response: `{ "found": true, "id": "ms-uuid", "stock": 45 }`
            },
            {
                method: 'POST',
                path: '/api/oprihodovanie',
                description: 'Создание документа «Оприходование» для пополнения стока.',
                payload: `{ "product_id": "ms-uuid", "quantity": 10 }`,
                response: `{ "success": true, "ms_id": "supply-uuid" }`
            }
        ]
    },
    {
        title: 'ИИ Лаборатория',
        description: 'Инструменты генерации контента через нейронные сети.',
        endpoints: [
            {
                method: 'POST',
                path: '/api/content/generate-text',
                description: 'Генерация SEO-описания товара на основе промпта.',
                payload: `{ "prompt": "Напиши описание для кроссовок", "context": "Adidas" }`,
                response: `{ "text": "Кроссовки Adidas — это..." }`
            },
            {
                method: 'POST',
                path: '/api/content/generate-image',
                description: 'Генерация или изменение фона изображения товара.',
                payload: `{ "image_url": "...", "prompt": "на белом фоне" }`,
                response: `{ "url": "https://...generated.png" }`
            }
        ]
    }
];

export default function ApiReference() {
    const [activeTab, setActiveTab] = useState(API_GROUPS[0].title);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredGroups = API_GROUPS.map(group => ({
        ...group,
        endpoints: group.endpoints.filter(e =>
            e.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            group.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(group => group.endpoints.length > 0);

    return (
        <div style={{
            minHeight: '100vh',
            background: '#050505',
            color: '#fff',
            fontFamily: '"Outfit", "Inter", sans-serif',
            padding: '4rem 2rem'
        }}>
            {/* Ambient Background */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: '500px',
                background: 'radial-gradient(circle at 50% -20%, rgba(255, 179, 90, 0.1), transparent 70%)',
                pointerEvents: 'none',
                zIndex: 0
            }} />

            <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                {/* Header Section */}
                <header style={{ marginBottom: '4rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '2.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div>
                            <h1 style={{ fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-0.02em', margin: 0 }}>
                                VELVETO <span style={{ color: '#ffb35a' }}>API REFERENCE</span>
                            </h1>
                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.1rem', marginTop: '0.5rem' }}>
                                Полное руководство по интеграции внешних приложений и автоматизации.
                            </p>
                        </div>
                        <Link href="/settings" style={{
                            background: '#ffb35a',
                            color: '#000',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '12px',
                            fontWeight: '700',
                            textDecoration: 'none',
                            fontSize: '0.9rem',
                            boxShadow: '0 0 20px rgba(255, 179, 90, 0.3)'
                        }}>
                            Информационная панель
                        </Link>
                    </div>

                    <div style={{ position: 'relative' }}>
                        <input
                            type="text"
                            placeholder="Поиск эндпоинта или функции..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                background: '#111',
                                border: '1px solid rgba(255,255,255,0.1)',
                                padding: '1.25rem 2rem',
                                borderRadius: '16px',
                                color: '#fff',
                                fontSize: '1.1rem',
                                outline: 'none',
                                transition: 'all 0.3s'
                            }}
                        />
                    </div>
                </header>

                <div style={{ display: 'flex', gap: '3rem' }}>
                    {/* Sticky Sidebar Navigation */}
                    <aside style={{ width: '280px', position: 'sticky', top: '2rem', height: 'fit-content', display: searchQuery ? 'none' : 'block' }}>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            {API_GROUPS.map(group => (
                                <button
                                    key={group.title}
                                    onClick={() => setActiveTab(group.title)}
                                    style={{
                                        textAlign: 'left',
                                        padding: '1rem',
                                        borderRadius: '12px',
                                        border: 'none',
                                        background: activeTab === group.title ? 'rgba(255,179,90,0.1)' : 'transparent',
                                        color: activeTab === group.title ? '#ffb35a' : 'rgba(255,255,255,0.4)',
                                        cursor: 'pointer',
                                        fontSize: '0.95rem',
                                        fontWeight: '600',
                                        transition: 'all 0.2s',
                                        borderLeft: activeTab === group.title ? '3px solid #ffb35a' : '3px solid transparent'
                                    }}
                                >
                                    {group.title}
                                </button>
                            ))}
                        </div>
                    </aside>

                    {/* Content Area */}
                    <main style={{ flex: 1 }}>
                        <AnimatePresence mode="wait">
                            {filteredGroups.filter(g => activeTab === g.title || searchQuery).map((group, groupIdx) => (
                                <motion.div
                                    key={group.title}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    style={{ marginBottom: '6rem' }}
                                >
                                    <div style={{ marginBottom: '3rem' }}>
                                        <h2 style={{ fontSize: '1.8rem', fontWeight: '700', borderLeft: '4px solid #ffb35a', paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                                            {group.title}
                                        </h2>
                                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.1rem', maxWidth: '800px' }}>
                                            {group.description}
                                        </p>
                                    </div>

                                    <div style={{ display: 'grid', gap: '2rem' }}>
                                        {group.endpoints.map((ep, eIdx) => (
                                            <EndpointDetail key={`${ep.method}-${ep.path}-${eIdx}`} endpoint={ep} />
                                        ))}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </main>
                </div>
            </div>

            <footer style={{ marginTop: '10rem', textAlign: 'center', color: 'rgba(255,255,255,0.1)', fontSize: '0.85rem', paddingBottom: '4rem' }}>
                &copy; 2026 VELVETO TECH INFRASTRUCTURE. ВСЕ ПРАВА ЗАЩИЩЕНЫ.
            </footer>
        </div>
    );
}

function EndpointDetail({ endpoint }) {
    const getMethodStyles = (method) => {
        const base = {
            padding: '0.25rem 0.6rem',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: '900',
            color: '#fff'
        };
        switch (method) {
            case 'GET': return { ...base, background: '#1e3a8a', color: '#bfdbfe', label: 'ПОЛУЧИТЬ' };
            case 'POST': return { ...base, background: '#064e3b', color: '#a7f3d0', label: 'ОТПРАВИТЬ' };
            case 'PATCH': return { ...base, background: '#78350f', color: '#fef3c7', label: 'ОБНОВИТЬ' };
            case 'HEADER': return { ...base, background: '#3f3f46', color: '#fff', label: 'ЗАГОЛОВОК' };
            default: return base;
        }
    };

    const styles = getMethodStyles(endpoint.method);

    return (
        <div style={{
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.05)',
            overflow: 'hidden'
        }}>
            {/* Summary Bar */}
            <div style={{
                padding: '1.5rem 2.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem',
                background: 'rgba(255,255,255,0.01)',
                borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}>
                <span style={styles}>{styles.label || endpoint.method}</span>
                <code style={{ fontSize: '1.1rem', color: '#fff', fontWeight: '700', letterSpacing: '0.02em' }}>{endpoint.path}</code>
            </div>

            {/* Content Body */}
            <div style={{ padding: '2.5rem' }}>
                <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: '2.5rem' }}>
                    {endpoint.description}
                </p>

                {endpoint.params && (
                    <div style={{ marginBottom: '3rem' }}>
                        <h4 style={{ fontSize: '0.85rem', color: '#ffb35a', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.5rem', fontWeight: '800' }}>
                            Параметры запроса
                        </h4>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        <th style={{ padding: '1rem 0', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>ИМЯ</th>
                                        <th style={{ padding: '1rem 0', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>ТИП</th>
                                        <th style={{ padding: '1rem 0', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>ОПИСАНИЕ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {endpoint.params.map(p => (
                                        <tr key={p.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <td style={{ padding: '1.25rem 0', color: '#3b82f6', fontWeight: '700', fontSize: '0.95rem' }}>
                                                {p.name}
                                                {p.required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
                                            </td>
                                            <td style={{ padding: '1.25rem 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>{p.type}</td>
                                            <td style={{ padding: '1.25rem 0', color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem' }}>{p.desc}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                    {(endpoint.payload || endpoint.example) && (
                        <div>
                            <h4 style={{ fontSize: '0.85rem', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', fontWeight: '800' }}>
                                ТЕЛО ЗАПРОСА / ПРИМЕР
                            </h4>
                            <pre style={{
                                background: '#000',
                                padding: '1.5rem',
                                borderRadius: '16px',
                                border: '1px solid rgba(16, 185, 129, 0.2)',
                                color: '#10b981',
                                fontSize: '0.9rem',
                                overflowX: 'auto',
                                margin: 0,
                                lineHeight: 1.5
                            }}>
                                {endpoint.payload || endpoint.example}
                            </pre>
                        </div>
                    )}

                    {endpoint.response && (
                        <div>
                            <h4 style={{ fontSize: '0.85rem', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', fontWeight: '800' }}>
                                ПРИМЕР ОТВЕТА
                            </h4>
                            <pre style={{
                                background: '#000',
                                padding: '1.5rem',
                                borderRadius: '16px',
                                border: '1px solid rgba(59, 130, 246, 0.2)',
                                color: '#3b82f6',
                                fontSize: '0.9rem',
                                overflowX: 'auto',
                                margin: 0,
                                lineHeight: 1.5
                            }}>
                                {endpoint.response}
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
