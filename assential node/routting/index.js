import http from 'http'
const server = http.createServer((req,res) => {
   if(req.url === "/"){
    res.end("<h1>Home </h1>")
   }else if(req.url === '/about'){
    res.end("<h1>about</h1>")
   }else if(req.url === '/contact'){
    res.end("<h1>contact</h1>")
    
   }
})

server.listen(8100,() => console.log('server up'))