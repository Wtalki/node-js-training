import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'watched.txt');

// // Watch file for changes
// fs.watch(filePath, (eventType, filename) => {
//   if (filename) {
//     console.log(`📢 File event: ${eventType} on ${filename}`);
//   } else {
//     console.log('⚠️ Change detected but no filename info.');
//   }
// });

const dirPath = path.join(__dirname,'watched-dir')

fs.watch(dirPath,(eventType,filename) => {
    if(filename){
        console.log(`directory change: ${eventType} on ${filename}`)
    }
})



let timeout = null
fs.watch(filePath,() => {
    if(timeout) clearTimeout(timeout);

    timeout = setTimeout(() => {
        console.log('actual change project')
    }, 100);
})