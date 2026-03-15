import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './styles/theme.css'

import { registerServiceWorker } from './services/notificationService';

// Clean up any leftover theme classes from previous sessions
document.body.className = '';

// Register SW for PWA & Notifications
registerServiceWorker();

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
)
