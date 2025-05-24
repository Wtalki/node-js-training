import http from 'http';
import { readFile, writeFile } from 'fs/promises';
import crypto from 'crypto';

const USERS_FILE = './users.json';
const TOKENS = {}; // In-memory token store

async function readUsers() {
  try {
    const data = await readFile(USERS_FILE, 'utf-8');
    return JSON.parse(data || '[]');
  } catch {
    return [];
  }
}

const server = http.createServer(async (req, res) => {
  const { url, method, headers } = req;

  // 1️⃣ LOGIN ROUTE
  if (url === '/login' && method === 'POST') {
    let body = '';
    req.on('data', chunk => (body += chunk.toString()));
    req.on('end', async () => {
      const { username, password } = JSON.parse(body);
      const users = await readUsers();

      const user = users.find(u => u.username === username && u.password === password);
      if (!user) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Login failed' }));
      }

      const token = crypto.randomBytes(16).toString('hex');
      TOKENS[token] = username;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Login success', token }));
    });
  }

  if (url == '/profile' && method === "GET") {
    const authHeader = headers['authorization'];
  
    if (!authHeader || !authHeader.startsWith('Bearer')) {
      res.writeHead(401, {
        'Content-Type': 'application/json'
      });
      return res.end(JSON.stringify({ error: "Unauthorized" }));
    }
  
    const token = authHeader.split(' ')[1];
    const username = TOKENS[token];
  
    if (!username) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: "Forbidden" }));
    }
  
    // ✅ Valid token
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ message: 'Welcome', user: username }));
  }

})

server.listen(3010,()=>{
    console.log('server is running http://localhost:3010')
})