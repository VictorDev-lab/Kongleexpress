import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Header-komponenten for nettstedet.
 * Inneholder logo/tittel og navigasjonslenker.
 */
const Header: React.FC = () => {
  return (
    <header className="bg-[#1abc9c] text-white py-6 shadow-md">
      <div className="container mx-auto px-4">
        {/* Tittel/logo for Kongle Express */}
        <h1 className="text-4xl font-semibold mb-4">Kongle Express 🌲</h1>
        {/* Navigasjonslenker */}
        <nav className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link to="/" className="text-white text-lg font-semibold hover:opacity-80 transition-opacity">Home</Link>
          <Link to="/order" className="text-white text-lg font-semibold hover:opacity-80 transition-opacity">Order</Link>
          <Link to="/subscribe" className="text-white text-lg font-semibold hover:opacity-80 transition-opacity">Subscribe</Link>
          <Link to="/about" className="text-white text-lg font-semibold hover:opacity-80 transition-opacity">About</Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;