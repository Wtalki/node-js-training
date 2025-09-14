import http from 'http';
import { URL } from 'url';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const port = process.env.PORT ? Number(process.env.PORT) : 3004;
const WEATHER_TTL_SECONDS = Number(process.env.WEATHER_TTL_SECONDS || 43200); // 12h default
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX || 60); // 60 reqs
const RATE_LIMIT_WINDOW_SECONDS = Number(process.env.RATE_LIMIT_WINDOW_SECONDS || 60); // per minute
const API_KEY = process.env.VC_API_KEY || process.env.WEATHER_API_KEY || '';

// Optional Redis cache (if REDIS_URL provided and package installed)
let redisClient = null;
async function initRedis() {
  try {
    const url = process.env.REDIS_URL || '';
    if (!url) return;
    const { createClient } = await import('redis');
    const client = createClient({ url });
    client.on('error', (err) => {
      // eslint-disable-next-line no-console
      console.error('Redis error:', err?.message || err);
    });
    await client.connect();
    redisClient = client;
    // eslint-disable-next-line no-console
    console.log('Connected to Redis');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Redis not available, using in-memory cache only');
  }
}

// In-memory cache fallback
const memoryCache = new Map(); // key -> { expiresAt: epochMs, value: any }

async function cacheGet(key) {
  if (redisClient) {
    const raw = await redisClient.get(key);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() >= entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value;
}

async function cacheSet(key, value, ttlSeconds) {
  if (redisClient) {
    await redisClient.set(key, JSON.stringify(value), { EX: ttlSeconds });
    return;
  }
  memoryCache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

// Simple in-memory rate limiter per IP
const rateState = new Map(); // ip -> { count, windowStartMs }

function rateLimit(req) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = RATE_LIMIT_WINDOW_SECONDS * 1000;
  let state = rateState.get(ip);
  if (!state || now - state.windowStartMs >= windowMs) {
    state = { count: 0, windowStartMs: now };
  }
  state.count += 1;
  rateState.set(ip, state);
  const remaining = Math.max(0, RATE_LIMIT_MAX - state.count);
  const retryAfter = Math.ceil((state.windowStartMs + windowMs - now) / 1000);
  const limited = state.count > RATE_LIMIT_MAX;
  return { limited, remaining, retryAfter };
}

function sendJson(res, status, obj, extraHeaders = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  for (const [k, v] of Object.entries(extraHeaders)) res.setHeader(k, v);
  res.end(JSON.stringify(obj));
}

function helpPage() {
  return {
    name: 'Weather API',
    endpoints: [
      {
        path: '/weather',
        method: 'GET',
        query: { location: 'required, e.g. London or 40.7,-74', units: "optional: 'metric' | 'us'" }
      }
    ],
    env: {
      VC_API_KEY: 'your Visual Crossing API key',
      REDIS_URL: 'optional Redis connection string',
      WEATHER_TTL_SECONDS: `optional cache TTL (default ${WEATHER_TTL_SECONDS})`,
      RATE_LIMIT_MAX: `optional requests per window (default ${RATE_LIMIT_MAX})`,
      RATE_LIMIT_WINDOW_SECONDS: `optional window seconds (default ${RATE_LIMIT_WINDOW_SECONDS})`
    }
  };
}

async function fetchWeather(location, units) {
  if (!API_KEY) {
    const e = new Error('Missing API key. Set VC_API_KEY or WEATHER_API_KEY');
    e.code = 'NO_API_KEY';
    throw e;
  }
  const unitGroup = units === 'us' ? 'us' : 'metric';
  const base = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(location)}`;
  const url = new URL(base);
  url.searchParams.set('unitGroup', unitGroup);
  url.searchParams.set('include', 'current');
  url.searchParams.set('key', API_KEY);

  const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!resp.ok) {
    const text = await resp.text();
    const err = new Error(`Upstream error ${resp.status}`);
    err.status = resp.status;
    err.body = text;
    throw err;
  }
  return resp.json();
}

function shapeResponse(raw) {
  const current = raw.currentConditions || {};
  return {
    resolvedAddress: raw.resolvedAddress,
    timezone: raw.timezone,
    current: {
      datetime: current.datetime,
      temp: current.temp,
      feelslike: current.feelslike,
      humidity: current.humidity,
      windspeed: current.windspeed,
      pressure: current.pressure,
      conditions: current.conditions,
      icon: current.icon
    }
  };
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${port}`);

    // Rate limit for all routes
    const rl = rateLimit(req);
    res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, rl.remaining));
    res.setHeader('X-RateLimit-Reset', rl.retryAfter);
    if (rl.limited) {
      sendJson(res, 429, { error: 'rate_limited', retry_after: rl.retryAfter });
      return;
    }

    if (url.pathname === '/') {
      sendJson(res, 200, helpPage());
      return;
    }

    if (url.pathname === '/weather') {
      const location = url.searchParams.get('location');
      const units = url.searchParams.get('units') || 'metric';
      const rawParam = url.searchParams.get('raw') || '0';
      if (!location) {
        sendJson(res, 400, { error: 'missing_location', message: 'Provide ?location=City or lat,lon' });
        return;
      }

      const cacheKey = `weather:${units}:${location.toLowerCase()}`;
      const cached = await cacheGet(cacheKey);
      if (cached) {
        sendJson(res, 200, { source: 'cache', ...cached });
        return;
      }

      try {
        const raw = await fetchWeather(location, units);
        const shaped = rawParam === '1' ? raw : shapeResponse(raw);
        await cacheSet(cacheKey, shaped, WEATHER_TTL_SECONDS);
        sendJson(res, 200, { source: 'live', ...shaped });
      } catch (err) {
        if (err.code === 'NO_API_KEY') {
          sendJson(res, 500, { error: 'missing_api_key', message: err.message });
          return;
        }
        const status = Number.isInteger(err.status) ? err.status : 502;
        sendJson(res, status, { error: 'upstream_error', message: err.message, details: err.body });
      }
      return;
    }

    sendJson(res, 404, { error: 'not_found' });
  } catch (error) {
    sendJson(res, 500, { error: 'internal_error', message: error.message });
  }
});

(async () => {
  await initRedis();
  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Weather API running on http://localhost:${port}`);
  });
})();


