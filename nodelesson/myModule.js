function greet(name){
    return `Hello,${name}`
}

exports.add = (a,b) => a+b;
exports.multiply = (a,b) => a*b;
// module.exports = greet 

module.exprots = {
    add:(a,b) => a +b,
    multiply:(a,b) => a*b
}