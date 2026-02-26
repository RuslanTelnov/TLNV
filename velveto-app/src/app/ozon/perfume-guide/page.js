'use client';

import BackButton from '../../components/BackButton';

export default function OzonPerfumeGuide() {
    return (
        <div className="page-container" style={{ minHeight: '100vh', background: '#050814', color: '#fff', padding: '3rem' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <BackButton />
                </div>

                <header style={{ marginBottom: '4rem' }}>
                    <h1 style={{ fontWeight: '100', letterSpacing: '0.1em', marginBottom: '1rem', fontSize: '2.5rem' }}>
                        ГВИД ПО ПРОДАЖЕ <span style={{ color: '#c9a05a' }}>ПАРФЮМЕРИИ</span> НА OZON (КАЗАХСТАН)
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.1rem' }}>Полная информация по налогам, логистике и требованиям для ТОО в Казахстане</p>
                </header>

                <div style={{ display: 'grid', gap: '3rem' }}>
                    {/* Strategy Comparison */}
                    <section style={{ background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h2 style={{ color: '#c9a05a', marginBottom: '1.5rem', fontWeight: '300' }}>1. ВЫБОР МОДЕЛИ РАБОТЫ</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px' }}>
                                <h3 style={{ color: '#3b82f6', marginBottom: '1rem' }}>FBS (Recommended)</h3>
                                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', lineHeight: '1.6' }}>
                                    Вы храните товар у себя. При поступлении заказа — пакуете и везете в пункт приема Ozon (Алматы/Астана).
                                    <br /><br />
                                    <strong>Плюсы:</strong> Нет проблем с пожарной безопасностью складов (парфюм — это опасный груз Класса 3).
                                </p>
                            </div>
                            <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', opacity: 0.7 }}>
                                <h3 style={{ color: '#10b981', marginBottom: '1rem' }}>FBO (Storage)</h3>
                                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', lineHeight: '1.6' }}>
                                    Товар лежит на складе Ozon. Хранение бесплатно до июля 2026.
                                    <br /><br />
                                    <strong>Минусы:</strong> Склады в КЗ часто ограничивают прием легковоспламеняющихся жидкостей.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Commissions & Logistics */}
                    <section style={{ background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h2 style={{ color: '#c9a05a', marginBottom: '1.5rem', fontWeight: '300' }}>2. КОМИССИИ И ТАРИФЫ (ТЕНГЕ)</h2>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <span>Комиссия за продажу (с НДС)</span>
                                <span style={{ color: '#ef4444', fontWeight: 'bold' }}>18% - 21%</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <span>Логистика (цена до 5000 ₸)</span>
                                <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>212 ₸</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <span>Логистика (цена 5000 - 15000 ₸)</span>
                                <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>699 ₸</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <span>Логистика (цена &gt; 15000 ₸)</span>
                                <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>750 ₸+</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem' }}>
                                <span>Сборка/Приемка (FBS)</span>
                                <span style={{ color: 'rgba(255,255,255,0.4)' }}>15 - 45 ₸ / заказ</span>
                            </div>
                        </div>
                    </section>

                    {/* Documentation */}
                    <section style={{ background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h2 style={{ color: '#c9a05a', marginBottom: '1.5rem', fontWeight: '300' }}>3. ОБЯЗАТЕЛЬНЫЕ ДОКУМЕНТЫ</h2>
                        <ul style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '2' }}>
                            <li><strong>Декларация о соответствии (ТР ТС 009/2011)</strong> — Обязательно для парфюмерно-косметической продукции.</li>
                            <li><strong>Паспорт безопасности (MSDS)</strong> — Подтверждает температуру вспышки и класс опасности (Класс 3).</li>
                            <li><strong>Честный ЗНАК (DataMatrix)</strong> — Требуется для продаж на территорию РФ (кросс-бордер). Без него товар будет виден только внутри Казахстана.</li>
                        </ul>
                    </section>

                    {/* Step by Step */}
                    <section style={{ textAlign: 'center', padding: '4rem 0' }}>
                        <h2 style={{ fontWeight: '100', marginBottom: '2rem' }}>ГОТОВЫ НАЧАТЬ ПРОДАЖИ?</h2>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem' }}>
                            <a href="https://seller.ozon.kz" target="_blank" rel="noopener noreferrer" style={{ padding: '1rem 2rem', background: '#c9a05a', color: '#050814', textDecoration: 'none', borderRadius: '12px', fontWeight: 'bold' }}>Регистрация Seller</a>
                            <a href="/s-parfum" style={{ padding: '1rem 2rem', border: '1px solid #c9a05a', color: '#c9a05a', textDecoration: 'none', borderRadius: '12px', fontWeight: 'bold' }}>Вернуться к расчету</a>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
