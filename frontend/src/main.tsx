import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import ToastProvider from './components/ToastProvider.tsx';

// Hovedinngangspunktet for React-applikasjonen.
// Rendrer App-komponenten og ToastProvider i StrictMode for å fange potensielle problemer.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* ToastProvider må wrappe App for at toast-funksjonene skal være tilgjengelige */}
    <ToastProvider />
    <App />
  </React.StrictMode>,
);