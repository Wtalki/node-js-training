import path from 'path'

const filePath = path.join('users','john','docuemnts','file.txt')
console.log(filePath)


const fielname= path.basename(filePath);
console.log('joined Path',filePath)


const fileExt = path.dirname(filePath)
console.log(fileExt)

const normalizedPath = path.normalize('user/john/../../john/documents/file.txt')
console.log(normalizedPath)

const resolvePath = path.resolve('users/john','documents/file.txt')
console.log(resolvePath)