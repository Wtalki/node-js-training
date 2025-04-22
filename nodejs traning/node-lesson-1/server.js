import http from 'http';


// Create a basic HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello, this is a Node.js server!');
});

// Start server on port 3000
server.listen(3001, () => {
  console.log('Server is running at http://localhost:3001');
});
