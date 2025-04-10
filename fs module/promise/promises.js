import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url' 

const __filename=fileURLToPath(import.meta.url)
const __dirname =path.dirname(__filename)
console.log(__dirname)

const filePath = path.join(__dirname,'example.txt')
const dirPath = path.join(__dirname,'test-dir')
const renamePath = path.join(__dirname,'renamed-example.txt')

async function runFsOperation(){
    try{
        await fs.writeFile(filePath,'Hello from fs.promises\n')
        console.log('file writing successfully')

        await fs.appendFile(filePath,'this is apppend text\n')
        console.log('append file is successfully')

        const data= await fs.readFile(filePath,'utf8')
        console.log('text is',data)

        const stats = await fs.stat(filePath)
        console.log(stats)


        await fs.mkdir(dirPath,{recursive:true})
        console.log('directory created',dirPath)

        const files = await fs.readdir(__dirname)
        console.log(files)

        await fs.rename(filePath,renamePath)

        await fs.unlink(renamePath)
        console.log('directory removed ')

        await fs.rm(dirPath, { recursive: true, force: true });
        console.log('🗑️ Directory removed');
    }catch(err){
        console.log(err)
    }
}
runFsOperation()
console.log(dirPath)