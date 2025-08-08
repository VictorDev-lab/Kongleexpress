import React, { useState } from 'react';
import { showError, showLoading, dismissToast } from '../lib/toast';

/**
 * SubscribePage-komponenten lar brukere abonnere på månedlige kongle-leveranser.
 * Inneholder et skjema for e-post, mottaker og adresse.
 * Integrert med Stripe for abonnement.
 */
const SubscribePage: React.FC = () => {
  // State for å håndtere skjemaets input-verdier
  const [formData, setFormData] = useState({
    email: '',
    recipient: '',
    address: '',
  });

  /**
   * Håndterer endringer i skjema-inputfelt.
   * Oppdaterer formData-staten dynamisk.
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  /**
   * Håndterer innsending av skjemaet.
   * Sender abonnementsdata til backend og initierer Stripe Checkout for abonnement.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToastId = showLoading('Processing your subscription...'); // Viser lasting-toast

    try {
      // Steg 1: Lagre abonnementet i databasen via backend API
      const saveRes = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!saveRes.ok) {
        throw new Error('Failed to save subscription: ' + (await saveRes.text()));
      }

      // Steg 2: Start Stripe Checkout-prosessen for abonnement
      // Sender med 'classic' som standard kongletype for abonnement
      const checkoutRes = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, subscription: true, pineconeType: 'classic' }),
      });

      const result = await checkoutRes.json();
      if (checkoutRes.ok && result.url) {
        dismissToast(loadingToastId); // Lukker lasting-toast
        window.location.href = result.url; // Omdirigerer til Stripe Checkout-side
      } else {
        dismissToast(loadingToastId);
        showError('Stripe error: ' + (result.error || 'Unknown issue'));
      }
    } catch (error: any) {
      dismissToast(loadingToastId);
      showError('Error: ' + error.message);
    }
  };

  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold mb-6">Monthly Kongle Subscription</h2>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg max-w-md mx-auto">
        {/* Skjema-inputfelt */}
        <input
          type="email"
          name="email"
          placeholder="Your Email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full p-3 my-3 border border-gray-300 rounded-lg text-base focus:border-[#1abc9c] outline-none"
        />
        <input
          type="text"
          name="recipient"
          placeholder="Recipient Name"
          value={formData.recipient}
          onChange={handleChange}
          required
          className="w-full p-3 my-3 border border-gray-300 rounded-lg text-base focus:border-[#1abc9c] outline-none"
        />
        <textarea
          name="address"
          placeholder="Recipient Address"
          value={formData.address}
          onChange={handleChange}
          required
          className="w-full p-3 my-3 border border-gray-300 rounded-lg text-base resize-y min-h-[100px] focus:border-[#1abc9c] outline-none"
        ></textarea>
        {/* Innsendingsknapp */}
        <button
          type="submit"
          className="bg-[#1abc9c] text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-[#16a085] transition-colors duration-300 w-full my-3"
        >
          Subscribe
        </button>
      </form>
    </div>
  );
};

export default SubscribePage;