import * as fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'


const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log(__filename,__dirname)

const filePath = path.join(__dirname,'example.txt')


fs.writeFile(filePath,'Hello fro node js!\n',(err) => {
    if(err) throw err;
    console.log('file writin is successfully')
})


//ဖိုင်တွင်အချက်အလတ်မျာပေါင်းထည့်ခြင်း

fs.appendFile(filePath,'append line\n',(err) => {
    if(err) throw err;
    console.log('append file is successfully')
})


// ဖိုင်ဖတ်ခြင်း (asynchronous)

fs.readFile(filePath,'utf8',(err,data) => {
    if(err) throw err;
    console.log('read file is \n',data)

})

// //ဖိုင်ဖတ်ခြင်း (synchrounous)

try {
    const syncData = fs.readFileSync('example.txt', 'utf8'); // ဖိုင်ကို synchronous ဖြင့် ဖတ်ခြင်း
    console.log('📄 Sync ဖတ်ခြင်း:\n', syncData); // ဖတ်ပြီးရသည့် အကြောင်းအရာကို console ထဲမှာ ထုတ်ပြပါ
  } catch (err) {
    console.error('❌ Sync ဖတ်ရာတွင် အမှား:\n', err); // အမှားရှိပါက အမှားကို အစီအစဉ်တွင် ထုတ်ပြပါ
  }



//   ဖိုင်အချက်လတ်မျာစစ်ခြင်း metada 
fs.stat(filePath,(err,stats) => {
    if(err) throw err;
    console.log(stats)
})

//directory တစ်ခုဖန်တိးခြင်း 
const dirPath = path.join(__dirname,'test-dir')

fs.mkdir(dirPath,{recursive:true},(err) =>{
    if(err) throw err;
    console.log('direcory created ',dirPath)
})


// directory အတွင်းဖိုင်များကိုဖတ်ခြင်း 
fs.readdir(__dirname,(err,files) => {
    if(err)  throw err;
    console.log('လက်ရှိ ဒိုက်ရိုက်တရီးအတွင်း ဖိုင်များ:',files)
})


// ဖိုင်အမည်ပြောင်းလဲခြင်း 
const renamePath = path.join(__dirname,'rename-example.txt')
fs.rename(filePath,renamePath,(err) => {
    console.log('rename change folder success')
})

// delet files 
fs.unlink(renamePath,(err) => {
    if(err) throw err;
    console.log('delete files success')
})

//delete directory 
fs.rm(dirPath,{recursive:true,force:true},(err) => {
    console.log('remove directory')
})