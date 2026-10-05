import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import InstallPrompt from './pwa/InstallPrompt';
import { registerServiceWorker } from './pwa/registerServiceWorker';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
    <InstallPrompt />
  </React.StrictMode>
);

registerServiceWorker();
