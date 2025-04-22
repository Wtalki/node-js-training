import http from 'http'
import { URL } from 'url'


let users = [
    {id:1,name:'Aung Aung'},
    {id:2,name:'Aung thu'}
]

const server = http.createServer((req,res) => {
    const parsedUrl = new URL (req.url,`http://${req.headers.host}`)
    const path = parsedUrl.pathname
    const method = req.method;
    console.log(path)
    console.log(method)

    // get users 
    if (path === '/users' && method === 'GET'){
        res.writeHead(200,{'content-type':'application/json'});
        res.end(JSON.stringify(users))
    }

    // ========== ➕ POST /users ==========
  else if (path === '/users' && method === 'POST') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString(); // data chunk ကို string ပြောင်း
    });

    req.on('end', () => {
      const newUser = JSON.parse(body);      // JSON ကို object ပြောင်း
      newUser.id = users.length + 1;         // ID တစ်ခုမြှင့်
      users.push(newUser);                   // Array ထဲထည့်

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        message: 'အသစ်ထည့်ပြီးပါပြီ။',
        user: newUser
      }));
    });
  }

  else if(path.startsWith('/users/') && method === 'PUT'){
    const id = parseInt(path.split('/')[2]);
    let body = '';

    req.on('data',chunk =>{
        body += chunk.toString();
    })

    req.on('end',() => {
        const updatedData = JSON.parse(body);

        users = users.map(user => 
            user.id === id ? {...user,...updatedData} :user  
        )

        res.writeHead(200,{'Content-Type':'application/json'});
        res.end(JSON.stringify({message:'fixed'}));
    })
  }

  else if (path.startsWith('/users/') && method === 'DELETE'){
    const id = parseInt(path.split('/')[2]);

    users = users.filter(user => user.id !== id);
    res.writeHead(200, {'content-type':'application/json'})
    res.end(JSON.stringify({message:'delete success'}))
}
})

server.listen(3010, () => {
    console.log('🚀 Server is running at http://localhost:3010');
  });