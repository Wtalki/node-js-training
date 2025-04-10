import http from 'http'

const server = http.createServer((req,res) => {
    console.log(req)
    
    res.write("<h1> hello from node.js server</h1>")
})

server.listen(8100,() => console.log('server up...'))