import React from 'react'

function App() {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            background: '#0a0a0f',
            color: 'white',
            fontFamily: 'system-ui'
        }}>
            <div style={{ textAlign: 'center' }}>
                <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅ VIVO</h1>
                <p>La app está funcionando correctamente</p>
                <p style={{ marginTop: '2rem', fontSize: '0.875rem', opacity: 0.6 }}>
                    Si ves esto, Vite y React están OK
                </p>
            </div>
        </div>
    )
}

export default App
