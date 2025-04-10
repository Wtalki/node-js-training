import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.join(__dirname, 'data.json');

// ✅ JSON ဖိုင်ဖတ်ခြင်း
async function readJsonFile() {
  try {
    const content = await fs.readFile(jsonPath, 'utf8');
    const data = JSON.parse(content);
    console.log('📖 JSON ဖတ်ပြီး:', data);
    return data;
  } catch (err) {
    console.error('❌ ဖတ်ခြင်း error:', err);
  }
}

// ✅ JSON ဖိုင်ထဲသို့ ရေးခြင်း
async function writeJsonFile(newData) {
  try {
    const jsonStr = JSON.stringify(newData, null, 2); // pretty print
    await fs.writeFile(jsonPath, jsonStr, 'utf8');
    console.log('✅ JSON ဖိုင်ရေးပြီးပါပြီ');
  } catch (err) {
    console.error('❌ ရေးရာတွင် error:', err);
  }
}

// ✅ လုပ်ဆောင်ချက်အတူတကွ
async function updateJson() {
  const data = await readJsonFile();

  // value တစ်ခု ပြောင်းခြင်း / ပေါင်းထည့်ခြင်း
  data.age = 26;
  data.skills.push('Redis');

  await writeJsonFile(data);
}

updateJson();
