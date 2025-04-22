အေးပါတယ်ဗျာ 😎 — အခုတော့ `Pure Node.js + File Storage CRUD API` ရဲ့ **Code Flow Diagram** ကို မြန်မာလိုနဲ့ အဆင့်လိုက် ရှင်းပြပေးမယ်။ ဒီ Diagram က မင်းရေးထားတဲ့ code တစ်ခုလုံးကို **visual** အနေနဲ့ နားလည်လွယ်အောင်ဖော်ပြတာဖြစ်တယ်။

---

## ✅ Code Flow Diagram – File-based CRUD API (users.json)

```plaintext
   🧍 Client
     │
     │ 1. Send HTTP request (GET, POST, PUT, DELETE)
     ▼
 ┌─────────────────────────────┐
 │  Node.js HTTP Server        │
 │  (http.createServer)        │
 └─────────────────────────────┘
     │
     │ 2. Parse URL + Method
     ▼
 ┌──────────────────────────────┐
 │  Check which route it is     │
 │  (/users, /users/:id)        │
 └──────────────────────────────┘
     │
     ▼
 ┌────────────────────────────────────────────┐
 │ 🔄 Route Decision                          │
 │                                            │
 │  ┌────────────┬────────────┬────────────┐  │
 │  │ GET /users │ POST /users│ PUT /users/:id│
 │  └────────────┴────────────┴────────────┘  │
 └────────────────────────────────────────────┘
     │
     ▼
 ┌──────────────────────────────┐
 │  3. Read/Write users.json    │
 │  using fs.readFile / writeFile│
 └──────────────────────────────┘
     │
     ▼
 ┌──────────────────────────────────────┐
 │  4. Do logic based on method         │
 │    - GET → read & send users         │
 │    - POST → push & save new user     │
 │    - PUT → update user info          │
 │    - DELETE → remove user from list  │
 └──────────────────────────────────────┘
     │
     ▼
 ┌──────────────────────────────┐
 │  5. Send JSON response       │
 │     res.writeHead + res.end │
 └──────────────────────────────┘
     │
     ▼
 ✅ Response to Client
```

---

## 🧠 Explanation (မြန်မာလို)

| အဆင့် | ဖော်ပြချက် |
|--------|-------------|
| 1️⃣ | Client က HTTP request တစ်ခုပေးတယ် (POST, PUT, etc.) |
| 2️⃣ | Server က URL (`/users/1`) နဲ့ Method (`PUT`) ကို ခွဲဖတ်တယ် |
| 3️⃣ | `users.json` ဖိုင်ထဲကို ဖတ်တယ် (GET), မေးတယ် (POST), ပြင်တယ် (PUT), ဖျက်တယ် (DELETE) |
| 4️⃣ | logic အတိုင်း array ထဲမှာ add/update/delete ပြုလုပ်တယ် |
| 5️⃣ | ပြန်ဖြေတဲ့ result ကို JSON format နဲ့ client ထံကို `res.end()` ဖြင့် ပြန်ပေးတယ် |

---

## 🛠 အဓိက အသုံးပြုထားတဲ့ Code Block Flow

| Function | Description |
|----------|-------------|
| `http.createServer()` | Server တည်ဆောက်တယ် |
| `new URL(req.url, base)` | URL parsing |
| `req.on('data')` / `'end'` | POST/PUT data ဖတ်ဖို့ |
| `fs.readFile()` | ဖိုင်ထဲက users data ဖတ်ဖို့ |
| `fs.writeFile()` | ဖိုင်ထဲကို သိမ်းဖို့ |
| `res.end()` | JSON result ပြန်ပေးဖို့ |

---

## 🎯 Real Example Flow (POST)

```plaintext
Client ➜ POST /users with body { "name": "Ko Ko" }

→ Server: read users.json
→ Add new user to array
→ write back to users.json
→ res.end({ message: "User added", user: {...} })
```

---

ဒါဆိုရင် code ပေးထားတဲ့ structure ကို နားလည်ပြီး တော်တော်လေးသွားနေပါပြီ။ 😎

မင်းလိုချင်တာက:
- ✅ login/authentication flow diagram?
- ✅ JWT flow?
- ✅ MongoDB crud flow?

ဆိုရင် ပြောပေး — diagram + example + code ပေးသွားမယ်။ 💪