import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { DriverPortal } from '@/components/driver/DriverPortal';
import './index.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // SW registration is best-effort; ignore failures silently
    });
  });
}

const isDriverPortal = window.location.pathname.startsWith('/driver');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isDriverPortal ? <DriverPortal /> : <App />}
  </StrictMode>
);
