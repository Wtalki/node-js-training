import http from 'http'

// server create 
const server = http.createServer((req,res) =>{
    // request url route define
    if(req.url === '/'){
        res.writeHead(200,{'Content-Type':'application/json'})
        res.end(JSON.stringify({message:"mingalar this is main page"}))
    }
    else if(req.url == '/about'){
        res.writeHead(200,{'Content-Type':'application/json'})
        res.end(JSON.stringify({message:'this is about page'}))
    }else{
        res.writeHead(404,{'Content-Type':'application/json'})
        res.end(JSON.stringify({message:'web page not found'}))

    }

})

//server port run 
server.listen(3010,() => {
    console.log('server success http://localhost:3010')
})
