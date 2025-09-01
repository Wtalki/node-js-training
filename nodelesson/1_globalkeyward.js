import dotenv from 'dotenv';
dotenv.config();



console.log(process.argv)

console.log(process.env.APP_SECRET)
console.log(process.env.DB_PASSWORD);

console.log(process.cwd()); // /Users/you/project


console.log("Start");

process.nextTick(() => console.log("next tick"))
console.log("End")


globalThis.appName = 'Bossxbet'
console.log(appName)

console.log(import.meta.url)


//built in global  classes for working with urls (no need to import )

const url = new URL('https://bossxbet.com/play?game=wingo')

console.log(url.searchParams.get('game'))



//add a function to the microtask queue -- same as promise.then

queueMicrotask(() => {
    console.log('microtask running')
    
})



//textencoder and textdecoder
//global encoding and decoding text utf-8

const encoder = new TextEncoder()
const buf = encoder.encode("hello")
console.log(buf)

const decoder = new TextDecoder()
console.log(decoder.decode(buf))

//runs immediately after i/o events (more accurate  than settimeout(0))

setImmediate(() => {
    console.log('runs after current i/o event')
})

const id = setImmediate(() => {});
clearImmediate(id);

// const { performance } = require('perf_hooks');
// import performance from 'perf_hook'
// const start = performance.now();
// // some operation
// console.log(`Time taken: ${performance.now() - start}ms`);


const start = process.hrtime();
// do stuff
const diff = process.hrtime(start);
console.log(`Benchmark: ${diff[0]}s ${diff[1] / 1e6}ms`);


globalThis.console.log = (...args) => {
  process.stdout.write('LOG: ' + args.join(' ') + '\n');
};

console.log("Hello");

