(async () => {
  try {
    const res = await fetch('http://localhost:5000/verify-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 12, answer: 'ganesh' }),
    });
    let body;
    try { body = await res.json(); } catch (e) { body = await res.text(); }
    console.log('HTTP', res.status);
    console.log('RESPONSE', body);
  } catch (e) {
    console.error('ERROR', e && e.message ? e.message : e);
  }
})();
