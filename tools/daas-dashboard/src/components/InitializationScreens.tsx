// Loading component to show while SDK initializes
export function LoadingScreen({ message }: { message: string }) {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            backgroundColor: '#f9fafb'
        }}>
            <div style={{ marginBottom: '1rem', fontSize: '2rem' }}>⏳</div>
            <div style={{ fontSize: '1.25rem', color: '#374151' }}>{message}</div>
        </div>
    );
}

// Error component to show if SDK fails
export function ErrorScreen({ error }: { error: string }) {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            backgroundColor: '#f9fafb',
            padding: '2rem'
        }}>
            <div style={{ marginBottom: '1rem', fontSize: '3rem' }}>⚠️</div>
            <div style={{ fontSize: '1.5rem', color: '#dc2626', marginBottom: '1rem' }}>
                Failed to Initialize
            </div>
            <div style={{ fontSize: '1rem', color: '#6b7280', maxWidth: '600px', textAlign: 'center' }}>
                {error}
            </div>
            <div style={{ marginTop: '2rem', fontSize: '0.875rem', color: '#9ca3af' }}>
                Check the browser console for more details
            </div>
        </div>
    );
}

