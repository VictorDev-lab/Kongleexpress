// Handle order form
document.addEventListener('DOMContentLoaded', () => {
    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
      orderForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(orderForm));
        const res = await fetch('http://localhost:3000/api/kongles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const result = await res.json();
        alert(res.ok ? '🔥 Kongle sent!' : '❌ Error: ' + result.error);
        orderForm.reset();
      });
    }
  
    const subForm = document.getElementById('subscribeForm');
    if (subForm) {
      subForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(subForm));
        const res = await fetch('http://localhost:3000/api/kongles/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const result = await res.json();
        alert(res.ok ? '📬 Subscribed!' : '❌ Error: ' + result.error);
        subForm.reset();
      });
    }
  });
  