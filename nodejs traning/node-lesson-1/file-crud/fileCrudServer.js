import http from 'http';
import { URL } from 'url';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';

const DATA_FILE = './users.json';

// 🌟 Helper: Read users from file
async function readUsers() {
  if (!existsSync(DATA_FILE)) return [];
  const data = await readFile(DATA_FILE, 'utf-8');
  return JSON.parse(data || '[]');
}

// 🌟 Helper: Save users to file
async function saveUsers(users) {
  await writeFile(DATA_FILE, JSON.stringify(users, null, 2));
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const path = parsedUrl.pathname;
  const method = req.method;

  // GET /users
  if (path === '/users' && method === 'GET') {
    const users = await readUsers();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(users));
  }

  // POST /users
  else if (path === '/users' && method === 'POST') {
    let body = '';
    req.on('data', chunk => (body += chunk.toString()));
    req.on('end', async () => {
      const newUser = JSON.parse(body);
      const users = await readUsers();
      newUser.id = users.length + 1;
      users.push(newUser);
      await saveUsers(users);

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'User added', user: newUser }));
    });
  }

  // PUT /users/:id
  else if (path.startsWith('/users/') && method === 'PUT') {
    const id = parseInt(path.split('/')[2]);
    let body = '';
    req.on('data', chunk => (body += chunk.toString()));
    req.on('end', async () => {
      const updatedData = JSON.parse(body);
      let users = await readUsers();
      users = users.map(u => (u.id === id ? { ...u, ...updatedData } : u));
      await saveUsers(users);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'User updated' }));
    });
  }

  // DELETE /users/:id
  else if (path.startsWith('/users/') && method === 'DELETE') {
    const id = parseInt(path.split('/')[2]);
    let users = await readUsers();
    users = users.filter(u => u.id !== id);
    await saveUsers(users);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'User deleted' }));
  }

  // 404 Not Found
  else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Route not found' }));
  }
});

server.listen(3010, () => {
  console.log('🚀 File-based CRUD server is running on http://localhost:3010');
});
