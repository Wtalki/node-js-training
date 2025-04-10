import path from "path"

// note 
// 'path.delimiter' ဟာ os ပေါမူတည်ပြိး path enviroment variable ထဲက multiple paths separator (e.g. ":" or ';') ကို return ပြန်ပေးတယ်

console.log('path delimiter for this os', path.delimiter)


//example : system path variable ကို split လုပ်ပြိး array အနေနဲရယူခြင်း
const systemPath = process.env.PATH

const pathArray = systemPath.split(path.delimiter)
console.log('parsed path',pathArray)

/*
📌 Notes:
- On Linux/macOS: delimiter = ':' (colon)
- On Windows: delimiter = ';' (semicolon)
- delimiter ကို manual ဖြင့် မသတ်မှတ်ဘဲ path.delimiter သုံးတာက platform-independent ဖြစ်ပြီး၊ production code တွေအတွက် safe ဖြစ်တယ်။
*/