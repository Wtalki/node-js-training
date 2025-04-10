//syntax 

// path.format(pathObject)


import path from "path"

const pathObj = {
    dir:'home/user/docs',
    base:'file.txt'
}

const fullPath = path.format(pathObj)
console.log(fullPath)

const pathObje = {
    root: '/',
    name: 'notes',
    ext: '.md'
  };
  