// global node js
import { clear } from 'console'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename=fileURLToPath(import.meta.url)
const __dirname=path.dirname(__filename)
console.log('__dirname:',__dirname)

// 3. global object 👉 browser ရဲ့ window object လိုမျိုး
globalThis.appName= 'MyNodeApp'
console.log('global.appname:',globalThis.appName)


// process object system / env info တွေကို handle လုပ်တဲ object
console.log('လုပ်နေတဲ enviroment : ', process.env.NODE_ENV)
console.log('အလုပ်လုပ်နေတဲ folder: ', process.cwd())
console.log('process id: ',process.pid)

// လုပ်ဆောင်ချက်မှန်အောင်ပြီးတဲ့အခါ process ကိုပိတ်ချင်ရင်
// process.exit(0) // 0 = success, 1 = error


// buffer binary data ကို ကိုင်တွယ်ဖိုသုံးတယ် 
const buf = Buffer.from('Node.js')
console.log('Buffer :',buf)
console.log('Buffer to string:',buf.toString())

//setinterval clearinterval ထပ်ခါထပ်ခါလုပ်ချင်တဲလုပ်ဆောင်ချက် 
const timeoutId = setTimeout(() => {
    console.log('၂ စက္ကန်နောက်ကျမှ အလုပ်လုပ်မယ်')

},2000)
clearTimeout(timeoutId)

//setimmediate I/O ပြိးပြိးချင်း အလုပ်လုပ်မယ်
setImmediate(() => {
    console.log('setImmediate က I/O ပြိးတဲနောက်အလုပ်လုပ်တယ်')
})

//queueMicrotask microtask (သေးသေးလေးပဲ ဒါပေမဲ အလျင်အမြန်)
queueMicrotask(() => {
    console.log('microtask : promise လိုမျိုး အရင်ပြေးတယ်')
})


// 10. console 👉 log များအတွက် global object
console.log('စာရွက်ထဲ print လုပ်တယ်')
console.warn('သတိပေးချက်')
console.error('အမှားဖြစ်တယ်')

// blob class
const blob = new Blob(["hello world"],{type:"text/plain"})
console.log(blob)


