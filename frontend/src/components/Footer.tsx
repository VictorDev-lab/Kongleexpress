import React from 'react';

/**
 * Footer-komponenten for nettstedet.
 * Inneholder copyright-informasjon.
 */
const Footer: React.FC = () => {
  return (
    <footer className="mt-12 py-4 bg-[#ecf0f1] text-[#7f8c8d] text-sm">
      <div className="container mx-auto px-4">
        {/* Copyright-tekst */}
        © 2025 Kongle Inc. All rights thrown out the window.
      </div>
    </footer>
  );
};

export default Footer;