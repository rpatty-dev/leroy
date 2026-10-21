const http = require('http');

const t0 = Date.now();
const payload = JSON.stringify({
  model: "LeroyObliterated",
  messages: [
    { role: "system", content: "You are Leroy 🐇. Reply concisely." },
    { role: "user", content: "hi" }
  ],
  temperature: 0.2,
  max_tokens: 30
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
}, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const dur = ((Date.now() - t0) / 1000).toFixed(2);
    const parsed = JSON.parse(data);
    console.log(`[${dur}s] Reply:`, parsed.choices[0].message.content.trim());
  });
});

req.write(payload);
req.end();
