// postServer.js
import http from 'http'; // သင် Node.js version 22+ သုံးနေတော့ ES Module သုံးလိုက်တယ်

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/submit') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString(); // string format ပြောင်းတယ်
    });

    req.on('end', () => {
      let parsedData;
      try {
        parsedData = JSON.parse(body); // JSON ဖြစ်ရင် parse
      } catch (err) {
        parsedData = { error: 'Invalid JSON format' };
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });

      // ✅ stringify before sending
      res.end(JSON.stringify({
        status: 'success',
        received: parsedData
      }));
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Route not found' }));
  }
});

server.listen(3010, () => {
  console.log('✅ Server is running http://localhost:3010');
});
