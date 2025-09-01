const fs = require('fs');

// fs.readFile('/path/to/file.txt', 'utf8', (err, data) => {
//   if (err) {
//     console.error('Error Code:', err.code);
//     console.error('Error Message:', err.message);
//     return;
//   }
//   console.log(data);
// });

// Code	Meaning
// ENOENT	No such file or directory
// EACCES	Permission denied
// ECONNREFUSED	Connection refused
// EADDRINUSE	Address already in use
// ECONNRESET	Connection reset
// ENOTFOUND	DNS lookup failed


//server error handling 
// const http = require('http');
// const server =http.createServer((req,res) => {
//     res.end('hello world')
// })
// server.listen(3100)

// server.on('error',(err) => {
//     if(err.code === 'EADDRINUSE'){
//         console.error('Port already in use');
//     }else{
//         console.error('server error:',err);

//     }
//     process.exit(1);
// })

// try{
//     fs.readFileSync('/path/to/file.txt');
    
// }catch(err){
//     if(err.code === 'ENOENT'){
//         console.error(('file not found.'))
//     }else{
//         console.error('error reading file:',err.message)
//     }
// }


// handling unexpected errors 

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});