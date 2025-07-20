document.addEventListener('DOMContentLoaded', () => {
  // Input sanitization to prevent XSS
  function sanitizeInput(input) {
      const div = document.createElement('div');
      div.textContent = input;
      return div.innerHTML;
  }

  // Show feedback with color coding
  function showFeedback(elementId, message, isError = false) {
      const feedback = document.getElementById(elementId);
      if (feedback) {
          feedback.textContent = message;
          feedback.style.color = isError ? '#d32f2f' : '#4e3e28';
      }
  }

  // Random quote generator for order form
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

  // Order form handling
  const orderForm = document.getElementById('orderForm');
  if (orderForm) {
      const feedback = document.getElementById('feedback');
      const suggestQuoteBtn = document.getElementById('suggestQuote');
      const messageInput = orderForm.querySelector('textarea[name="message"]');
      const quoteTypeInput = orderForm.querySelector('input[name="quoteType"]');

      // Suggest random quote
      if (suggestQuoteBtn) {
          suggestQuoteBtn.addEventListener('click', () => {
              const quoteType = sanitizeInput(quoteTypeInput.value.toLowerCase());
              if (quotes[quoteType]) {
                  const randomQuote = quotes[quoteType][Math.floor(Math.random() * quotes[quoteType].length)];
                  messageInput.value = randomQuote;
                  showFeedback('feedback', `Suggested a ${quoteType} quote!`);
              } else {
                  showFeedback('feedback', 'Please enter a valid quote style (funny, sad, sarcastic).', true);
              }
          });
      }

      // Fix typo and add async keyword here:
      orderForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          showFeedback('feedback', 'Processing your order...');

          // Validate quoteType
          const quoteType = sanitizeInput(quoteTypeInput.value.toLowerCase());
          if (!['funny', 'sad', 'sarcastic'].includes(quoteType)) {
              showFeedback('feedback', 'Error: Quote style must be funny, sad, or sarcastic.', true);
              return;
          }

          const formData = new FormData(orderForm);
          const data = Object.fromEntries(formData.entries());
          data.isSubscription = formData.get('isSubscription') === 'on';
          data.sender = sanitizeInput(data.sender);
          data.recipient = sanitizeInput(data.recipient);
          data.address = sanitizeInput(data.address);
          data.message = sanitizeInput(data.message);
          data.quoteType = quoteType;

          try {
              // Step 1: Save order to DB
              const saveRes = await fetch('http://localhost:3000/api/kongles', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(data),
              });

              if (!saveRes.ok) {
                  throw new Error('Failed to save order: ' + (await saveRes.text()));
              }

              // Step 2: Redirect to Stripe checkout
              // Note: You reference data.pineconeType here, make sure your form has this field!
              const checkoutRes = await fetch('http://localhost:3000/api/kongles/checkout', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ pineconeType: data.pineconeType, subscription: data.isSubscription }),
              });

              const result = await checkoutRes.json();
              if (checkoutRes.ok) {
                  window.location.href = result.url;
              } else {
                  showFeedback('feedback', 'Stripe error: ' + (result.error || 'Unknown issue'), true);
              }
          } catch (error) {
              showFeedback('feedback', 'Error: ' + error.message, true);
          }
      });
  }

  // Subscription form handling
  const subscribeForm = document.getElementById('subscribeForm');
  if (subscribeForm) {
      subscribeForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          showFeedback('feedback', 'Processing your subscription...');

          const formData = new FormData(subscribeForm);
          const data = Object.fromEntries(formData.entries());
          data.email = sanitizeInput(data.email);
          data.recipient = sanitizeInput(data.recipient);
          data.address = sanitizeInput(data.address);

          try {
              // Step 1: Save subscription to DB
              const saveRes = await fetch('http://localhost:3000/api/subscriptions', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(data),
              });

              if (!saveRes.ok) {
                  throw new Error('Failed to save subscription: ' + (await saveRes.text()));
              }

              // Step 2: Redirect to Stripe checkout
              const checkoutRes = await fetch('http://localhost:3000/api/subscriptions/checkout', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: data.email }),
              });

              const result = await checkoutRes.json();
              if (checkoutRes.ok) {
                  window.location.href = result.url;
              } else {
                  showFeedback('feedback', 'Stripe error: ' + (result.error || 'Unknown issue'), true);
              }
          } catch (error) {
              showFeedback('feedback', 'Error: ' + error.message, true);
          }
      });
  }
});
