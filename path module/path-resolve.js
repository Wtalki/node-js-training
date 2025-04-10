import path from 'path'

console.log(path.resolve('folder','file.txt'));



const filePath = 'some/folder/structure/file.txt';
const parts = filePath.split(path.sep);

console.log(parts);

const folders = ['src', 'utils', 'index.js'];
const fullPath = folders.join(path.sep);

console.log(fullPath); // "src/utils/index.js" or "src\\utils\\index.js"
