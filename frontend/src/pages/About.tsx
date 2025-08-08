import React from 'react';

/**
 * AboutPage-komponenten gir informasjon om Kongle Express.
 * Forteller historien bak tjenesten og dens grunnlegger.
 */
const AboutPage: React.FC = () => {
  return (
    <div className="text-center py-8 px-4">
      {/* Tittel for siden */}
      <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-800 mb-8 leading-tight">About the Pine Madness</h2>
      {/* Tekst om Kongle Express */}
      <div className="max-w-2xl mx-auto text-lg sm:text-xl text-gray-700 space-y-6">
        <p>Kongle is a brutally honest pinecone service founded by Victor — an unstoppable developer/farmer hybrid.</p>
        <p>He writes each pinecone note by hand (with the handwriting of a caffeinated raccoon), packages it, and sends it to the unsuspecting victim. Or friend. Or boss. Or mom.</p>
        <p className="font-semibold text-gray-800">Perfect for Christmas, pranks, or existential breakdowns.</p>
      </div>
    </div>
  );
};

export default AboutPage;