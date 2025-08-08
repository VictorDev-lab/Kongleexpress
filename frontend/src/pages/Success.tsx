import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { showError, showSuccess } from '../lib/toast'; // Import toast functions

/**
 * SuccessPage-komponenten vises etter en vellykket Stripe Checkout.
 * Den verifiserer betalingssesjonen med backend ved hjelp av session_id fra URL-en.
 */
const SuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams(); // Henter URL-parametre
  const sessionId = searchParams.get('session_id'); // Henter session_id fra URL
  const [message, setMessage] = useState('Verifying your payment...'); // Melding som vises til brukeren
  const [subscriptionInfo, setSubscriptionInfo] = useState(''); // Tilleggsinformasjon for abonnement
  const [isError, setIsError] = useState(false); // State for å indikere om det er en feil

  useEffect(() => {
    /**
     * Funksjon for å verifisere betalingen med backend.
     * Sender session_id til backend for å bekrefte transaksjonen.
     */
    const verifyPayment = async () => {
      if (!sessionId) {
        setMessage('Error: No session ID provided. Did you complete the payment?');
        setIsError(true);
        showError('Payment verification failed: No session ID.');
        return;
      }

      try {
        // Kaller backend API for å verifisere Stripe-sesjonen
        const response = await fetch(`/api/kongles/verify?session_id=${sessionId}`);
        const result = await response.json();

        if (response.ok && result.status === 'success') {
          // Vellykket verifisering
          setMessage('Thanks for your purchase/subscription!');
          setSubscriptionInfo(
            result.isSubscription
              ? 'Get ready for monthly passive-aggressive nature deliveries!'
              : `Your ${result.pineconeType} pinecone is on its way!`
          );
          setIsError(false);
          showSuccess('Payment successful!');
        } else {
          // Feil under verifisering
          setMessage('Error: Payment verification failed: ' + (result.error || 'Unknown issue'));
          setIsError(true);
          showError('Payment verification failed: ' + (result.error || 'Unknown issue'));
        }
      } catch (error: any) {
        // Nettverksfeil eller annen uventet feil
        setMessage('Error: Network error: ' + error.message);
        setIsError(true);
        showError('Network error: ' + error.message);
      }
    };

    verifyPayment(); // Kjører verifiseringen når komponenten lastes
  }, [sessionId]); // Kjører useEffect på nytt hvis sessionId endres

  return (
    <div className="text-center py-8 px-4">
      {/* Tittel basert på om betalingen var vellykket eller feilet */}
      <h2 className="text-4xl sm:text-5xl font-extrabold mb-8">{isError ? 'Payment Failed ❌' : 'Success! 🎉'}</h2>
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md mx-auto">
        {/* Melding til brukeren */}
        <p className={`text-lg sm:text-xl mb-4 ${isError ? 'text-red-600' : 'text-green-600'}`}>{message}</p>
        {/* Tilleggsinformasjon for abonnement/kongletype */}
        {subscriptionInfo && <p className="text-md sm:text-lg text-gray-700 mb-4">{subscriptionInfo}</p>}
        <p className="mt-6">
          {/* Lenke tilbake til hjemmesiden */}
          <Link to="/" className="text-[#1abc9c] hover:underline font-semibold text-lg">← Back to homepage</Link>
        </p>
      </div>
    </div>
  );
};

export default SuccessPage;