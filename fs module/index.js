import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM မှာ __dirname မရှိပါ။ အောက်ပါနည်းလေးကိုသုံးရပါတယ်။
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'file.txt');

// Async version
async function readFileAsync() {
  try {
    const data = await fs.promises.readFile(filePath, 'utf8');
    console.log("Async read:\n", data);
  } catch (err) {
    console.error(err);
  }
}

// Sync version
try {
  const data = fs.readFileSync(filePath, 'utf8');
  console.log("Sync read:\n", data);
} catch (err) {
  console.error(err);
}

readFileAsync();
