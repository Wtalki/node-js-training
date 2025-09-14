#!/usr/bin/env node

import http from 'http';
import https from 'https';
import { URL } from 'url';
import { promises as fs } from 'fs';
import path from 'path';

const CACHE_DIR = path.resolve(process.cwd(), '.cache', 'proxy');

function parseArgs(argv) {
  const args = { port: 3008, origin: '', clear: false };
  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    const val = argv[i + 1];
    if (key === '--help' || key === '-h') return { help: true };
    if (key === '--clear-cache') { args.clear = true; i -= 1; continue; }
    if (key === '--port') { args.port = Number(val || '3008'); i += 1; continue; }
    if (key === '--origin') { args.origin = String(val || ''); i += 1; continue; }
  }
  return args;
}

function printUsage() {
  console.log(`Caching Proxy\n\nUsage:\n  caching-proxy --port <number> --origin <url>\n  caching-proxy --clear-cache\n`);
}

async function ensureCacheDir() {
  await fs.mkdir(CACHE_DIR, { recursive: true });
}

function cacheKeyFromRequest(method, url) {
  const safe = url.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${method}_${safe}`;
}

async function cacheGet(key) {
  try {
    const file = path.join(CACHE_DIR, `${key}.json`);
    const raw = await fs.readFile(file, 'utf8');
    const obj = JSON.parse(raw);
    return obj; // { status, headers, bodyBase64 }
  } catch { return null; }
}

async function cacheSet(key, value) {
  const file = path.join(CACHE_DIR, `${key}.json`);
  await fs.writeFile(file, JSON.stringify(value), 'utf8');
}

async function clearCache() {
  try {
    await fs.rm(CACHE_DIR, { recursive: true, force: true });
    console.log('Cache cleared.');
  } catch (err) {
    console.error('Failed to clear cache:', err?.message || err);
  }
}

function forwardRequest(originUrl, req, res) {
  const target = new URL(originUrl);
  const upstream = new URL(req.url, originUrl);
  const client = upstream.protocol === 'https:' ? https : http;
  const options = {
    method: req.method,
    headers: req.headers
  };
  const upstreamReq = client.request(upstream, options, (upstreamRes) => {
    const chunks = [];
    upstreamRes.on('data', (c) => chunks.push(c));
    upstreamRes.on('end', async () => {
      const body = Buffer.concat(chunks);
      const headers = { ...upstreamRes.headers };
      // remove hop-by-hop headers
      delete headers['transfer-encoding'];
      delete headers['connection'];
      res.writeHead(upstreamRes.statusCode || 502, { ...headers, 'X-Cache': 'MISS' });
      res.end(body);
    });
  });
  upstreamReq.on('error', (err) => {
    res.statusCode = 502;
    res.end(`Upstream error: ${err?.message || err}`);
  });
  req.pipe(upstreamReq);
}

async function startServer({ port, origin }) {
  await ensureCacheDir();
  const server = http.createServer(async (req, res) => {
    try {
      if (!origin) {
        res.statusCode = 400;
        res.end('Missing --origin');
        return;
      }
      // Only cache GET requests
      const cacheable = req.method === 'GET';
      const key = cacheKeyFromRequest(req.method, new URL(req.url, origin).toString());
      if (cacheable) {
        const cached = await cacheGet(key);
        if (cached) {
          const headers = { ...cached.headers, 'X-Cache': 'HIT' };
          res.writeHead(cached.status, headers);
          res.end(Buffer.from(cached.bodyBase64, 'base64'));
          return;
        }
      }

      // Proxy request and capture for cache
      const upstream = new URL(req.url, origin);
      const client = upstream.protocol === 'https:' ? https : http;
      const options = { method: req.method, headers: req.headers };
      const upstreamReq = client.request(upstream, options, (upstreamRes) => {
        const chunks = [];
        upstreamRes.on('data', (c) => chunks.push(c));
        upstreamRes.on('end', async () => {
          const body = Buffer.concat(chunks);
          const headers = { ...upstreamRes.headers };
          delete headers['transfer-encoding'];
          delete headers['connection'];

          if (cacheable && upstreamRes.statusCode >= 200 && upstreamRes.statusCode < 400) {
            await cacheSet(key, {
              status: upstreamRes.statusCode,
              headers,
              bodyBase64: body.toString('base64')
            });
          }

          res.writeHead(upstreamRes.statusCode || 502, { ...headers, 'X-Cache': 'MISS' });
          res.end(body);
        });
      });
      upstreamReq.on('error', (err) => {
        res.statusCode = 502;
        res.end(`Upstream error: ${err?.message || err}`);
      });
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        req.pipe(upstreamReq);
      } else {
        upstreamReq.end();
      }
    } catch (err) {
      res.statusCode = 500;
      res.end(`Internal error: ${err?.message || err}`);
    }
  });

  server.listen(port, () => {
    console.log(`Caching proxy on http://localhost:${port} -> ${origin}`);
  });
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) { printUsage(); return; }
  if (args.clear) { await clearCache(); return; }
  if (!args.origin) { printUsage(); process.exitCode = 1; return; }
  if (!Number.isInteger(args.port) || args.port <= 0) { console.error('Invalid --port'); process.exitCode = 1; return; }
  await startServer({ port: args.port, origin: args.origin });
}

main();


