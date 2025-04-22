import http from 'http'
import { writeFile,appendFile } from 'fs'

const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/submit') {
      let body = '';
  
      req.on('data', chunk => {
        body += chunk.toString();
      });
  
      req.on('end', () => {
        let parsedData;
        try {
          parsedData = JSON.parse(body);
        } catch (err) {
          parsedData = { error: 'Invalid JSON format' };
        }
  
        const log = `\n[${new Date().toISOString()}] ${JSON.stringify(parsedData)}\n`;
  
        // 🔥 File ထဲသိမ်း
        appendFile('log.txt', log, err => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'File write failed' }));
            return;
          }
  
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            status: 'success',
            message: 'Data saved to log.txt',
            received: parsedData
          }));
        });
      });
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Route not found' }));
    }
  });
  
  server.listen(3010, () => {
    console.log('📁 Server running at http://localhost:3010');
  });
  