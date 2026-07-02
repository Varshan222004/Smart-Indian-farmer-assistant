import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import './i18n';
import { registerServiceWorker } from './utils/registerSW';
import notificationManager from './utils/notifications';

// Register service worker for PWA
registerServiceWorker();

// Initialize notification manager
notificationManager.init().then(() => {
  console.log('Notification manager initialized');
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

