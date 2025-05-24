import fs from 'fs';
// fs.readFile('test.txt','utf8',(err,data) => {
//     if(err) throw err;
//     console.log('content',data)
// })


// fs.writeFile('test.txt','hello world',(err) => {
//     if(err) throw err;
//     console.log('file written')
// })

// fs.appendFile('test.txt','\nAnoter line',(err) => {
//     if(err) throw err;
//     console.log('line appended')
// })


// // fs.readFileSync()
// const data = fs.readFileSync('test.txt','utf8')
// console.log('sync read:',data)

// fs.writeFileSync('example.txt','sync content')


// // fs.stat()
// fs.stat('test.txt',(err,stats) => {
//     if(err) throw err;
//     console.log('stats:',stats)
// })

// fs.rename('test.txt','renamed.txt',(err) => {
//     if(err) throw err;
//     console.log('file renamed')
// })

// // fs.unlink() 
// fs.unlink('renamed.txt', (err) => {
//     if (err) throw err;
//     console.log('🗑️ File deleted');
//   });
  

fs.mkdir('my-folder',{recursive:true},(err) => {
    if(err) throw err;
    console.log('folder created')
})

fs.readdir('.',(err,files) => {
    if(err) throw err;
    console.log('files',files);
})

//bonus: file streaming 
const reader = fs.createReadStream('bigfile.txt','utf8');
reader.on('data',chunk =>{
    console.log("chunk:",chunk)
})