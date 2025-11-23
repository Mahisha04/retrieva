(async () => {
  const variants = [
    'ganesh',
    'Ganesh',
    ' ganesh',
    'ganesh ',
    'Ganesh ',
    'GANESH',
    'ganesh\n',
    'keychain',
    'keychain of the key',
    'keychain of the key ',
    'keychainofthekey',
    'ganesh123',
  ];

  for (const v of variants) {
    try {
      const res = await fetch('http://localhost:5000/verify-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 12, answer: v }),
      });
      let body;
      try { body = await res.json(); } catch (e) { body = await res.text(); }
      console.log('VARIANT:', JSON.stringify(v), '->', res.status, body);
    } catch (e) {
      console.error('ERROR for variant', JSON.stringify(v), e && e.message ? e.message : e);
    }
  }
})();
