const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { createAppServer, closeMongoClient } = require('../server');

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}

function createMockFetch() {
  return async (url) => {
    const target = url.toString();
    if (target.includes('/cryptocurrency/listings/latest')) return jsonResponse({ data: [] });
    if (target.includes('/cryptocurrency/categories')) return jsonResponse({ data: [] });
    if (target.includes('/news/all')) return jsonResponse({ data: [] });
    if (target.includes('/latest?apikey=')) return jsonResponse({ data: { USD: 1 } });
    return jsonResponse({ error: 'unhandled ' + target }, 404);
  };
}

async function startServer(envOverrides = {}) {
  const server = createAppServer({
    env: {
      CMC_API_KEY: 'test-key',
      FREE_CURRENCY_API_KEY: 'fx-key',
      MARKETAUX_API_KEY: 'news-key',
      RATE_LIMIT: 2,
      RATE_LIMIT_WINDOW_MS: 1000,
      ...envOverrides
    },
    fetchImpl: createMockFetch()
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject);
      resolve();
    });
  });
  const port = server.address().port;
  return { server, base: `http://127.0.0.1:${port}` };
}

let ctx;
beforeEach(async () => {
  ctx = await startServer();
});

afterEach(async () => {
  ctx?.server?.close();
  await closeMongoClient();
});

test('rate limiter returns 429 after limit exceeded', async () => {
  // First two requests allowed
  let res = await fetch(`${ctx.base}/api/listings`);
  assert.equal(res.status, 200);
  res = await fetch(`${ctx.base}/api/categories`);
  assert.equal(res.status, 200);

  // Third within window should 429
  res = await fetch(`${ctx.base}/api/news`);
  assert.equal(res.status, 429);
  const body = await res.json();
  assert.equal(body.error, 'Rate limit exceeded');
});

test('portfolio endpoint responds based on Mongo config', async () => {
  const res = await fetch(`${ctx.base}/api/portfolio`);
  const body = await res.json();
  if (res.status === 501) {
    assert.match(body.error, /not configured/i);
  } else {
    // In environments with a real MONGODB_URI configured, expect a data wrapper
    assert.equal(res.status, 200);
    assert.ok(body.data !== undefined);
  }
});
