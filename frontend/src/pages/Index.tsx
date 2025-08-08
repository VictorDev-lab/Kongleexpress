import React from 'react';
import { Link } from 'react-router-dom';

/**
 * IndexPage-komponenten er hjemmesiden for Kongle Express.
 * Den presenterer konseptet og gir lenker til bestilling og abonnement.
 */
const IndexPage: React.FC = () => {
  return (
    <div className="text-center py-8 px-4">
      {/* Hovedtittel */}
      <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-800 mb-6 leading-tight">Pinecone with a Punch</h2>
      {/* Beskrivelse */}
      <p className="text-lg sm:text-xl text-gray-600 mb-4 max-w-2xl mx-auto">Send a pinecone with a handwritten note to your friend, boss, or worst enemy.</p>
      {/* Prisinformasjon */}
      <p className="text-xl sm:text-2xl font-bold text-gray-700 mb-8">Only $20 for a dose of passive-aggression.</p>
      {/* Abonnementsoppfordring */}
      <p className="text-2xl sm:text-3xl font-extrabold text-[#1abc9c] mb-10">Subscribe to send monthly insults via pinecone.</p>

      {/* Handlingsknapper for bestilling og abonnement */}
      <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
        <Link 
          to="/order" 
          className="bg-[#1abc9c] text-white px-8 py-4 rounded-xl text-xl font-bold hover:bg-[#16a085] transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          Order a One-Time Kongle
        </Link>
        <Link 
          to="/subscribe" 
          className="bg-gray-700 text-white px-8 py-4 rounded-xl text-xl font-bold hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          Subscribe for Monthly Deliveries
        </Link>
      </div>
      {/* Lenke til "Om oss"-siden */}
      <p className="mt-10 text-lg text-gray-600">Learn more about us <Link to="/about" className="text-[#1abc9c] hover:underline font-semibold">here</Link>.</p>
    </div>
  );
};

export default IndexPage;