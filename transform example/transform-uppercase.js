import fs from 'fs'
import { Transform } from 'stream'
import path from 'path'
import { fileURLToPath } from 'url'


const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const inputPath = path.join(__dirname,'input.txt')
const outputPath = path.join(__dirname,'output.txt')


//custom transform stream (to UPPERCASE)

const uppercaseTransform = new Transform({
    transform(chunk,encoding,callback){
        const upperChunk = chunk.toString().toUpperCase();
        callback(null,upperChunk)
    }
})

fs.createReadStream(inputPath).pipe(uppercaseTransform).pipe(fs.createWriteStream(outputPath)).on('finish',()=>{
    console.log('transform complete check output.txt')
})