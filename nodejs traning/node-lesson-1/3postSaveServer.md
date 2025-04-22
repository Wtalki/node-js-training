
တော်ပါတယ်ဗျာ! Node.js POST request ကိုအောင်မြင်စွာ run လုပ်နိုင်ပြီဆိုတော့ **နောက်တစ်အဆင့်**သွားကြရအောင်။

---

## 🚀 NEXT: POST Data ကို File ထဲသိမ်းမယ် (Logging or Saving)

အခုလုပ်မှာက `POST` data ကို JSON format နဲ့ `.txt` file သို့မဟုတ် `.json` file ထဲကို **သိမ်းတင်**ပေးတာ ဖြစ်ပါတယ်။

---

## ✅ Step by Step

### 🔸 1. `fs` module ကို import လုပ်မယ်

```js
import http from 'http';
import { writeFile, appendFile } from 'fs';
```

- `writeFile` — file ထဲကို overwrite ပြုလုပ်တယ်
- `appendFile` — ရှိပြီးသား file ထဲကိုဆက်ရေးတယ်

---

### 🔸 2. POST data ကို `log.txt` ထဲသိမ်းမယ်

```js
const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/submit') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      let parsedData;
      try {
        parsedData = JSON.parse(body);
      } catch (err) {
        parsedData = { error: 'Invalid JSON format' };
      }

      const log = `\n[${new Date().toISOString()}] ${JSON.stringify(parsedData)}\n`;

      // 🔥 File ထဲသိမ်း
      appendFile('log.txt', log, err => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'File write failed' }));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'success',
          message: 'Data saved to log.txt',
          received: parsedData
        }));
      });
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Route not found' }));
  }
});

server.listen(3010, () => {
  console.log('📁 Server running at http://localhost:3010');
});
```

---

## 🧪 Test လုပ်ဖို့

- Postman သုံးပြီး `POST http://localhost:3010/submit`  
- Body ➜ JSON

```json
{
  "username": "MinThu",
  "action": "Login"
}
```

➡️ ပြီးရင် folder ထဲမှာ `log.txt` ဆိုတဲ့ဖိုင်ထဲမှာ data သိမ်းနေပါပြီ။

---

## 📂 Output Example (`log.txt`)

```
[2025-04-21T15:30:12.123Z] {"username":"MinThu","action":"Login"}

[2025-04-21T15:32:45.456Z] {"username":"KoKo","action":"Logout"}
```

---

## ✅ သင်ဘာ လုပ်ချင်နေသလဲ?

| ရည်ရွယ်ချက် | ဆက်လုပ်နိုင်မယ့်အရာ |
|-------------|--------------------|
| 📁 JSON format log တွေ | `.json` file ထဲသိမ်းချင်လား? |
| 📬 Email ပြန်ပို့ချင် | `nodemailer` နဲ့ email alert |
| 🔗 Database ချိတ်ချင် | MongoDB, PostgreSQL, MySQL |
| 🧠 Express.js နဲ့ REST API | Route များလွယ်လွယ်ပြုလုပ်နိုင် |
| ⚡ Realtime data | WebSocket or socket.io |

ဘာလုပ်ချင်လဲ? ပြောလို့ရတယ်ဗျာ။  
`form save`, `login API`, `register`, `chat`, `game` လိုချင်တာရှိရင် တစ်ဆင့်ချင်းရှင်းပြမယ် 😎