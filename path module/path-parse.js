import path from 'path'

const parsed = path.parse('/home/user/docs/file.txt')
console.log(parsed)
console.log(path.format(parsed))