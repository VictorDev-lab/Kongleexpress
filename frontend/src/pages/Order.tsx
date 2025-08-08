import React, { useState } from 'react';
import { showSuccess, showError, showLoading, dismissToast } from '../lib/toast';

// Forhåndsdefinerte sitater basert på type
const quotes = {
  funny: [
    "Is your name Wi-Fi? Because I'm not feeling a connection.",
    "You're like a parking spot—sometimes you have to circle around to realize you're not wanted."
  ],
  sad: [
    "Even the pinecone feels heavier than my heart today.",
    "This pinecone will outlast our friendship."
  ],
  sarcastic: [
    "Wow, you must be so proud of yourself. Here's a pinecone.",
    "This pinecone has more personality than you do."
  ]
};

/**
 * OrderPage-komponenten lar brukere bestille en engangs-kongle.
 * Inneholder et skjema for avsender, mottaker, adresse, melding og valg av kongletype.
 * Integrert med Stripe for betaling.
 */
const OrderPage: React.FC = () => {
  // State for å håndtere skjemaets input-verdier
  const [formData, setFormData] = useState({
    sender: '',
    recipient: '',
    address: '',
    message: '',
    quoteType: '', // Type sitat brukeren ønsker å foreslå
    pineconeType: '', // Valgt kongletype
    isSubscription: false, // Om bestillingen skal være et abonnement (kan overstyres av /subscribe-siden)
  });

  /**
   * Håndterer endringer i skjema-inputfelt.
   * Oppdaterer formData-staten dynamisk.
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  /**
   * Foreslår et tilfeldig sitat basert på valgt sitat-type.
   * Viser suksess- eller feil-toast.
   */
  const handleSuggestQuote = () => {
    const type = formData.quoteType.toLowerCase();
    if (quotes[type as keyof typeof quotes]) {
      const randomQuote = quotes[type as keyof typeof quotes][Math.floor(Math.random() * quotes[type as keyof typeof quotes].length)];
      setFormData(prev => ({ ...prev, message: randomQuote }));
      showSuccess(`Suggested a ${type} quote!`);
    } else {
      showError('Please enter a valid quote style (funny, sad, sarcastic).');
    }
  };

  /**
   * Håndterer innsending av skjemaet.
   * Sender bestillingsdata til backend og initierer Stripe Checkout.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToastId = showLoading('Processing your order...'); // Viser lasting-toast

    // Validerer sitat-type før innsending
    const quoteType = formData.quoteType.toLowerCase();
    if (!['funny', 'sad', 'sarcastic'].includes(quoteType)) {
      dismissToast(loadingToastId);
      showError('Error: Quote style must be funny, sad, or sarcastic.');
      return;
    }

    // Priser for de forskjellige kongletypene (i cent for Stripe)
    const pineconePrices: { [key: string]: number } = {
      dusty: 1000, // $10.00
      classic: 2000, // $20.00
      deluxe: 3000, // $30.00
      ultra: 100000, // $1000.00
    };

    // Data som skal sendes til backend for å lagre bestillingen
    const dataToSend = {
      ...formData,
      pinecone: formData.pineconeType, // Bruker 'pinecone' som nøkkel for backend
      price: pineconePrices[formData.pineconeType] || 0, // Legger til pris basert på type
    };

    try {
      // Steg 1: Lagre bestillingen i databasen via backend API
      const saveRes = await fetch('/api/kongles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      if (!saveRes.ok) {
        const errorText = await saveRes.text();
        throw new Error('Failed to save order: ' + errorText);
      }

      // Steg 2: Start Stripe Checkout-prosessen
      const checkoutRes = await fetch('/api/kongles/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pineconeType: formData.pineconeType, subscription: formData.isSubscription }),
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
      <h2 className="text-3xl font-bold mb-6">Order a One-Time Kongle</h2>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg max-w-md mx-auto">
        {/* Skjema-inputfelt */}
        <input
          type="text"
          name="sender"
          placeholder="Your Name"
          value={formData.sender}
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
        <textarea
          name="message"
          placeholder="Funny Note"
          value={formData.message}
          onChange={handleChange}
          required
          className="w-full p-3 my-3 border border-gray-300 rounded-lg text-base resize-y min-h-[100px] focus:border-[#1abc9c] outline-none"
        ></textarea>
        {/* Knapp for å foreslå sitat */}
        <button
          type="button"
          onClick={handleSuggestQuote}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg text-base font-semibold hover:bg-gray-600 transition-colors duration-300 w-full my-3"
        >
          Suggest a Quote
        </button>
        <input
          type="text"
          name="quoteType"
          placeholder="Quote Style (funny/sad/sarcastic)"
          value={formData.quoteType}
          onChange={handleChange}
          required
          className="w-full p-3 my-3 border border-gray-300 rounded-lg text-base focus:border-[#1abc9c] outline-none"
        />
        {/* Dropdown for valg av kongletype */}
        <select
          name="pineconeType"
          value={formData.pineconeType}
          onChange={handleChange}
          required
          className="w-full p-3 my-3 border border-gray-300 rounded-lg text-base focus:border-[#1abc9c] outline-none"
        >
          <option value="">Choose Pinecone Type</option>
          <option value="dusty">Dusty ($10)</option>
          <option value="classic">Classic ($20)</option>
          <option value="deluxe">Deluxe ($30)</option>
          <option value="ultra">Ultra Deluxe ($1000)</option>
        </select>
        {/* Sjekkboks for abonnement (kan brukes for å konvertere engangsbestilling til abonnement) */}
        <div className="flex items-center justify-center my-4">
          <input
            type="checkbox"
            id="isSubscription"
            name="isSubscription"
            checked={formData.isSubscription}
            onChange={handleChange}
            className="mr-2 h-4 w-4 text-[#1abc9c] focus:ring-[#1abc9c] border-gray-300 rounded"
          />
          <label htmlFor="isSubscription" className="text-gray-700">
            Make this a Monthly Subscription
          </label>
        </div>
        {/* Innsendingsknapp */}
        <button
          type="submit"
          className="bg-[#1abc9c] text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-[#16a085] transition-colors duration-300 w-full my-3"
        >
          Pay and Send Kongle
        </button>
      </form>
    </div>
  );
};

export default OrderPage;