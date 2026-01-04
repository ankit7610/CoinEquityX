const fs = require('fs');
const path = require('path');
const http = require('http');
const { MongoClient, ServerApiVersion } = require('mongodb');

const CMC_BASE_URL = 'https://pro-api.coinmarketcap.com';
const FX_BASE_URL = 'https://api.freecurrencyapi.com/v1';
const NEWS_BASE_URL = 'https://api.marketaux.com/v1';
const publicDir = path.join(__dirname, '..', 'frontend');

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function createAppServer(options = {}) {
  const env = options.env || process.env;
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  loadEnv(env);

  const CMC_API_KEY = env.CMC_API_KEY || '';
  const FX_API_KEY = env.FREE_CURRENCY_API_KEY || env.FCA_API_KEY || '';
  const NEWS_API_KEY = env.MARKETAUX_API_KEY || '';
  const FINNHUB_API_KEY = env.FINNHUB_API_KEY || '';
  const GEMINI_API_KEY = env.GEMINI_API_KEY || '';
  const GEMINI_MODEL = env.GEMINI_MODEL || 'gemini-2.5-flash';
  const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
  const DEFAULT_CURRENCY = env.DEFAULT_CURRENCY || 'INR';
  const rateLimit = Number(env.RATE_LIMIT || 1000);
  const rateWindowMs = Number(env.RATE_LIMIT_WINDOW_MS || 24 * 60 * 60 * 1000); // 24 hours
  const allowRequest = createRateLimiter({ limit: rateLimit, windowMs: rateWindowMs });

  // In-memory cache for API responses
  const apiCache = new Map();
  const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours for stock data
  const mongoConfig = {
    uri: env.MONGODB_URI,
    db: env.MONGODB_DB || 'crypto',
    collection: env.MONGODB_COLLECTION || 'portfolio',
    stockCollection: 'stock_portfolio'
  };

  if (!CMC_API_KEY) {
    console.warn('Warning: CMC_API_KEY is not set. Set it in .env or your shell before starting the server.');
  }

  const server = http.createServer(async (req, res) => {
    if (req.method === 'OPTIONS') {
      res.writeHead(200, corsHeaders());
      return res.end();
    }

    if (req.url.startsWith('/api/')) {
      const ip = (req.socket && req.socket.remoteAddress) || 'unknown';
      const allowed = allowRequest(ip);
      if (!allowed.allowed) {
        res.writeHead(429, {
          ...corsHeaders(),
          'Retry-After': String(allowed.retryAfterSeconds),
          'Content-Type': 'application/json'
        });
        res.end(JSON.stringify({ error: 'Rate limit exceeded', retryAfterSeconds: allowed.retryAfterSeconds }));
        return;
      }
      return handleApi(req, res);
    }

    return serveStatic(req, res);
  });

  async function handleApi(req, res) {
    const requestUrl = new URL(req.url, `http://${req.headers.host}`);

    try {
      switch (requestUrl.pathname) {
        case '/api/news': {
          if (!NEWS_API_KEY) return sendJson(res, 500, { error: 'MARKETAUX_API_KEY missing on server' });
          const qs = requestUrl.searchParams.toString();
          const newsUrl = `${NEWS_BASE_URL}/news/all?${qs ? `${qs}&` : ''}api_token=${encodeURIComponent(NEWS_API_KEY)}`;
          const data = await fetchPassthrough(newsUrl, {}, fetchImpl);
          return sendJson(res, data.statusCode, data.body);
        }
        case '/api/portfolio': {
          if (!mongoConfig.uri) {
            return sendJson(res, 501, { error: 'Portfolio storage not configured (MONGODB_URI missing)' });
          }
          const userId = req.headers['x-user-id'] || 'default';
          if (req.method === 'GET') {
            const entries = await readPortfolio(mongoConfig, userId);
            return sendJson(res, 200, { data: entries });
          }
          if (req.method === 'PUT') {
            const body = await readJsonBody(req);
            if (!Array.isArray(body)) return sendJson(res, 400, { error: 'Body must be an array of portfolio entries' });
            const normalized = body.map((entry) => normalizeEntry(entry, DEFAULT_CURRENCY));
            const saved = await writePortfolio(mongoConfig, normalized, userId);
            return sendJson(res, 200, { data: saved });
          }
          return sendJson(res, 405, { error: 'Method Not Allowed' });
        }
        case '/api/chat': {
          if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method Not Allowed' });
          if (!GEMINI_API_KEY) return sendJson(res, 500, { error: 'GEMINI_API_KEY missing on server' });

          const body = await readJsonBody(req);
          const message = typeof body?.message === 'string' ? body.message.trim() : '';
          if (!message) return sendJson(res, 400, { error: 'Missing message' });
          if (message.length > 4000) return sendJson(res, 413, { error: 'Message too long' });

          const systemPrompt = `You are a helpful assistant for Crypto Pulse, a comprehensive cryptocurrency and stock market dashboard. 

DASHBOARD FEATURES:
- Real-time cryptocurrency prices, market cap, and 24h/7d/30d changes for top 100 coins
- Stock market data with real-time quotes and financial news
- Dual portfolio system for tracking both crypto and stock holdings
- Category explorer for browsing crypto by type (Layer 1, DeFi, Stablecoins, etc.)
- Latest crypto and stock news with curated content
- Multi-currency support (USD, EUR, GBP, INR, etc.)
- Light/Dark mode toggle
- User authentication with Firebase (email, Google, GitHub)
- User profiles with personal info and preferences

HOW TO USE THE DASHBOARD:
- Navigate using tabs at the top: Dashboard, Categories, News, Portfolio, Profile
- Search for specific cryptocurrencies or stocks using the search bar
- Click on any coin/stock to view detailed information
- Add holdings to portfolio by clicking "Add to Portfolio" buttons
- View portfolio analytics including gains/losses and holdings breakdown
- Switch currencies using the currency selector in the top bar
- Toggle dark/light mode using the theme button
- Access this AI chat anytime via the floating button in the bottom-right

RESPONSE GUIDELINES:
- Keep responses concise: 2-3 sentences for simple queries, up to 5 sentences for complex ones
- Use plain text only - NO markdown formatting, NO asterisks, NO bold/italic symbols
- Be helpful and friendly
- When asked about features, briefly explain what they do and how to access them
- For market questions, acknowledge you can provide general info but recommend checking the live dashboard data
- If asked about specific prices, remind users to check the real-time data on the dashboard`;

          const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`;
          const upstream = await fetchImpl(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-goog-api-key': GEMINI_API_KEY
            },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: systemPrompt }]
              },
              contents: [
                {
                  parts: [{ text: message }]
                }
              ]
            })
          });

          const json = await upstream.json().catch(() => ({}));
          if (!upstream.ok) {
            const detail = json?.error?.message || json?.error || json;
            return sendJson(res, upstream.status, { error: 'Upstream error', detail });
          }

          const parts = json?.candidates?.[0]?.content?.parts;
          let text = Array.isArray(parts) ? parts.map((p) => p?.text).filter(Boolean).join('') : '';

          // Clean up markdown formatting
          text = cleanMarkdownFormatting(text);

          return sendJson(res, 200, { text: text || '' });
        }
        case '/api/listings': {
          if (!CMC_API_KEY) return sendJson(res, 500, { error: 'CMC_API_KEY missing on server' });
          const searchParams = new URLSearchParams({
            start: '1',
            limit: '100',
            sort: 'market_cap',
            cryptocurrency_type: 'all',
            tag: 'all'
          });
          for (const [key, value] of requestUrl.searchParams.entries()) {
            searchParams.set(key, value);
          }
          const cmcUrl = `${CMC_BASE_URL}/v1/cryptocurrency/listings/latest?${searchParams.toString()}`;
          return proxy(res, cmcUrl);
        }
        case '/api/info': {
          if (!CMC_API_KEY) return sendJson(res, 500, { error: 'CMC_API_KEY missing on server' });
          const id = requestUrl.searchParams.get('id');
          if (!id) return sendJson(res, 400, { error: 'Missing required id parameter' });
          const cmcUrl = `${CMC_BASE_URL}/v2/cryptocurrency/info?id=${encodeURIComponent(id)}`;
          return proxy(res, cmcUrl);
        }
        case '/api/quote': {
          if (!CMC_API_KEY) return sendJson(res, 500, { error: 'CMC_API_KEY missing on server' });
          const id = requestUrl.searchParams.get('id');
          if (!id) return sendJson(res, 400, { error: 'Missing required id parameter' });
          const cmcUrl = `${CMC_BASE_URL}/v1/cryptocurrency/quotes/latest?id=${encodeURIComponent(id)}`;
          return proxy(res, cmcUrl);
        }
        case '/api/categories': {
          if (!CMC_API_KEY) return sendJson(res, 500, { error: 'CMC_API_KEY missing on server' });
          const cmcUrl = `${CMC_BASE_URL}/v1/cryptocurrency/categories?${requestUrl.searchParams.toString()}`;
          return proxy(res, cmcUrl);
        }
        case '/api/map': {
          if (!CMC_API_KEY) return sendJson(res, 500, { error: 'CMC_API_KEY missing on server' });
          const cmcUrl = `${CMC_BASE_URL}/v1/cryptocurrency/map?${requestUrl.searchParams.toString()}`;
          return proxy(res, cmcUrl);
        }
        case '/api/exchange-info': {
          if (!CMC_API_KEY) return sendJson(res, 500, { error: 'CMC_API_KEY missing on server' });
          const cmcUrl = `${CMC_BASE_URL}/v1/exchange/info?${requestUrl.searchParams.toString()}`;
          return proxy(res, cmcUrl);
        }
        case '/api/feargreed/latest': {
          if (!CMC_API_KEY) return sendJson(res, 500, { error: 'CMC_API_KEY missing on server' });
          const cmcUrl = `${CMC_BASE_URL}/v3/fear-and-greed/latest`;
          return proxy(res, cmcUrl);
        }
        case '/api/feargreed/historical': {
          if (!CMC_API_KEY) return sendJson(res, 500, { error: 'CMC_API_KEY missing on server' });
          const cmcUrl = `${CMC_BASE_URL}/v3/fear-and-greed/historical?${requestUrl.searchParams.toString()}`;
          return proxy(res, cmcUrl);
        }
        case '/api/currency/latest': {
          if (!FX_API_KEY) return sendJson(res, 500, { error: 'FREE_CURRENCY_API_KEY missing on server' });
          const qs = requestUrl.searchParams.toString();
          const fxUrl = `${FX_BASE_URL}/latest?apikey=${encodeURIComponent(FX_API_KEY)}${qs ? `&${qs}` : ''}`;
          return proxy(res, fxUrl);
        }
        // Stock API endpoints (with caching)
        case '/api/stock/symbols': {
          if (!FINNHUB_API_KEY) return sendJson(res, 500, { error: 'FINNHUB_API_KEY missing on server' });
          const exchange = requestUrl.searchParams.get('exchange') || 'US';
          const cacheKey = `stock_symbols_${exchange}`;
          const cached = getCached(cacheKey);
          if (cached) return sendJson(res, 200, cached);

          const finnhubUrl = `${FINNHUB_BASE_URL}/stock/symbol?exchange=${exchange}&token=${FINNHUB_API_KEY}`;
          const data = await fetchPassthrough(finnhubUrl, {}, fetchImpl);
          if (data.statusCode === 200) setCache(cacheKey, data.body);
          return sendJson(res, data.statusCode, data.body);
        }
        case '/api/stock/search': {
          if (!FINNHUB_API_KEY) return sendJson(res, 500, { error: 'FINNHUB_API_KEY missing on server' });
          const query = requestUrl.searchParams.get('q');
          if (!query) return sendJson(res, 400, { error: 'Missing query parameter' });
          const cacheKey = `stock_search_${query}`;
          const cached = getCached(cacheKey);
          if (cached) return sendJson(res, 200, cached);

          const finnhubUrl = `${FINNHUB_BASE_URL}/search?q=${encodeURIComponent(query)}&token=${FINNHUB_API_KEY}`;
          const data = await fetchPassthrough(finnhubUrl, {}, fetchImpl);
          const result = data.body.result || [];
          if (data.statusCode === 200) setCache(cacheKey, result);
          return sendJson(res, 200, result);
        }
        case '/api/stock/news': {
          if (!FINNHUB_API_KEY) return sendJson(res, 500, { error: 'FINNHUB_API_KEY missing on server' });
          const cacheKey = 'stock_news_general';
          const cached = getCached(cacheKey);
          if (cached) return sendJson(res, 200, cached);

          const finnhubUrl = `${FINNHUB_BASE_URL}/news?category=general&token=${FINNHUB_API_KEY}`;
          const data = await fetchPassthrough(finnhubUrl, {}, fetchImpl);
          if (data.statusCode === 200) setCache(cacheKey, data.body);
          return sendJson(res, data.statusCode, data.body);
        }
        case '/api/stock/quote': {
          if (!FINNHUB_API_KEY) return sendJson(res, 500, { error: 'FINNHUB_API_KEY missing on server' });
          const symbol = requestUrl.searchParams.get('symbol');
          if (!symbol) return sendJson(res, 400, { error: 'Missing symbol parameter' });
          const cacheKey = `stock_quote_${symbol}`;
          const cached = getCached(cacheKey);
          if (cached) return sendJson(res, 200, cached);

          const finnhubUrl = `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`;
          const data = await fetchPassthrough(finnhubUrl, {}, fetchImpl);
          if (data.statusCode === 200) setCache(cacheKey, data.body);
          return sendJson(res, data.statusCode, data.body);
        }
        case '/api/stock/metric': {
          if (!FINNHUB_API_KEY) return sendJson(res, 500, { error: 'FINNHUB_API_KEY missing on server' });
          const symbol = requestUrl.searchParams.get('symbol');
          if (!symbol) return sendJson(res, 400, { error: 'Missing symbol parameter' });
          const cacheKey = `stock_metric_${symbol}`;
          const cached = getCached(cacheKey);
          if (cached) return sendJson(res, 200, cached);

          const finnhubUrl = `${FINNHUB_BASE_URL}/stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all&token=${FINNHUB_API_KEY}`;
          const data = await fetchPassthrough(finnhubUrl, {}, fetchImpl);
          if (data.statusCode === 200) setCache(cacheKey, data.body);
          return sendJson(res, data.statusCode, data.body);
        }
        case '/api/stock/portfolio': {
          if (!mongoConfig.uri) {
            return sendJson(res, 501, { error: 'Portfolio storage not configured (MONGODB_URI missing)' });
          }
          const userId = req.headers['x-user-id'] || 'default';
          if (req.method === 'GET') {
            const entries = await readStockPortfolio(mongoConfig, userId);
            return sendJson(res, 200, { data: entries });
          }
          if (req.method === 'PUT') {
            const body = await readJsonBody(req);
            if (!Array.isArray(body)) return sendJson(res, 400, { error: 'Body must be an array of portfolio entries' });
            const normalized = body.map((entry) => normalizeStockEntry(entry, DEFAULT_CURRENCY));
            const saved = await writeStockPortfolio(mongoConfig, normalized, userId);
            return sendJson(res, 200, { data: saved });
          }
          return sendJson(res, 405, { error: 'Method Not Allowed' });
        }
        default:
          return sendJson(res, 404, { error: 'Not Found' });
      }
    } catch (err) {
      console.error(err);
      return sendJson(res, 500, { error: 'Server error', detail: err.message });
    }
  }

  function getCached(key) {
    const cached = apiCache.get(key);
    if (!cached) return null;
    if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
      apiCache.delete(key);
      return null;
    }
    return cached.data;
  }

  function setCache(key, data) {
    apiCache.set(key, { data, timestamp: Date.now() });
  }

  async function fetchCoinMarketCap(url) {
    const response = await fetchImpl(url, {
      headers: {
        'X-CMC_PRO_API_KEY': CMC_API_KEY,
        'Accept': 'application/json'
      }
    });

    const body = await response.json().catch(() => ({}));
    return { statusCode: response.status, body };
  }

  async function proxy(res, url) {
    const data = await fetchCoinMarketCap(url);
    return sendJson(res, data.statusCode, data.body);
  }

  return server;
}

async function fetchPassthrough(url, headers = {}, fetchFn = globalThis.fetch) {
  const response = await fetchFn(url, { headers: { Accept: 'application/json', ...headers } });
  const body = await response.json().catch(() => ({}));
  return { statusCode: response.status, body };
}

function serveStatic(req, res) {
  const safePath = sanitizePath(req.url);
  const filePath = path.join(publicDir, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err) {
      if (safePath === 'index.html' || req.url === '/') {
        return send404(res);
      }
      const indexPath = path.join(publicDir, 'index.html');
      return fs.createReadStream(indexPath).pipe(res);
    }

    if (stats.isDirectory()) {
      return serveFile(path.join(filePath, 'index.html'), res);
    }

    return serveFile(filePath, res);
  });
}

function serveFile(filePath, res) {
  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.createReadStream(filePath)
    .on('open', () => {
      res.writeHead(200, { 'Content-Type': contentType });
    })
    .on('error', () => send404(res))
    .pipe(res);
}

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, {
    ...corsHeaders(),
    'Content-Type': 'application/json'
  });
  res.end(JSON.stringify(body));
}

function send404(res) {
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404 Not Found');
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS,PUT,POST,DELETE',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-ID, X-User-Id'
  };
}

function cleanMarkdownFormatting(text) {
  if (!text) return text;

  // Remove markdown bold/italic asterisks and underscores
  let cleaned = text.replace(/\*\*\*(.+?)\*\*\*/g, '$1'); // Bold+italic
  cleaned = cleaned.replace(/\*\*(.+?)\*\*/g, '$1'); // Bold
  cleaned = cleaned.replace(/\*(.+?)\*/g, '$1'); // Italic
  cleaned = cleaned.replace(/___(.+?)___/g, '$1'); // Bold+italic
  cleaned = cleaned.replace(/__(.+?)__/g, '$1'); // Bold
  cleaned = cleaned.replace(/_(.+?)_/g, '$1'); // Italic

  // Remove markdown headers (## Header -> Header)
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');

  // Remove markdown code blocks (```code``` -> code)
  cleaned = cleaned.replace(/```[\s\S]*?```/g, (match) => {
    return match.replace(/```\w*\n?/g, '').replace(/```/g, '');
  });

  // Remove inline code backticks (`code` -> code)
  cleaned = cleaned.replace(/`(.+?)`/g, '$1');

  return cleaned;
}

function sanitizePath(requestPath) {
  const pathname = requestPath.split('?')[0];
  const resolvedPath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '');
  return resolvedPath === '/' ? 'index.html' : resolvedPath.slice(1);
}

function loadEnv(env = process.env) {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = trimmed.split('=');
    if (key && rest.length) {
      const value = rest.join('=');
      if (env[key] === undefined) {
        env[key] = value;
      }
    }
  }
}

async function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1e6) {
        req.connection.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function normalizeEntry(entry, defaultCurrency = 'INR') {
  const quantity = Number(entry.quantity ?? 0);
  return {
    id: String(entry.id ?? ''),
    name: String(entry.name ?? ''),
    symbol: String(entry.symbol ?? ''),
    quantity,
    cost: entry.cost === null || entry.cost === undefined || Number.isNaN(Number(entry.cost))
      ? null
      : Number(entry.cost),
    costUsd: entry.costUsd === null || entry.costUsd === undefined || Number.isNaN(Number(entry.costUsd))
      ? null
      : Number(entry.costUsd),
    costCurrency: entry.costCurrency ? String(entry.costCurrency) : defaultCurrency
  };
}

let mongoClientPromise = null;
function getMongoClient(uri) {
  if (!mongoClientPromise) {
    const client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true
      }
    });
    mongoClientPromise = client.connect().then(() => client);
  }
  return mongoClientPromise;
}

async function getPortfolioCollection(config) {
  const client = await getMongoClient(config.uri);
  const db = client.db(config.db);
  return db.collection(config.collection);
}

async function readPortfolio(config, userId) {
  const collection = await getPortfolioCollection(config);
  const doc = await collection.findOne({ _id: userId });
  return doc?.entries || [];
}

async function writePortfolio(config, entries, userId) {
  const collection = await getPortfolioCollection(config);
  await collection.updateOne(
    { _id: userId },
    { $set: { entries, updatedAt: new Date() } },
    { upsert: true }
  );
  return entries;
}

function normalizeStockEntry(entry, defaultCurrency = 'USD') {
  const quantity = Number(entry.quantity ?? 0);
  return {
    id: String(entry.symbol ?? entry.id ?? ''),
    symbol: String(entry.symbol ?? ''),
    name: String(entry.name ?? entry.description ?? ''),
    quantity,
    cost: entry.cost === null || entry.cost === undefined || Number.isNaN(Number(entry.cost))
      ? null
      : Number(entry.cost),
    costUsd: entry.costUsd === null || entry.costUsd === undefined || Number.isNaN(Number(entry.costUsd))
      ? null
      : Number(entry.costUsd),
    costCurrency: entry.costCurrency ? String(entry.costCurrency) : defaultCurrency
  };
}

async function readStockPortfolio(config, userId) {
  const client = await getMongoClient(config.uri);
  const db = client.db(config.db);
  const collection = db.collection(config.stockCollection);
  const doc = await collection.findOne({ _id: userId });
  return doc?.entries || [];
}

async function writeStockPortfolio(config, entries, userId) {
  const client = await getMongoClient(config.uri);
  const db = client.db(config.db);
  const collection = db.collection(config.stockCollection);
  await collection.updateOne(
    { _id: userId },
    { $set: { entries, updatedAt: new Date() } },
    { upsert: true }
  );
  return entries;
}

async function closeMongoClient() {
  if (mongoClientPromise) {
    const client = await mongoClientPromise;
    await client.close();
    mongoClientPromise = null;
  }
}

function createRateLimiter({ limit = 60, windowMs = 10 * 60 * 1000 } = {}) {
  const buckets = new Map();
  return (ip) => {
    const now = Date.now();
    const bucket = buckets.get(ip) || { tokens: limit, last: now };
    const elapsed = now - bucket.last;
    const refill = (elapsed / windowMs) * limit;
    bucket.tokens = Math.min(limit, bucket.tokens + refill);
    bucket.last = now;
    if (bucket.tokens < 1) {
      const retryAfterMs = Math.ceil(((1 - bucket.tokens) / limit) * windowMs);
      const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
      buckets.set(ip, bucket);
      return { allowed: false, retryAfterSeconds };
    }
    bucket.tokens -= 1;
    buckets.set(ip, bucket);
    return { allowed: true, retryAfterSeconds: 0 };
  };
}

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  const server = createAppServer();
  server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = { createAppServer, sanitizePath, closeMongoClient };
