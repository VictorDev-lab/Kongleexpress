document.addEventListener('DOMContentLoaded', () => {
  const orderForm = document.getElementById('orderForm');
  const feedback = document.getElementById('feedback');
  const suggestQuoteBtn = document.getElementById('suggestQuote');
  const messageInput = orderForm.querySelector('textarea[name="message"]');
  const quoteTypeInput = orderForm.querySelector('input[name="quoteType"]');

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

  suggestQuoteBtn.addEventListener('click', () => {
    const type = quoteTypeInput.value.toLowerCase();
    if (quotes[type]) {
      const randomQuote = quotes[type][Math.floor(Math.random() * quotes[type].length)];
      messageInput.value = randomQuote;
      feedback.textContent = `Suggested a ${type} quote!`;
    } else {
      feedback.textContent = 'Please enter a valid quote style (funny, sad, sarcastic).';
    }
  });

  orderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    feedback.textContent = 'Processing your order...';

    const quoteType = quoteTypeInput.value.toLowerCase();
    if (!['funny', 'sad', 'sarcastic'].includes(quoteType)) {
      feedback.textContent = 'Error: Quote style must be funny, sad, or sarcastic.';
      return;
    }

    const formData = new FormData(orderForm);
    const data = Object.fromEntries(formData.entries());
    data.isSubscription = formData.get('isSubscription') === 'on';

    // Finn pris basert på valgt pinecone-type
    const pineconeSelect = document.getElementById('pineconeType');
    const selectedOption = pineconeSelect.options[pineconeSelect.selectedIndex];
    data.pinecone = data.pineconeType;
    data.amount = selectedOption.dataset.price ? Number(selectedOption.dataset.price) : 0;

    try {
      // Lagre ordre i DB
      const saveRes = await fetch('http://localhost:3000/api/kongles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!saveRes.ok) {
        const errorText = await saveRes.text();
        throw new Error('Failed to save order: ' + errorText);
      }

      // Start Stripe checkout (dummy URL)
      const checkoutRes = await fetch('http://localhost:3000/api/kongles/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pineconeType: data.pineconeType, subscription: data.isSubscription }),
      });

      const result = await checkoutRes.json();
      if (checkoutRes.ok && result.url) {
        window.location.href = result.url;
      } else {
        feedback.textContent = 'Stripe error: ' + (result.error || 'Unknown issue');
      }
    } catch (error) {
      feedback.textContent = 'Error: ' + error.message;
    }
  });
});
