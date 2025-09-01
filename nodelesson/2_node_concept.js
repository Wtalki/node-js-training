
// // 1️⃣ Single-threaded & Non-blocking I/O
// // ✅ Node.js က single-threaded ဖြစ်ပေမယ့် non-blocking (asynchronous) ဖြစ်တယ်။
// // ✅ ဒါကြောင့် requests တွေကို concurrently handle လုပ်နိုင်တယ်။

// const fs = require('fs');
// fs.readFile('data.txt',(err,data) => {
//     if(err) throw err;
//     console.log(data.toString())

// })

// console.log('reading data...')


// const myModule = require('./myModule.js');
// // console.log(myModule('hello'))

// console.log(myModule.add(1,3))
// console.log(myModule.multiply(2,2))



const http = require('http');

// fs.readFile('example.txt','utf8',(err,data) => {
//     if(err) {
//         console.error('error readning file ',err);
//         return;
//     }
//     console.log('file content:',data)
// })




// const server = http.createServer((req,res) => {
//     res.statusCode = 200;
//     res.setHeader('Content-Type','text/plain');
//     res.end('Hello, World\n');
// });

// server.listen(3010,() => {
//     console.log('serveri is running at http://localhost:3000/')
// })



// const fs= require('fs');
// fs.readFile('example.txt','utf8',(err,data) => {
//     if(err) throw err;
//     console.log('Async read:',data);
// })

// const data = fs.readFileSync('example.txt','utf8');
// console.log('sync read:',data)


// const fs = requrie('fs').promises;
// (async() => {
//     try{
//         const data = await fs.readFile('example.txt','utf8');
//         console.log('file data:',data);
//     }catch(err){
//         console.error('error reading file:',err.message)
//     }
// })



const path = require('path');
const filePath = path.join(__dirname,'folder','file.txt');
console.log('joined path:',filePath)

//extract file extension 
const ext = path.extname(filePath);
console.log('eXtentsion:',ext);