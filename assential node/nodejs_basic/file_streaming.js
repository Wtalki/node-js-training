import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const source = path.join(__dirname, 'input.txt');
const target = path.join(__dirname, 'output.txt');

// Stream Read & Write
const reader = fs.createReadStream(source);
const writer = fs.createWriteStream(target);

reader.on('data', (chunk) => {
  console.log('📦 Buffer chunk:', chunk);
  writer.write(chunk); // Write raw buffer
});

reader.on('end', () => {
  console.log('✅ File copied successfully.');
});


