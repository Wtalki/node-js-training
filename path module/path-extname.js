import path from "path"

const filtPath = '/home/user/file.txt'
const ext = path.extname(filtPath)
console.log(ext)

console.log(path.extname('hello.ext.ar'))

//no extension 
console.log(path.extname('hello'))

console.log(path.extname('/home/user'))