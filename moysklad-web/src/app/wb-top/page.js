'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';

export default function WbTopPage() {
    // Parsing / Data States
    const [query, setQuery] = useState('');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [parsing, setParsing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [parsingMode, setParsingMode] = useState(null);
    const [page, setPage] = useState(1);

    // Conveyor States
    const [isConveyorRunning, setIsConveyorRunning] = useState(false);
    const [conveyorLogs, setConveyorLogs] = useState('');
    const [toggleLoading, setToggleLoading] = useState(false);

    // AI Chat States
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatInput, setChatInput] = useState("");
    const [chatHistory, setChatHistory] = useState([
        { role: 'assistant', content: 'Привет! Я твой помощник. Я слежу за работой конвейера. Если возникнут ошибки, я подскажу, как их исправить.' }
    ]);
    const [aiLoading, setAiLoading] = useState(false);
    const chatEndRef = useRef(null);

    // Modals & User Actions
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [transferredProduct, setTransferredProduct] = useState(null);
    const [transferringId, setTransferringId] = useState(null);
    const [kaspiCreatingId, setKaspiCreatingId] = useState(null);
    const [filterMode, setFilterMode] = useState('new');
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isBulkProcessing, setIsBulkProcessing] = useState(false);
    const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, action: '' });
    const [showOprihodovanieModal, setShowOprihodovanieModal] = useState(false);
    const [oprihodovanieQuantity, setOprihodovanieQuantity] = useState(1);
    const [selectedProductForOprihodovanie, setSelectedProductForOprihodovanie] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [toast, setToast] = useState(null);

    // --- Effects ---

    useEffect(() => {
        fetchProducts();
        checkConveyorStatus();
    }, []);

    // Poll for conveyor updates if running
    useEffect(() => {
        let interval;
        if (isConveyorRunning) {
            interval = setInterval(() => {
                checkConveyorStatus();
                // We also silently refresh products to show status updates
                silentRefreshProducts();
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [isConveyorRunning]);

    useEffect(() => {
        if (isChatOpen) {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatHistory, isChatOpen]);

    // --- Data Fetching ---

    const checkConveyorStatus = async () => {
        try {
            const res = await fetch('/api/conveyor/status');
            const data = await res.json();
            setIsConveyorRunning(data.running);
            if (data.logs) setConveyorLogs(data.logs);
        } catch (e) {
            console.error(e);
        }
    };

    const toggleConveyor = async () => {
        setToggleLoading(true);
        try {
            if (isConveyorRunning) {
                await fetch('/api/conveyor/run', { method: 'DELETE' });
                showToast('Конвейер останавливается...', 'info');
                setIsConveyorRunning(false);
            } else {
                await fetch('/api/conveyor/run', { method: 'POST' });
                showToast('Конвейер запущен!', 'success');
                setIsConveyorRunning(true);
            }
        } catch (e) {
            showToast('Ошибка переключения конвейера', 'error');
        } finally {
            setToggleLoading(false);
        }
    };

    const fetchProducts = async (searchQuery = '') => {
        setLoading(true);
        await performFetch(searchQuery);
        setLoading(false);
    };

    const silentRefreshProducts = async () => {
        await performFetch(query);
    };

    const performFetch = async (searchQuery) => {
        try {
            let queryBuilder = supabase.from('wb_search_results').select('*');
            if (searchQuery) {
                queryBuilder = queryBuilder.eq('query', searchQuery).order('position', { ascending: true });
            } else {
                queryBuilder = queryBuilder.order('updated_at', { ascending: false }).limit(1000);
            }
            const { data, error } = await queryBuilder;
            if (!error) {
                setProducts(data || []);
                if (data && data.length > 0) {
                    const mostRecent = data.reduce((latest, p) => {
                        const current = new Date(p.updated_at);
                        return current > latest ? current : latest;
                    }, new Date(0));
                    setLastUpdated(mostRecent.toLocaleString());
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    // --- AI Chat ---
    const handleChatSubmit = async (e) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        const userMsg = chatInput;
        setChatInput("");
        setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
        setAiLoading(true);

        try {
            // Use existing AI route
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'app/json' },
                body: JSON.stringify({ message: "Context: Conveyor Dashboard. " + userMsg })
            });
            const data = await res.json();
            setChatHistory(prev => [...prev, { role: 'assistant', content: data.reply }]);
        } catch (e) {
            setChatHistory(prev => [...prev, { role: 'assistant', content: "Ошибка связи с мозгом." }]);
        } finally {
            setAiLoading(false);
        }
    };


    // --- Actions ---

    const handleParse = async (e, mode = 'search') => {
        if (e) e.preventDefault();
        if (mode === 'search' && !query) return;

        setParsing(true);
        setParsingMode(mode);
        showToast(mode === 'top' ? 'Загрузка Топ Продаж...' : 'Парсинг запущен...', 'info');
        try {
            const currentQuery = mode === 'top' ? 'Хиты' : query;
            const nextPage = page;

            const body = mode === 'top' ? { mode: 'top', page: nextPage } : { query, page: nextPage };

            const response = await fetch('/api/parse-top', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Parsing failed');

            setPage(prev => prev + 1);
            if (mode === 'top') setQuery('Хиты');

            await fetchProducts(mode === 'top' ? 'Хиты' : query);
        } catch (err) {
            alert('Error parsing: ' + err.message);
        } finally {
            setParsing(false);
            setParsingMode(null);
        }
    };

    const handleCreateInMS = async (product) => {
        setTransferringId(product.id);
        try {
            const response = await fetch('/api/transfer-product', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Transfer failed');

            if (!isBulkProcessing) {
                setTransferredProduct({
                    ...product,
                    moysklad_id: data.sync?.id,
                    sync_success: data.sync?.success,
                    sync_error: data.sync?.error
                });
                setShowSuccessModal(true);
            }
            return data;
        } catch (err) {
            if (!isBulkProcessing) alert('Ошибка переноса: ' + err.message);
            throw err;
        } finally {
            if (!isBulkProcessing) setTransferringId(null);
        }
    };

    const handleOprihodovanie = (product) => {
        setSelectedProductForOprihodovanie(product);
        setOprihodovanieQuantity(1);
        setShowOprihodovanieModal(true);
    };

    const confirmOprihodovanie = async () => {
        if (!selectedProductForOprihodovanie) return;
        await handleStocking(selectedProductForOprihodovanie, oprihodovanieQuantity);
        setShowOprihodovanieModal(false);
    };

    const handleStocking = async (product, quantity = 1) => {
        showToast('Запуск оприходования...', 'info');
        try {
            const response = await fetch('/api/oprihodovanie', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product: product, quantity: quantity }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Oprihodovanie failed');
            if (!isBulkProcessing) showToast('Оприходование успешно выполнено!', 'success');
            return data;
        } catch (err) {
            if (isBulkProcessing) throw err;
            showToast(`Ошибка: ${err.message}`, 'error');
        }
    };

    const handleCreateKaspi = async (product) => {
        if (!isBulkProcessing) setKaspiCreatingId(product.id);
        showToast('Запуск создания в Kaspi...', 'info');
        try {
            const response = await fetch('/api/create-kaspi-card', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Kaspi creation failed');
            if (!isBulkProcessing) showToast('Карточка в Kaspi успешно создана!', 'success');
            return data;
        } catch (err) {
            if (isBulkProcessing) throw err;
            showToast(`Ошибка: ${err.message}`, 'error');
        } finally {
            if (!isBulkProcessing) setKaspiCreatingId(null);
        }
    };

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };

    const handleUpdatePrices = () => setShowConfirmModal(true);
    const confirmUpdate = async () => {
        setShowConfirmModal(false);
        setUpdating(true);
        showToast('Запущен процесс обновления цен...', 'info');
        try {
            await fetch('/api/update-wb-search', { method: 'POST' });
            showToast('Цены успешно обновлены!', 'success');
            fetchProducts(query);
        } catch (err) {
            showToast('Ошибка обновления: ' + err.message, 'error');
        } finally {
            setUpdating(false);
        }
    };

    const toggleSelect = (id) => setSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
    });

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredProducts.length && filteredProducts.length > 0) setSelectedIds(new Set());
        else setSelectedIds(new Set(filteredProducts.map(p => p.id)));
    };

    const handleBulkAction = async (actionType) => {
        const ids = Array.from(selectedIds);
        if (ids.length === 0) return;
        setIsBulkProcessing(true);
        setBulkProgress({ current: 0, total: ids.length, action: actionType });
        showToast(`Запуск массового действия...`, 'info');

        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            const product = products.find(p => p.id === id);
            if (!product) continue;
            setBulkProgress(prev => ({ ...prev, current: i + 1, productName: product.name }));
            try {
                if (actionType === 'createMS') await handleCreateInMS(product);
                else if (actionType === 'stocking') await handleStocking(product);
                else if (actionType === 'kaspi') await handleCreateKaspi(product);
            } catch (err) {
                // log err
            }
        }
        setIsBulkProcessing(false);
        setSelectedIds(new Set());
        showToast(`Массовое действие завершено!`, 'success');
        fetchProducts();
    };


    // Helpers
    const latestUpdate = products.length > 0 ? Math.max(...products.map(p => new Date(p.updated_at).getTime())) : 0;
    const NEW_THRESHOLD_MS = 10 * 60 * 1000;

    // Image Modal State
    const [selectedImage, setSelectedImage] = useState(null);

    const filteredProducts = products.filter(p => {
        const productTime = new Date(p.updated_at).getTime();
        const isNew = latestUpdate - productTime < NEW_THRESHOLD_MS;

        // Strict separation: Restricted items go ONLY to 'closed' or 'all' (visually marked)
        if (filterMode === 'new') return isNew && !p.is_closed;
        if (filterMode === 'available') return !isNew && !p.is_closed;
        if (filterMode === 'closed') return (p.specs && p.specs.is_closed) === true;
        if (filterMode === 'all') return true;
        return true;
    });

    const newCount = products.filter(p => (latestUpdate - new Date(p.updated_at).getTime() < NEW_THRESHOLD_MS) && !p.is_closed).length;
    const availableCount = products.filter(p => (latestUpdate - new Date(p.updated_at).getTime() >= NEW_THRESHOLD_MS) && !p.is_closed).length;
    const closedCount = products.filter(p => p.is_closed).length;

    return (
        <div style={{ minHeight: '100vh', background: 'var(--velveto-bg-primary)' }}>

            {/* Header */}
            <header style={{
                padding: '1.5rem 3rem', position: 'sticky', top: 0, zIndex: 100,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                backdropFilter: 'blur(20px)', background: 'rgba(5, 8, 20, 0.95)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <Link href="/">
                        <h1 style={{ fontSize: '1.5rem', fontWeight: '300', letterSpacing: '0.15em', color: 'var(--velveto-text-primary)' }}>VELVETO</h1>
                    </Link>
                    <div style={{ height: '30px', width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>

                    {/* CONVEYOR TOGGLE */}
                    <button
                        onClick={toggleConveyor}
                        disabled={toggleLoading}
                        style={{
                            padding: '0.6rem 1.2rem',
                            borderRadius: '12px',
                            background: isConveyorRunning ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)',
                            color: isConveyorRunning ? '#10b981' : 'var(--velveto-text-muted)',
                            border: isConveyorRunning ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255,255,255,0.1)',
                            cursor: 'pointer',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.8rem',
                            fontSize: '0.85rem'
                        }}
                    >
                        <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: isConveyorRunning ? '#10b981' : '#EF4444',
                            boxShadow: isConveyorRunning ? '0 0 8px #10b981' : 'none'
                        }} />
                        {isConveyorRunning ? 'АВТОПИЛОТ ВКЛЮЧЕН' : 'АВТОПИЛОТ ВЫКЛЮЧЕН'}
                    </button>
                    {isConveyorRunning && (
                        <div style={{ fontSize: '0.8rem', color: '#666', fontFamily: 'monospace' }}>
                            Лог: {conveyorLogs.split('\n').pop()?.substring(0, 50)}...
                        </div>
                    )}
                </div>

                <nav style={{ display: 'flex', gap: '2rem' }}>
                    <Link href="/" style={{ color: 'var(--velveto-text-muted)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Главная</Link>
                </nav>
            </header>

            <main className="container" style={{ padding: '2rem 2rem', maxWidth: '1600px', margin: '0 auto' }}>

                {/* Search & Controls */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'center', marginBottom: '3rem', alignItems: 'center' }}>
                    <form onSubmit={(e) => handleParse(e)} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                            placeholder="Поиск WB"
                            style={{
                                padding: '1rem 1.5rem',
                                borderRadius: '16px',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                background: 'rgba(255, 255, 255, 0.03)',
                                color: 'white',
                                width: '350px',
                                fontSize: '1.1rem',
                                height: '56px',
                                outline: 'none',
                                transition: 'border-color 0.3s ease'
                            }}
                        />
                        <button type="submit" disabled={parsing || !query} className="velveto-button" style={{ height: '56px', fontSize: '1.1rem', padding: '0 2rem' }}>
                            {parsing ? '...' : 'Найти'}
                        </button>
                    </form>
                    <button onClick={() => fetchProducts(query)} className="velveto-button-outline" style={{ height: '56px', fontSize: '1.1rem', padding: '0 2rem' }}>Обновить</button>
                    <button onClick={() => handleParse(null, 'top')} className="velveto-button-outline" style={{ borderColor: parsedColor(parsingMode === 'top'), color: parsedColor(parsingMode === 'top'), height: '56px', fontSize: '1.1rem', padding: '0 2rem' }}>
                        🔥 Топ
                    </button>
                    <a href="/api/reports/generate" target="_blank" className="velveto-button-outline" style={{ height: '56px', fontSize: '1.1rem', padding: '0 2rem', display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
                        📄 Отчет
                    </a>

                    {/* BIG STANDALONE PARSER TOGGLE */}
                    <button
                        onClick={toggleConveyor}
                        disabled={toggleLoading}
                        style={{
                            height: '56px',
                            minWidth: '220px',
                            padding: '0 2rem',
                            borderRadius: '16px',
                            background: isConveyorRunning ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            boxShadow: isConveyorRunning ? '0 10px 20px rgba(245, 158, 11, 0.3)' : '0 10px 20px rgba(16, 185, 129, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.8rem',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        {isConveyorRunning ? '🛑 СТОП ПАРСЕР' : '🚀 СТАРТ ПАРСЕР'}
                    </button>
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
                    <FilterBtn label={`Все (${products.length})`} active={filterMode === 'all'} onClick={() => setFilterMode('all')} />
                    <FilterBtn label={`Новые (${newCount})`} active={filterMode === 'new'} onClick={() => setFilterMode('new')} color="#3b82f6" />
                    <FilterBtn label={`Доступные (${availableCount})`} active={filterMode === 'available'} onClick={() => setFilterMode('available')} color="#10b981" />
                    <FilterBtn label={`Закрытые (${closedCount})`} active={filterMode === 'closed'} onClick={() => setFilterMode('closed')} color="#EF4444" />
                </div>


                {/* CONTENT TABLE */}
                {loading ? <div style={{ textAlign: 'center', padding: '4rem' }}>Загрузка...</div> :
                    filteredProducts.length === 0 ? <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.5 }}>Пусто</div> :
                        (
                            <div className="ms-table-container">
                                <table className="ms-table">
                                    <thead>
                                        <tr>
                                            <th width="40"><input type="checkbox" onChange={toggleSelectAll} checked={selectedIds.size === filteredProducts.length && filteredProducts.length > 0} /></th>
                                            <th>Товар</th>
                                            <th>Цена</th>
                                            <th>Доставка</th>
                                            <th>Наличие</th>
                                            <th>Статус Конвейера</th>
                                            <th>Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredProducts.map(p => (
                                            <tr key={p.id}>
                                                <td><input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)} /></td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                        <div
                                                            style={{ width: '50px', height: '60px', borderRadius: '6px', overflow: 'hidden', cursor: 'pointer', position: 'relative' }}
                                                            onClick={() => setSelectedImage(p.image_url)}
                                                        >
                                                            <img src={p.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.0)', hover: { background: 'rgba(0,0,0,0.2)' } }} />
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 'bold' }}>{p.brand}</div>
                                                            <div style={{ fontSize: '0.9rem', color: 'var(--velveto-text-secondary)' }}>{p.name}</div>
                                                            <div style={{ fontSize: '0.75rem', opacity: 0.5, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                                ID: {p.id}
                                                                <a
                                                                    href={`https://www.wildberries.ru/catalog/${p.id}/detail.aspx`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    style={{ color: '#cb11ab', textDecoration: 'none', background: 'rgba(203, 17, 171, 0.1)', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}
                                                                >
                                                                    WB ↗
                                                                </a>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--velveto-accent-primary)' }}>{p.price_kzt} ₸</td>

                                                <td style={{ color: 'var(--velveto-text-secondary)', fontSize: '0.9rem' }}>
                                                    {p.delivery_days > 0 ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <span>🚚</span> {p.delivery_days} дн.
                                                        </div>
                                                    ) : (
                                                        <span style={{ opacity: 0.5 }}>—</span>
                                                    )}
                                                </td>

                                                <td style={{ textAlign: 'center' }}>
                                                    {p.in_stock ? (
                                                        <div style={{
                                                            width: '12px', height: '12px', borderRadius: '50%', background: '#10B981',
                                                            boxShadow: '0 0 10px rgba(16,185,129,0.5)', margin: '0 auto'
                                                        }} title="В наличии" />
                                                    ) : (
                                                        <div style={{
                                                            width: '12px', height: '12px', borderRadius: '50%', background: '#EF4444',
                                                            margin: '0 auto', opacity: 0.5
                                                        }} title="Нет в наличии" />
                                                    )}
                                                </td>

                                                {/* STATUS COLUMNS */}
                                                <td style={{ minWidth: '180px' }}>
                                                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                                        <StatusIcon label="MC" active={p.ms_created} icon="📦" />
                                                        <StatusIcon label="Склад" active={p.stock_added} icon="🏭" />
                                                        <StatusIcon label="Kaspi" active={p.kaspi_created} icon="💳" />
                                                    </div>
                                                    {p.conveyor_status && p.conveyor_status !== 'idle' && (
                                                        <div
                                                            style={{ fontSize: '0.75rem', marginTop: '0.5rem', textAlign: 'center', color: p.conveyor_status === 'error' ? '#EF4444' : '#10B981', cursor: p.conveyor_status === 'error' ? 'help' : 'default' }}
                                                            title={p.conveyor_status === 'error' ? (p.conveyor_log || 'Unknown Error') : ''}
                                                        >
                                                            {p.conveyor_status === 'processing' ? 'В работе...' : (p.conveyor_status === 'error' ? 'Ошибка (см. лог)' : p.conveyor_status)}
                                                        </div>
                                                    )}
                                                </td>

                                                <td>
                                                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                        <button onClick={() => handleCreateInMS(p)} className="mini-btn">МС</button>
                                                        <button onClick={() => handleOprihodovanie(p)} className="mini-btn">Склад</button>
                                                        <button onClick={() => handleCreateKaspi(p)} className="mini-btn">Kaspi</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}


                {/* IMAGE MODAL */}
                <AnimatePresence>
                    {selectedImage && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSelectedImage(null)}
                            style={{
                                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 9999,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem'
                            }}
                        >
                            <img
                                src={selectedImage}
                                style={{ maxHeight: '90vh', maxWidth: '90vw', borderRadius: '12px', boxShadow: '0 0 50px rgba(0,0,0,0.5)' }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>


                {/* AI CHAT WIDGET */}
                <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 5000 }}>
                    <AnimatePresence>
                        {isChatOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                                style={{
                                    width: '450px', height: '600px', background: 'rgba(10, 15, 30, 0.95)',
                                    marginBottom: '1rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)',
                                    backdropFilter: 'blur(20px)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                                    display: 'flex', flexDirection: 'column', overflow: 'hidden'
                                }}
                            >
                                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontWeight: '600' }}>AI Помощник</span>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        {/* QUICK TOGGLE BUTTONS */}
                                        <button
                                            onClick={toggleConveyor}
                                            disabled={toggleLoading}
                                            style={{
                                                padding: '2px 10px',
                                                borderRadius: '6px',
                                                background: isConveyorRunning ? '#f59e0b' : '#10b981',
                                                border: 'none',
                                                color: 'white',
                                                fontSize: '0.7rem',
                                                fontWeight: 'bold',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {isConveyorRunning ? 'ОСТАНОВИТЬ ПАРСЕР' : 'ЗАПУСТИТЬ ПАРСЕР'}
                                        </button>
                                        <button onClick={() => setIsChatOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>✕</button>
                                    </div>
                                </div>
                                <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    {chatHistory.map((msg, i) => (
                                        <div key={i} style={{
                                            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                            padding: '0.8rem', borderRadius: '12px', maxWidth: '85%', fontSize: '0.9rem',
                                            background: msg.role === 'user' ? 'var(--velveto-accent-primary)' : 'rgba(255,255,255,0.05)'
                                        }}>
                                            {msg.content}
                                        </div>
                                    ))}
                                    {aiLoading && <div style={{ opacity: 0.5, fontSize: '0.8rem' }}>Печатает...</div>}
                                    <div ref={chatEndRef}></div>
                                </div>
                                <form onSubmit={handleChatSubmit} style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    <input
                                        type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                                        placeholder="Спросите AI..."
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                                    />
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <button
                        onClick={() => setIsChatOpen(!isChatOpen)}
                        style={{
                            width: '60px', height: '60px', borderRadius: '50%', background: 'var(--velveto-accent-primary)',
                            border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                    >
                        {isChatOpen ? '✕' : '💬'}
                    </button>
                </div>


                {/* MODALS (Simplified for brevity but functional) */}
                {toast && <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', padding: '1rem 2rem', background: '#333', color: 'white', borderRadius: '8px', zIndex: 9999 }}>{toast.message}</div>}

                {
                    showOprihodovanieModal && (
                        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000 }}>
                            <div style={{ background: '#1a1a1a', padding: '2rem', borderRadius: '16px', minWidth: '300px' }}>
                                <h3>Оприходование: {selectedProductForOprihodovanie?.brand}</h3>
                                <input type="number" value={oprihodovanieQuantity} onChange={e => setOprihodovanieQuantity(e.target.value)} style={{ width: '100%', padding: '0.5rem', margin: '1rem 0' }} />
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button onClick={confirmOprihodovanie} className="velveto-button">Подтвердить</button>
                                    <button onClick={() => setShowOprihodovanieModal(false)} className="velveto-button-outline">Отмена</button>
                                </div>
                            </div>
                        </div>
                    )
                }

            </main >

            <style jsx>{`
                .mini-btn { padding: 0.4rem 0.8rem; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: #ddd; cursor: pointer; font-size: 0.75rem; }
                .mini-btn:hover { background: rgba(255,255,255,0.1); }
            `}</style>
        </div >
    );
}

// Sub-components
function FilterBtn({ label, active, onClick, color }) {
    return (
        <button onClick={onClick} style={{
            padding: '0.6rem 1.2rem', borderRadius: '10px',
            background: active ? (color || 'var(--velveto-accent-primary)') : 'rgba(255,255,255,0.05)',
            color: active ? 'white' : 'var(--velveto-text-primary)', border: 'none', cursor: 'pointer', fontWeight: '600'
        }}>{label}</button>
    )
}

function StatusIcon({ label, active, icon }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', opacity: active ? 1 : 0.3 }}>
            <div style={{ fontSize: '1.2rem' }}>{active ? '✅' : icon}</div>
            <div style={{ fontSize: '0.6rem', textTransform: 'uppercase' }}>{label}</div>
        </div>
    )
}

function parsedColor(isActive) {
    return isActive ? 'var(--velveto-accent-primary)' : 'inherit';
}
