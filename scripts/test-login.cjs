const https = require('http');
const data = JSON.stringify({ email: 'admin@test.com', password: 'admin123' });
const req = https.request({ hostname: 'localhost', port: 3000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }}, (res) => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => console.log(res.statusCode, body));
});
req.write(data);
req.end();
