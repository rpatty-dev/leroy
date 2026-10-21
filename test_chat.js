const http = require('http');

const payload = JSON.stringify({
  model: "LeroyObliterated",
  messages: [
    { role: "system", content: "You are Leroy 🐇, a friendly bunny and expert programmer. Answer tersely like smart caveman." },
    { role: "user", content: "Hop check! Say hello and confirm you are online and what your name is." }
  ],
  temperature: 0.3,
  max_tokens: 60
});

const req = http.request({
  hostname: '127.0.0.1',
  port: 8080,
  path: '/v1/chat/completions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    try {
      const parsed = JSON.parse(data);
      console.log('Leroy Reply:\n', parsed.choices[0].message.content);
    } catch(e) {
      console.log('Raw:', data);
    }
  });
});

req.on('error', e => console.error('Error:', e.message));
req.write(payload);
req.end();
