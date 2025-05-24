console.log('jprodess ID:',process.pid);
console.log('platform:',process.platform)
console.log('current directory:',process.cwd())
console.log('uptime:',process.uptime())

console.log('command-line args:',process.argv);
console.log('env variable:',process.env.MY_SECRET)


//global 
globalThis.appName = 'MyApp'
console.log('global var:',appName)

const buf = Buffer.from('hello')
console.log(buf)
console.log(buf.toString())

const buff = Buffer.alloc(10);
buff.write('hi')
console.log(buff.toString())


const encoded = Buffer.from('Secet').toString('base64')
console.log('encoded:',encoded);
const decode = Buffer.from(encoded,'base64').toString();
console.log(decode)


