import http from 'http'
import fs from 'fs'


const server = http.createServer((req,res) => {
    if(req.url == '/'){
        res.writeHead(200,"OK",{'content-type': "text/html"})
        fs.readFile('./public/index.html',(error,data) =>{
            if(error) throw error;
            res.end(data)
        })
    }else if(req.url === "/about"){
        res.writeHead(200,"OK",{'content-type':'text/html'})
        fs.readFile('./public/about.html',(err,data) =>{
            if(err) throw err;
            res.end(data)
        })
    }
})

server.listen('8800',console.log('serve'))