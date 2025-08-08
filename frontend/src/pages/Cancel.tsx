import React from 'react';
import { Link } from 'react-router-dom';

/**
 * CancelPage-komponenten vises når en Stripe Checkout-sesjon blir avbrutt.
 * Informerer brukeren om at betalingen ble kansellert.
 */
const CancelPage: React.FC = () => {
  return (
    <div className="text-center py-8 px-4">
      {/* Tittel for siden */}
      <h2 className="text-4xl sm:text-5xl font-extrabold mb-8">Payment Cancelled ❌</h2>
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md mx-auto">
        {/* Melding til brukeren */}
        <p className="text-lg sm:text-xl text-gray-700 mb-4">No worries — the pinecone won't judge you. Come back anytime if you change your mind.</p>
        <p className="mt-6">
          {/* Lenke tilbake til hjemmesiden */}
          <Link to="/" className="text-[#1abc9c] hover:underline font-semibold text-lg">← Back to homepage</Link>
        </p>
      </div>
    </div>
  );
};

export default CancelPage;