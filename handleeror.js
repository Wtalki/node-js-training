// // const fs = require('fs').promises;

// // async function readFileAsync(filePath) {
// //   try {
// //     const data = await fs.readFile(filePath, 'utf8');
// //     console.log("File content:", data);
// //   } catch (err) {
// //     console.error("Error reading file:", err);
// //   }
// // }

// // readFileAsync('/path/to/file.txt');


// const express = require('express');
// const fs = require('fs').promises;
// const app = express();

// // Async wrapper middleware
// function asyncHandler(fn) {
//   return (req, res, next) => {
//     fn(req, res, next).catch(next);
//   };
// }

// app.get('/my-route', asyncHandler(async (req, res) => {
//   const data = await fs.readFile('/path/to/file.txt', 'utf8');
//   res.send(data);
// }));

// // Global error handler
// app.use((err, req, res, next) => {
//   console.error("Global error handler:", err);
//   res.status(500).send("Something went wrong!");
// });

function first() {
  second();
}
function second() {
  third();
}
function third() {
  throw new Error("Something went wrong!");
}
first();
