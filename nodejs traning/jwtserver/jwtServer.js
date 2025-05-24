import http from 'http';
import { readFile, writeFile } from 'fs/promises';
import jwt from 'jsonwebtoken';

const USERS_FILE = './users.json';
const SECRET = 'my_super_secret_key'; // for JWT signing

// Read users from file
async function readUsers() {
  try {
    const data = await readFile(USERS_FILE, 'utf-8');
    return JSON.parse(data || '[]');
  } catch {
    return [];
  }
}

// Save users to file
async function saveUsers(users) {
  await writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

const server = http.createServer(async (req, res) => {
  const { url, method, headers } = req;

  // 🧾 REGISTER
  if (url === '/register' && method === 'POST') {
    let body = '';
    req.on('data', chunk => (body += chunk.toString()));
    req.on('end', async () => {
      const { username, password } = JSON.parse(body);
      const users = await readUsers();

      if (users.find(u => u.username === username)) {
        res.writeHead(409, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'User already exists' }));
      }

      users.push({ username, password });
        const token = jwt.sign({ username }, SECRET, { expiresIn: '1h' });
      await saveUsers(users);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'User registered',token:token }));
    });
  }

  if(url === '/profile' && method === 'GET'){
    const auth = headers['authorization'];
    if(!auth || !auth.startsWith('Bearer ')){
        res.writeHead(401,{'content-type':'application/json'});
        return res.end(JSON.stringify({error:'No token'}));
    }

    const token = auth.split(' ')[1]

    try{
        const decode = jwt.verify(token,SECRET);
        console.log(token)
        console.log(SECRET)
        console.log(decode)
        res.writeHead(200,{'content-type':'application/json'});
        res.end(JSON.stringify({message:'Access granted',user:decode.username}))
    }catch(err){
        res.writeHead(403,{'content-type':'application/json'});
        return res.end(JSON.stringify({error:'INvalid token'}))

    }
  }

  if(url === '/login' && method === 'POST'){
    let body = '';
    req.on('data',chunk => (body += chunk.toString()))

    req.on('end',async() => {
        const {username,password} = JSON.parse(body)
        const users = await readUsers();
        const user = users.find(u => u.username === username && u.password == password)
        if(!user) {
            res.writeHead(401,{
                'content-type':'application/json'
            })
            return res.end(JSON.stringify({err:'login failed'}));
        }

        const token = jwt.sign({username},SECRET,{expiresIn:'1h'});

        res.writeHead(200,{'content-type':'application/json'})
        res.end(JSON.stringify({message:'login success',token}));
    })
  }
})

server.listen(3010,()=>{
    console.log('server is running http://localhost:3010')
})