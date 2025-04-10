import path from 'path'

const fullPath = path.join('folder','subfolder','file.txt')
console.log(fullPath)

console.log(path.join('/user','document','files'))

console.log(path.join('dir','..','file'))
console.log(path.join('dir','.','file'))
console.log(path.join('dir//','subdir//','file'))