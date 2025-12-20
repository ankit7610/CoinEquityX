const DEFAULT_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const CACHE_DB_NAME = 'crypto-api-cache';
const CACHE_STORE_NAME = 'responses';
const CACHE_DB_VERSION = 1;
const CACHE_KEY_PREFIX = 'crypto-api-cache';

async function fetchJson(url, fallbackValue = {}, { ttlMs, useCache = true } = {}) {
  const effectiveTtl = ttlMs ?? DEFAULT_CACHE_TTL_MS;
  const cached = useCache ? await readFromCache(url) : null;
  const now = Date.now();
  const isFresh = cached && now - cached.timestamp <= effectiveTtl;

  if (isFresh) return cached.data;

  try {
    const data = await fetchAndParse(url);
    if (useCache) await writeToCache(url, data);
    return data;
  } catch (error) {
    console.error('API fetch failed', error);
    if (cached) return cached.data; // stale fallback if network fails
    return fallbackValue;
  }
}

async function fetchAndParse(url) {
  const res = await fetch(url);
  try {
    return await res.json();
  } catch {
    return {};
  }
}

async function readFromCache(url) {
  const supportsIndexedDb = typeof indexedDB !== 'undefined';
  if (supportsIndexedDb) {
    try {
      const entry = await readFromIndexedDb(url);
      if (entry) return entry;
    } catch (error) {
      console.error('IndexedDB read failed, falling back to localStorage', error);
    }
  }
  return readFromLocalStorage(url);
}

async function writeToCache(url, data) {
  const supportsIndexedDb = typeof indexedDB !== 'undefined';
  const entry = { url, data, timestamp: Date.now() };
  if (supportsIndexedDb) {
    try {
      await writeToIndexedDb(entry);
    } catch (error) {
      console.error('IndexedDB write failed, falling back to localStorage', error);
      writeToLocalStorage(entry);
      return;
    }
  }
  writeToLocalStorage(entry);
}

function openCacheDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(CACHE_DB_NAME, CACHE_DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(CACHE_STORE_NAME)) {
        db.createObjectStore(CACHE_STORE_NAME, { keyPath: 'url' });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

async function readFromIndexedDb(url) {
  const db = await openCacheDb();
  const tx = db.transaction(CACHE_STORE_NAME, 'readonly');
  const store = tx.objectStore(CACHE_STORE_NAME);
  const request = store.get(url);
  const result = await requestToPromise(request);
  await txComplete(tx);
  return result || null;
}

async function writeToIndexedDb(entry) {
  const db = await openCacheDb();
  const tx = db.transaction(CACHE_STORE_NAME, 'readwrite');
  tx.objectStore(CACHE_STORE_NAME).put(entry);
  await txComplete(tx);
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function txComplete(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted'));
  });
}

function localStorageKey(url) {
  return `${CACHE_KEY_PREFIX}:${url}`;
}

function readFromLocalStorage(url) {
  try {
    const raw = localStorage.getItem(localStorageKey(url));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeToLocalStorage(entry) {
  try {
    localStorage.setItem(localStorageKey(entry.url), JSON.stringify(entry));
  } catch {}
}

export async function fetchListings(options = {}) {
  try {
    return await fetchJson('/api/listings', {}, options);
  } catch (error) {
    console.error(error);
    return {};
  }
}

export async function fetchCategories() {
  try {
    return await fetchJson('/api/categories?start=1');
  } catch (error) {
    console.error(error);
    return {};
  }
}

export async function fetchMap() {
  try {
    return await fetchJson('/api/map?start=1&limit=200&sort=id');
  } catch (error) {
    console.error(error);
    return {};
  }
}

export async function fetchInfo(id) {
  try {
    return await fetchJson(`/api/info?id=${id}`, null);
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function fetchQuote(id) {
  try {
    return await fetchJson(`/api/quote?id=${id}`, null);
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function fetchFxRates() {
  try {
    return await fetchJson('/api/currency/latest?base_currency=USD');
  } catch (error) {
    console.error(error);
    return {};
  }
}

export async function fetchPortfolioRemote() {
  try {
    return await fetchJson('/api/portfolio', { data: [] }, { useCache: false });
  } catch (error) {
    console.error(error);
    return { data: [] };
  }
}

export async function savePortfolioRemote(entries) {
  try {
    const res = await fetch('/api/portfolio', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entries || [])
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Save failed: ${res.status} ${text}`);
    }
    const payload = await res.json().catch(() => ({}));
    return payload.data || entries || [];
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function fetchNews() {
  try {
    return await fetchJson('/api/news?countries=us&filter_entities=true&limit=10', { data: [] });
  } catch (error) {
    console.error(error);
    return { data: [] };
  }
}
