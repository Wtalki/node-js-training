import path from "path"

console.log(path.basename('/foo/bar/baz.html'))


console.log(path.basename('/foo/bar/baz.html','.html'))
console.log(path.basename('/foo/bar'))
console.log(path.basename('C:\\temp\\myfile.html'))
console.log(path.basename('/foo/bar/baz.html','.txt'))



const filePath = '/users/john/doicuments/report.pdf'
const fileName = path.basename(filePath)
const fileNameWithoutExt = path.basename(fileName,'.pdf')

console.log(`file name : ${fileName}`)
console.log(`file name without extension : ${fileNameWithoutExt}`)