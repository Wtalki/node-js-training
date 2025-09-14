import http from 'http';
import { URL } from 'url';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { marked } from 'marked';

const port = process.env.PORT ? Number(process.env.PORT) : 3003;
const dataDir = path.resolve(process.cwd(), 'blog', 'articles');

// Simple hardcoded admin credentials
const ADMIN_USERNAME = process.env.BLOG_USER || 'admin';
const ADMIN_PASSWORD = process.env.BLOG_PASS || 'password';

// In-memory session store: token -> { username, createdAt }
const sessions = new Map();

async function ensureDataDir() {
  await fs.mkdir(dataDir, { recursive: true });
}

function htmlLayout(title, body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    :root { --bg:#0b1020; --card:#0e152a; --muted:#9aa4bf; --text:#e4e8f5; --accent:#4f7cff; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'; background: var(--bg); color: var(--text); }
    a { color: var(--accent); text-decoration: none; }
    header { display: flex; gap: 1rem; padding: 1rem 1.25rem; border-bottom: 1px solid #1f2a44; position: sticky; top: 0; background: rgba(11,16,32,0.8); backdrop-filter: blur(8px); }
    header a { font-weight: 600; }
    main { max-width: 920px; margin: 0 auto; padding: 1.25rem; }
    .card { background: radial-gradient(1200px 1200px at -25% -25%, #142146 0%, rgba(20,33,70,0) 50%), var(--card); border: 1px solid #1f2a44; border-radius: 12px; padding: 1rem 1.25rem; }
    .muted { color: var(--muted); }
    form .row { display: grid; grid-template-columns: 140px 1fr; gap: .75rem 1rem; margin-bottom: .75rem; align-items: start; }
    input[type="text"], input[type="date"], textarea { width: 100%; padding: .6rem .7rem; border-radius: 8px; border: 1px solid #273556; background: #0a1227; color: var(--text); }
    textarea { min-height: 200px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; }
    button { background: var(--accent); color: white; border: 0; padding: .6rem .9rem; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .danger { background: #ef4444; }
    .list { display: grid; gap: .75rem; margin-top: 1rem; }
    .list-item { display: flex; justify-content: space-between; align-items: center; padding: .75rem 1rem; border: 1px solid #1f2a44; border-radius: 10px; background: #0c1733; }
    .actions { display: flex; gap: .5rem; }
    .prose :where(h1,h2,h3){ margin: .6em 0 .4em; }
    .prose :where(p,ul,ol){ line-height: 1.65; color: #ced5ea; }
    .prose pre { background: #0b1227; border: 1px solid #1f2a44; padding: .75rem; border-radius: 10px; overflow: auto; }
    .notice { margin-top: 1rem; padding: .75rem 1rem; background: #06102a; border: 1px dashed #273556; border-radius: 10px; }
  </style>
</head>
<body>
  <header>
    <a href="/">Home</a>
    <a href="/admin">Admin</a>
    <a href="/admin/new">Add Article</a>
  </header>
  <main>
    ${body}
  </main>
</body>
</html>`;
}

function parseCookies(req) {
  const header = req.headers.cookie;
  const cookies = {};
  if (!header) return cookies;
  for (const part of header.split(';')) {
    const [k, v] = part.trim().split('=');
    cookies[k] = decodeURIComponent(v || '');
  }
  return cookies;
}

function isAuthenticated(req) {
  const cookies = parseCookies(req);
  const token = cookies['blog_session'];
  return token && sessions.has(token);
}

function requireAuth(req, res) {
  if (!isAuthenticated(req)) {
    res.statusCode = 302;
    res.setHeader('Location', '/admin/login');
    res.end();
    return false;
  }
  return true;
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

function slugify(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);
}

async function listArticles() {
  await ensureDataDir();
  const files = await fs.readdir(dataDir);
  const items = [];
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    const raw = await fs.readFile(path.join(dataDir, file), 'utf8');
    try {
      const article = JSON.parse(raw);
      items.push(article);
    } catch {}
  }
  items.sort((a, b) => new Date(b.date) - new Date(a.date));
  return items;
}

async function readArticle(id) {
  const file = path.join(dataDir, `${id}.json`);
  const raw = await fs.readFile(file, 'utf8');
  return JSON.parse(raw);
}

async function writeArticle(article) {
  await ensureDataDir();
  const file = path.join(dataDir, `${article.id}.json`);
  await fs.writeFile(file, JSON.stringify(article, null, 2), 'utf8');
}

async function deleteArticle(id) {
  const file = path.join(dataDir, `${id}.json`);
  await fs.unlink(file);
}

function renderHome(articles) {
  const list = articles
    .map(a => `<div class="list-item"><div><a href="/article?id=${encodeURIComponent(a.id)}"><strong>${escapeHtml(a.title)}</strong></a><div class="muted">${formatDate(a.date)}</div></div></div>`)
    .join('');
  return htmlLayout('Personal Blog', `
    <h1>Personal Blog</h1>
    <p class="muted">Welcome. Read the latest articles below.</p>
    <div class="list">${list || '<div class="notice">No articles yet.</div>'}</div>
  `);
}

function renderArticlePage(article) {
  const htmlContent = marked.parse(article.content || '');
  return htmlLayout(`${escapeHtml(article.title)}`, `
    <article class="card prose">
      <h1>${escapeHtml(article.title)}</h1>
      <div class="muted">Published ${formatDate(article.date)}</div>
      <div>${htmlContent}</div>
    </article>
  `);
}

function renderLogin(errorMessage = '') {
  return htmlLayout('Admin Login', `
    <h1>Admin Login</h1>
    ${errorMessage ? `<div class="notice" style="border-color:#ef4444; color:#fecaca;">${escapeHtml(errorMessage)}</div>` : ''}
    <form class="card" method="POST" action="/admin/login">
      <div class="row">
        <label for="username">Username</label>
        <input id="username" name="username" type="text" required />
      </div>
      <div class="row">
        <label for="password">Password</label>
        <input id="password" name="password" type="password" required />
      </div>
      <button type="submit">Login</button>
    </form>
  `);
}

function renderDashboard(articles) {
  const items = articles
    .map(a => `
      <div class="list-item">
        <div>
          <div><a href="/article?id=${encodeURIComponent(a.id)}"><strong>${escapeHtml(a.title)}</strong></a></div>
          <div class="muted">${formatDate(a.date)}</div>
        </div>
        <div class="actions">
          <a href="/admin/edit?id=${encodeURIComponent(a.id)}"><button type="button">Edit</button></a>
          <form method="POST" action="/admin/delete" onsubmit="return confirm('Delete this article?');">
            <input type="hidden" name="id" value="${escapeHtml(a.id)}" />
            <button class="danger" type="submit">Delete</button>
          </form>
        </div>
      </div>
    `)
    .join('');
  return htmlLayout('Admin Dashboard', `
    <h1>Dashboard</h1>
    <p><a href="/admin/new"><button type="button">Add New Article</button></a> <a class="muted" href="/admin/logout">Logout</a></p>
    <div class="list">${items || '<div class="notice">No articles yet.</div>'}</div>
  `);
}

function renderArticleForm({ mode, article, error }) {
  const isEdit = mode === 'edit';
  const title = isEdit ? 'Edit Article' : 'Add Article';
  const action = isEdit ? '/admin/edit' : '/admin/new';
  const btn = isEdit ? 'Save Changes' : 'Create Article';
  return htmlLayout(title, `
    <h1>${title}</h1>
    ${error ? `<div class="notice" style="border-color:#ef4444; color:#fecaca;">${escapeHtml(error)}</div>` : ''}
    <form class="card" method="POST" action="${action}">
      ${isEdit ? `<input type="hidden" name="id" value="${escapeHtml(article.id)}" />` : ''}
      <div class="row">
        <label for="title">Title</label>
        <input id="title" name="title" type="text" required value="${escapeHtml(article.title || '')}" />
      </div>
      <div class="row">
        <label for="date">Date</label>
        <input id="date" name="date" type="date" required value="${(article.date || new Date().toISOString().slice(0,10))}" />
      </div>
      <div class="row" style="grid-template-columns: 1fr;">
        <label for="content">Content (Markdown)</label>
        <textarea id="content" name="content" required>${escapeHtml(article.content || '')}</textarea>
      </div>
      <button type="submit">${btn}</button>
    </form>
  `);
}

function escapeHtml(s = '') {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function setSessionCookie(res, token) {
  const maxAge = 60 * 60 * 24; // 1 day
  res.setHeader('Set-Cookie', `blog_session=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=${maxAge}`);
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', 'blog_session=; HttpOnly; Path=/; Max-Age=0');
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${port}`);

    // Routes
    if (req.method === 'GET' && url.pathname === '/') {
      const articles = await listArticles();
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(renderHome(articles));
      return;
    }

    if (req.method === 'GET' && url.pathname === '/article') {
      const id = url.searchParams.get('id');
      if (!id) {
        res.statusCode = 400;
        res.end('Missing id');
        return;
      }
      try {
        const article = await readArticle(id);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(renderArticlePage(article));
      } catch {
        res.statusCode = 404;
        res.end(htmlLayout('Not Found', '<h1>Article Not Found</h1>'));
      }
      return;
    }

    // Auth
    if (req.method === 'GET' && url.pathname === '/admin/login') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(renderLogin());
      return;
    }
    if (req.method === 'POST' && url.pathname === '/admin/login') {
      const body = await readBody(req);
      const params = new URLSearchParams(body);
      const u = params.get('username') || '';
      const p = params.get('password') || '';
      if (u === ADMIN_USERNAME && p === ADMIN_PASSWORD) {
        const token = crypto.randomBytes(24).toString('base64url');
        sessions.set(token, { username: u, createdAt: Date.now() });
        setSessionCookie(res, token);
        res.statusCode = 302;
        res.setHeader('Location', '/admin');
        res.end();
      } else {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(renderLogin('Invalid credentials'));
      }
      return;
    }
    if (req.method === 'GET' && url.pathname === '/admin/logout') {
      const cookies = parseCookies(req);
      const token = cookies['blog_session'];
      if (token) sessions.delete(token);
      clearSessionCookie(res);
      res.statusCode = 302;
      res.setHeader('Location', '/');
      res.end();
      return;
    }

    // Admin pages
    if (url.pathname === '/admin') {
      if (!requireAuth(req, res)) return;
      const articles = await listArticles();
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(renderDashboard(articles));
      return;
    }

    if (req.method === 'GET' && url.pathname === '/admin/new') {
      if (!requireAuth(req, res)) return;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(renderArticleForm({ mode: 'new', article: {}, error: '' }));
      return;
    }
    if (req.method === 'POST' && url.pathname === '/admin/new') {
      if (!requireAuth(req, res)) return;
      const body = await readBody(req);
      const params = new URLSearchParams(body);
      const title = (params.get('title') || '').trim();
      const date = (params.get('date') || new Date().toISOString().slice(0,10)).trim();
      const content = (params.get('content') || '').trim();
      if (!title || !content) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(renderArticleForm({ mode: 'new', article: { title, date, content }, error: 'Title and content are required.' }));
        return;
      }
      const baseId = slugify(title) || 'post';
      const id = `${baseId}-${Date.now()}`;
      await writeArticle({ id, title, date, content });
      res.statusCode = 302;
      res.setHeader('Location', '/admin');
      res.end();
      return;
    }

    if (req.method === 'GET' && url.pathname === '/admin/edit') {
      if (!requireAuth(req, res)) return;
      const id = url.searchParams.get('id');
      try {
        const article = await readArticle(id);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(renderArticleForm({ mode: 'edit', article, error: '' }));
      } catch {
        res.statusCode = 404;
        res.end(htmlLayout('Not Found', '<h1>Article Not Found</h1>'));
      }
      return;
    }
    if (req.method === 'POST' && url.pathname === '/admin/edit') {
      if (!requireAuth(req, res)) return;
      const body = await readBody(req);
      const params = new URLSearchParams(body);
      const id = params.get('id');
      const title = (params.get('title') || '').trim();
      const date = (params.get('date') || new Date().toISOString().slice(0,10)).trim();
      const content = (params.get('content') || '').trim();
      if (!id || !title || !content) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(renderArticleForm({ mode: 'edit', article: { id, title, date, content }, error: 'Title and content are required.' }));
        return;
      }
      await writeArticle({ id, title, date, content });
      res.statusCode = 302;
      res.setHeader('Location', '/admin');
      res.end();
      return;
    }

    if (req.method === 'POST' && url.pathname === '/admin/delete') {
      if (!requireAuth(req, res)) return;
      const body = await readBody(req);
      const params = new URLSearchParams(body);
      const id = params.get('id');
      if (id) {
        try { await deleteArticle(id); } catch {}
      }
      res.statusCode = 302;
      res.setHeader('Location', '/admin');
      res.end();
      return;
    }

    // Fallback
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(htmlLayout('Not Found', '<h1>404 Not Found</h1>'));
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end(`Internal Server Error: ${error.message}`);
  }
});

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Blog running on http://localhost:${port}`);
  console.log('Admin login at /admin/login (default admin/password)');
});


