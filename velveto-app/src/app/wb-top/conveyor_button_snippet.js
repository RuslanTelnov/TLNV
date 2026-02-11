<button
    onClick={toggleConveyor}
    disabled={toggleLoading}
    style={{
        padding: '0.8rem 1.5rem',
        borderRadius: '12px',
        background: isConveyorRunning
            ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
            : 'rgba(255,255,255,0.05)',
        color: isConveyorRunning ? 'white' : 'var(--velveto-text-muted)',
        border: isConveyorRunning ? 'none' : '1px solid rgba(255,255,255,0.1)',
        cursor: 'pointer',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '0.8rem',
        boxShadow: isConveyorRunning ? '0 0 20px rgba(16, 185, 129, 0.4)' : 'none',
        transition: 'all 0.3s ease'
    }}
>
    <div style={{
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        background: isConveyorRunning ? 'white' : '#EF4444',
        boxShadow: isConveyorRunning ? '0 0 10px white' : 'none'
    }} />
    {isConveyorRunning ? 'КОНВЕЙЕР АКТИВЕН' : 'ЗАПУСТИТЬ КОНВЕЙЕР'}
</button>
