import { createModel } from './model.js';
import { createView } from './view.js';
import * as api from './api.js';
import {
  sortCoins,
  getCategory,
  formatCurrency,
  formatNumber,
  formatChange,
  sanitizeDescription,
  extractLinks,
  buildSeries,
  drawSeries,
  drawMiniSparkline,
  pickCoinFromPayload
} from './utils.mjs';

export function createViewModel() {
  return new ViewModel();
}

class ViewModel {
  constructor() {
    this.model = createModel();
    this.view = createView();
    this.detailContext = null;
    this.currentPage = 1;
    this.itemsPerPage = 12;
  }

  async init() {
    const { state } = this.model;
    this.bindEvents();
    this.view.applyTheme(state.theme);
    this.view.populateCurrencyOptions(state.fxRates, state.currency);
    if (this.view.el.sort) this.view.el.sort.value = state.sort;
    if (this.view.el.currencySelect) this.view.el.currencySelect.value = state.currency;
    this.view.setActiveView(state.view);
    this.view.setActiveCategory(state.category);
    await this.model.hydratePortfolio();
    await this.ensureFxRates(true);
    this.view.populateCurrencyOptions(this.model.state.fxRates, this.model.state.currency);
    this.renderPortfolio();
    await this.fetchAll();
  }

  bindEvents() {
    const { el } = this.view;
    el.tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const viewId = tab.dataset.view;
        this.model.setView(viewId);
        this.view.setActiveView(viewId);
      });
    });
    if (el.backDashboard) {
      el.backDashboard.addEventListener('click', () => {
        this.model.setView('dashboard-view');
        this.view.setActiveView('dashboard-view');
      });
    }
    if (el.search) {
      el.search.addEventListener('input', (event) => {
        this.model.setSearchTerm(event.target.value);
        this.currentPage = 1;
        this.renderCoins();
      });
    }
    if (el.sort) {
      el.sort.addEventListener('change', (event) => {
        this.model.setSort(event.target.value);
        this.currentPage = 1;
        this.renderCoins();
      });
    }
    if (el.currencySelect) {
      el.currencySelect.addEventListener('change', async (event) => {
        this.model.setCurrency(event.target.value);
        await this.ensureFxRates();
        this.view.populateCurrencyOptions(this.model.state.fxRates, this.model.state.currency);
        this.renderCoins();
        this.renderPortfolio();
        if (this.detailContext) this.renderDetail(this.detailContext.coin, this.detailContext.info);
      });
    }
    if (el.refresh) {
      el.refresh.addEventListener('click', () => this.refreshListings(true));
    }
    el.filterChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        this.model.setCategory(chip.dataset.category);
        this.view.setActiveCategory(chip.dataset.category);
        this.currentPage = 1;
        this.renderCoins();
      });
    });
    if (el.prevBtn) {
      el.prevBtn.addEventListener('click', () => {
        if (this.currentPage > 1) {
          this.currentPage--;
          this.renderCoins();
        }
      });
    }
    if (el.nextBtn) {
      el.nextBtn.addEventListener('click', () => {
        const coins = this.getFilteredCoins();
        const totalPages = Math.ceil(coins.length / this.itemsPerPage);
        if (this.currentPage < totalPages) {
          this.currentPage++;
          this.renderCoins();
        }
      });
    }
    if (el.themeToggle) {
      el.themeToggle.addEventListener('click', () => {
        const next = this.model.state.theme === 'dark' ? 'light' : 'dark';
        this.model.setTheme(next);
        this.view.applyTheme(next);
      });
    }
    if (el.portfolioForm) {
      el.portfolioForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        await this.handlePortfolioSubmit();
      });
    }
    if (el.resetFormBtn) {
      el.resetFormBtn.addEventListener('click', () => this.view.clearForm());
    }
  }

  async fetchAll() {
    this.view.renderSkeletonRows();
    await Promise.all([this.refreshListings(), this.refreshCategories(), this.refreshMap(), this.refreshNews()]);
    await this.ensureFxRates(true);
    this.view.populateCurrencyOptions(this.model.state.fxRates, this.model.state.currency);
    this.renderPortfolio();
  }

  async refreshListings(force = false) {
    const ttlMs = force ? 60 * 1000 : undefined;
    const payload = await api.fetchListings({ ttlMs });
    const errCode = payload?.status?.error_code;
    const errMsg = errCode && errCode !== 0 ? (payload?.status?.error_message || 'API error') : null;
    this.model.setCoins(payload.data || []);
    this.renderCoins(errMsg ? { errorMessage: `Failed to refresh: ${errMsg}` } : undefined);
    // Refresh portfolio to update current prices when coin data changes
    this.renderPortfolio();
    if (force) this.view.pulseRefresh();
  }

  async refreshCategories() {
    const payload = await api.fetchCategories();
    this.model.setCategories(payload.data || []);
    this.renderCategories();
  }

  async refreshNews() {
    const payload = await api.fetchNews();
    this.model.setNews(payload.data || []);
    this.view.renderNews(this.model.state.news);
  }

  async refreshMap() {
    const payload = await api.fetchMap();
    this.model.setMapList(payload.data || []);
    this.view.renderCoinOptions(this.model.state.coins, this.model.state.mapList);
  }

  async ensureFxRates(force = false) {
    const { state } = this.model;
    if (!force && state.fxLoaded && state.fxRates[state.currency]) return;
    const payload = await api.fetchFxRates();
    const data = payload.data || payload.rates || {};
    if (Object.keys(data).length) {
      this.model.setFxRates(data);
    }
  }

  renderCoins(options) {
    const helpers = this.getHelpers();
    const coins = this.getFilteredCoins();
    const totalPages = Math.ceil(coins.length / this.itemsPerPage);
    const startIdx = (this.currentPage - 1) * this.itemsPerPage;
    const endIdx = startIdx + this.itemsPerPage;
    const paginatedCoins = coins.slice(startIdx, endIdx);
    
    this.view.renderCoins(paginatedCoins, helpers, {
      onAddPortfolio: async (coin) => {
        await this.model.addPortfolioEntry({ id: coin.id, symbol: coin.symbol, name: coin.name, quantity: 0, cost: null });
        this.renderPortfolio();
        alert(`${coin.name} added. Set quantity in Portfolio.`);
      },
      onOpenDetail: (id) => this.openDetail(id)
    }, options);
    this.view.renderCoinOptions(this.model.state.coins, this.model.state.mapList);
    this.view.updatePagination(this.currentPage, totalPages, coins.length);
  }

  renderCategories() {
    const helpers = this.getHelpers();
    this.view.renderCategories(this.model.state.categories, helpers, {
      onOpenCategory: (name) => {
        this.model.setSearchTerm(name);
        if (this.view.el.search) this.view.el.search.value = name;
        this.model.setView('dashboard-view');
        this.view.setActiveView('dashboard-view');
        this.renderCoins();
      }
    });
  }

  renderNews() {
    this.view.renderNews(this.model.state.news);
  }

  renderPortfolio() {
    const helpers = this.getHelpers();
    this.view.renderPortfolio(this.model.state.portfolio, this.model.state.coins, helpers, {
      onEdit: (entry) => {
        this.view.el.editIdInput.value = entry.id;
        this.view.el.coinInput.value = `${entry.name} (${entry.symbol})`;
        this.view.el.quantityInput.value = entry.quantity;
        this.view.el.costInput.value = entry.cost ?? '';
        this.model.setView('portfolio-view');
        this.view.setActiveView('portfolio-view');
        this.view.el.coinInput.focus();
      },
      onRemove: async (entry) => {
        if (confirm(`Remove ${entry.name}?`)) {
          await this.model.removePortfolioEntry(entry.id);
          this.renderPortfolio();
        }
      }
    });
  }

  getFilteredCoins() {
    const { state } = this.model;
    const query = (state.searchTerm || '').trim().toLowerCase();
    let coins = [...state.coins];
    if (query) {
      coins = coins.filter((c) => c.name.toLowerCase().includes(query) || c.symbol.toLowerCase().includes(query));
    }
    if (state.category && state.category !== 'all') {
      coins = coins.filter((c) => getCategory(c) === state.category);
    }
    coins = sortCoins(coins, state.sort);
    return coins;
  }

  async openDetail(id) {
    console.log('openDetail called with id:', id);
    this.model.setSelectedCoin(id);
    this.model.setView('detail-view');
    this.view.setActiveView('detail-view');
    this.view.showDetailLoading();
    console.log('About to show modal...');
    try {
      const [infoPayload, quotePayload] = await Promise.all([api.fetchInfo(id), api.fetchQuote(id)]);
      const infoErr = infoPayload?.status?.error_code;
      const quoteErr = quotePayload?.status?.error_code;
      if (infoErr && infoErr !== 0) throw new Error(`Info error ${infoErr}: ${infoPayload?.status?.error_message || ''}`);
      if (quoteErr && quoteErr !== 0) throw new Error(`Quote error ${quoteErr}: ${quotePayload?.status?.error_message || ''}`);
      const coin = pickCoinFromPayload(quotePayload, id) || this.model.state.coins.find((c) => c.id === id);
      if (!coin) {
        this.view.showDetailError('Unable to load coin (no data returned).');
        return;
      }
      const info = pickCoinFromPayload(infoPayload, id);
      this.detailContext = { coin, info };
      this.renderDetail(coin, info);
    } catch (error) {
      console.error('detail load error', error);
      this.view.showDetailError(`Unable to load details. ${error.message || 'Try refresh; API may be rate limited.'}`);
    }
  }

  renderDetail(coin, info) {
    const helpers = this.getHelpers();
    this.view.renderDetail({ coin, info, detailRange: this.model.state.detailRange }, helpers, {
      onRangeChange: (range) => {
        this.model.setDetailRange(range);
        this.renderDetail(coin, info);
      },
      onAddPortfolio: async (selectedCoin) => {
        await this.model.addPortfolioEntry({ id: selectedCoin.id, symbol: selectedCoin.symbol, name: selectedCoin.name, quantity: 0, cost: null });
        this.renderPortfolio();
        alert(`${selectedCoin.name} added. Set quantity in Portfolio.`);
      }
    });
  }

  async handlePortfolioSubmit() {
    const { el } = this.view;
    const coinQuery = el.coinInput.value.trim();
    const quantity = Number(el.quantityInput.value);
    const cost = el.costInput.value ? Number(el.costInput.value) : null;
    await this.ensureFxRates();
    if (!coinQuery || Number.isNaN(quantity) || quantity <= 0) {
      alert('Enter a coin and quantity greater than 0.');
      return;
    }
    const coin = this.model.findCoin(coinQuery);
    if (!coin) {
      alert('Coin not found in current list.');
      return;
    }
    const rate = this.model.state.fxRates?.[this.model.state.currency] || 1;
    const costUsd = cost !== null ? cost / rate : null;
    const entry = { id: coin.id, symbol: coin.symbol, name: coin.name, quantity, cost, costUsd, costCurrency: this.model.state.currency };
    const editingId = el.editIdInput.value;
    if (editingId) await this.model.updatePortfolioEntry(editingId, entry);
    else await this.model.addPortfolioEntry(entry);
    this.view.clearForm();
    this.renderPortfolio();
  }

  getHelpers() {
    const { state } = this.model;
    return {
      formatCurrency: (value) => formatCurrency(value, state.fxRates, state.currency),
      formatNumber: (value, digits = 0) => formatNumber(value, state.fxRates, state.currency, digits),
      formatChange,
      sanitizeDescription,
      extractLinks,
      buildSeries,
      drawSeries,
      drawMiniSparkline: (canvas, coin) => drawMiniSparkline(canvas, coin),
      fxRate: () => state.fxRates?.[state.currency] || 1,
      rateFor: (code) => (state.fxRates?.[code] || 1),
      currentCurrency: state.currency
    };
  }
}
