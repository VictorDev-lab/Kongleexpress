"use client";

import React from 'react';
import { Toaster } from 'react-hot-toast';

/**
 * ToastProvider-komponenten.
 * Wrapper applikasjonen for å gi tilgang til toast-varsler globalt.
 * Konfigurerer utseendet og oppførselen til toastene.
 */
const ToastProvider: React.FC = () => {
  return (
    <Toaster
      position="top-center" // Plassering av toastene på skjermen
      reverseOrder={false} // Nyeste toast vises nederst hvis flere er aktive
      gutter={8} // Avstand mellom flere toast
      toastOptions={{
        duration: 3000, // Standard varighet for toast (3 sekunder)
        style: {
          background: '#363636', // Bakgrunnsfarge for toast
          color: '#fff', // Tekstfarge for toast
        },
        success: {
          iconTheme: {
            primary: '#1abc9c', // Farge for suksess-ikon
            secondary: '#fff', // Sekundærfarge for suksess-ikon
          },
        },
        error: {
          iconTheme: {
            primary: '#e74c3c', // Farge for feil-ikon
            secondary: '#fff', // Sekundærfarge for feil-ikon
          },
        },
      }}
    />
  );
};

export default ToastProvider;