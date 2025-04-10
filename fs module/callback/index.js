import * as fs from "fs"

fs.readFile('example.txt','utf8',(err,data) => {
    if(err) throw err;
    console.log(data)
})