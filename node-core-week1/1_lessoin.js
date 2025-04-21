const user = {
    name:'aung aung',
    age:25,
    job:'developer',

}
const {name,age} = user
console.log(name)
console.log(age)


//array desturcturing 
const nums = [10,20,30]
const [a,b] = nums;
console.log(a)
console.log(b)


//spread operator (...)

const arr1 = [1,2]
const arr2 = [...arr1,3,4]
console.log(arr2);

//object spread 
const obj = {a:1,b:2}
const obj2 = {...obj,c:3}
console.log(obj2)


//modules es mdules improt / ex
export const add = (a,b) => a+b;
export const sub = (a,b) => a-b;

//defaul parameters 
function greet(name= 'friend'){
    console.log(`hello , ${name}`)

}
greet()
greet('zaw lay')


const sum = (a,b) => a+b
console.log(sum(3,5))

const name2 = 'zaw lay'
const age2 = 20
const user33 = {name2,age2}
console.log(user33)


const users = {
    name:'aung aung',
    address:{
        city:'yangon'
    }
}

console.log(users.address?.city);
console.log(users.job?.position)

let name4 = null;
let username = name4 ?? 'defaultUser';
console.log(username)


//rest parameters 
function hello(...args){
    return args.reduce((acc,val) => acc + val,0);
}
console.log(hello(1,2,3,4))