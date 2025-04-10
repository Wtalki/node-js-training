import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// const filePath = path.join(__dirname, 'bigfile.txt');

// // ဖတ်ဖို့ Stream ဖန်တီး
// const readStream = fs.createReadStream(filePath, { encoding: 'utf8' });

// readStream.on('data', chunk => {
//   console.log('📦 Received chunk:', chunk);
// });

// readStream.on('end',() => {
//     console.log('finished reading file')
// })

// readStream.on('error',err => {
//     console.log('error readin file',err);
// })


// const outputPath = path.join(__dirname,'output.txt')
// const writeStream = fs.createWriteStream(outputPath)

// writeStream.write('hello stream world\n')
// writeStream.write('this is line 2\n')
// writeStream.end('final line end\n')

// writeStream.on('finish',() => {
//     console.log('writing completed')
// })

// writeStream.on('err',err => {
//     console.log(err)
// })


// //Pipe (Read + Write in one go)

// const sourcePath=path.join(__dirname,'source.txt')
// const destPath = path.join(__dirname,'copy.txt')

// fs.createReadStream(sourcePath).pipe(fs.createWriteStream(destPath)).on('finish',() => {
//     console.log('file copied using pipe')
// })

//📌 Buffer Size Control (advanced)
const stream = fs.createReadStream('bigfile.txt',{
    encoding:'utf8',
    highWaterMark:64 * 1024
})
console.log(stream)