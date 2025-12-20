const initialState = {
  coins: [],
  categories: [],
  mapList: [],
  news: [],
  portfolio: [],
  view: 'dashboard-view',
  selectedCoinId: null,
  detailRange: '24h',
  theme: 'light',
  sort: 'market_cap_desc',
  category: 'all',
  currency: loadCurrency(),
  searchTerm: '',
  fxRates: { USD: 1 },
  fxLoaded: false
};

export function createModel() {
  const state = {
    ...initialState,
    theme: loadTheme()
  };
  const storage = createPortfolioStorage();

  return {
    state,
    async hydratePortfolio() {
      state.portfolio = await storage.load();
    },
    setView(view) {
      state.view = view;
    },
    setCategory(category) {
      state.category = category;
    },
    setSearchTerm(term) {
      state.searchTerm = term;
    },
    setSort(sort) {
      state.sort = sort;
    },
    setCurrency(currency) {
      state.currency = currency;
      saveCurrency(currency);
    },
    setTheme(theme) {
      state.theme = theme;
      saveTheme(theme);
    },
    setDetailRange(range) {
      state.detailRange = range;
    },
    setSelectedCoin(id) {
      state.selectedCoinId = id;
    },
    setCoins(coins) {
      state.coins = coins;
    },
    setCategories(categories) {
      state.categories = categories;
    },
    setNews(items) {
      state.news = items;
    },
    setMapList(mapList) {
      state.mapList = mapList;
    },
    setFxRates(rates) {
      state.fxRates = { ...state.fxRates, ...rates };
      state.fxLoaded = true;
    },
    async addPortfolioEntry(entry) {
      const id = String(entry.id);
      const existing = state.portfolio.find((i) => String(i.id) === id);
      if (existing) {
        existing.name = entry.name;
        existing.symbol = entry.symbol;
        if (entry.quantity) existing.quantity = entry.quantity;
        if (entry.cost !== null) existing.cost = entry.cost;
        if (entry.costUsd !== undefined) existing.costUsd = entry.costUsd;
        if (entry.costCurrency) existing.costCurrency = entry.costCurrency;
      } else {
        state.portfolio.push({ ...entry, id });
      }
      await storage.saveAll(state.portfolio);
    },
    async updatePortfolioEntry(id, data) {
      const normalizedId = String(id);
      state.portfolio = state.portfolio.map((i) => (String(i.id) === normalizedId ? { ...i, ...data, id: normalizedId } : i));
      await storage.saveAll(state.portfolio);
    },
    async removePortfolioEntry(id) {
      const normalizedId = String(id);
      state.portfolio = state.portfolio.filter((i) => String(i.id) !== normalizedId);
      await storage.saveAll(state.portfolio);
    },
    findCoin(query) {
      const cleaned = query.trim();
      const lower = cleaned.toLowerCase();
      const symbolMatch = cleaned.match(/\(([^)]+)\)/);
      const symbol = symbolMatch ? symbolMatch[1].toUpperCase() : cleaned.toUpperCase();
      const match = (list) => list.find(
        (coin) => coin.symbol?.toUpperCase() === symbol ||
          coin.name?.toLowerCase() === lower ||
          coin.name?.toLowerCase().includes(lower)
      );
      const found = match(state.coins) || match(state.mapList);
      if (found) return found;
      return { id: symbol, symbol, name: cleaned };
    }
  };
}

function loadTheme() {
  try {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {}
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function saveTheme(theme) {
  try {
    localStorage.setItem('theme', theme);
  } catch {}
}

function loadCurrency() {
  try {
    const saved = localStorage.getItem('currency');
    if (saved) return saved;
  } catch {}
  return 'INR';
}

function saveCurrency(code) {
  try {
    localStorage.setItem('currency', code);
  } catch {}
}

function createPortfolioStorage() {
  const key = 'crypto-portfolio';
  const supportsIndexedDb = typeof indexedDB !== 'undefined';
  let remoteEnabled = true;
  const defaultCurrency = loadCurrency();

  return {
    async load() {
      // Try remote first
      if (remoteEnabled) {
        const remote = await loadPortfolioRemote();
        if (remote.ok) {
          if (remote.data && remote.data.length) {
            const normalized = remote.data.map((entry) => ({
              ...entry,
              costCurrency: entry.costCurrency || defaultCurrency
            }));
            savePortfolioToLocalStorage(key, normalized); // keep backup
            return normalized;
          }
          // If remote empty but local has data, seed remote
          const localEntries = loadPortfolioFromLocalStorage(key);
          if (localEntries.length) {
            await savePortfolioRemote(localEntries);
            return localEntries;
          }
          return [];
        }
        // disable remote if not configured
        if (remote.status === 501) remoteEnabled = false;
      }

      // Fallback to IndexedDB/local
      if (!supportsIndexedDb) return loadPortfolioFromLocalStorage(key);
      try {
        const entries = await loadPortfolioFromIndexedDb();
        return entries;
      } catch (error) {
        console.error('IndexedDB load failed, falling back to localStorage', error);
        return loadPortfolioFromLocalStorage(key);
      }
    },
    async saveAll(entries) {
      const normalized = entries.map((entry) => ({
        ...entry,
        costCurrency: entry.costCurrency || defaultCurrency
      }));
      if (remoteEnabled) {
        const saved = await savePortfolioRemote(normalized);
        if (saved) {
          savePortfolioToLocalStorage(key, saved); // backup
          return;
        }
      }
      if (!supportsIndexedDb) return savePortfolioToLocalStorage(key, normalized);
      try {
        await savePortfolioToIndexedDb(normalized);
        savePortfolioToLocalStorage(key, normalized); // keep a lightweight backup
      } catch (error) {
        console.error('IndexedDB save failed, falling back to localStorage', error);
        savePortfolioToLocalStorage(key, normalized);
      }
    }
  };
}

const DB_NAME = 'crypto-portfolio-db';
const DB_VERSION = 1;
const STORE_NAME = 'portfolio';

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

async function loadPortfolioFromIndexedDb() {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const request = store.getAll();
  const result = await requestToPromise(request);
  await transactionComplete(tx);
  return result || [];
}

async function savePortfolioToIndexedDb(entries) {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  store.clear();
  entries.forEach((entry) => {
    store.put({ ...entry, id: String(entry.id) });
  });
  await transactionComplete(tx);
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionComplete(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted'));
  });
}

function loadPortfolioFromLocalStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePortfolioToLocalStorage(key, entries) {
  try {
    localStorage.setItem(key, JSON.stringify(entries));
  } catch {}
}

async function loadPortfolioRemote() {
  try {
    const res = await fetch('/api/portfolio');
    if (res.status === 501) return { ok: false, status: 501 };
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const payload = await res.json().catch(() => ({}));
    return { ok: true, data: payload.data || [] };
  } catch (error) {
    console.error('portfolio remote load failed', error);
    return { ok: false };
  }
}

async function savePortfolioRemote(entries) {
  try {
    const res = await fetch('/api/portfolio', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entries || [])
    });
    if (res.status === 501) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const payload = await res.json().catch(() => ({}));
    return payload.data || entries || [];
  } catch (error) {
    console.error('portfolio remote save failed', error);
    return null;
  }
}
