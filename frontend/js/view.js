export function createView() {
  const el = {
    views: document.querySelectorAll('.view'),
    tabs: document.querySelectorAll('.tab-btn'),
    search: document.getElementById('search-input'),
    sort: document.getElementById('sort-select'),
    currencySelect: document.getElementById('currency-select'),
    refresh: document.getElementById('refresh-btn'),
    filterChips: document.querySelectorAll('.filter-chip'),
    coinsList: document.getElementById('coins-list'),
    categoriesList: document.getElementById('categories-list'),
    newsList: document.getElementById('news-list'),
    themeToggle: document.getElementById('theme-toggle'),
    detailContent: document.getElementById('detail-content'),
    backDashboard: document.getElementById('back-dashboard'),
    portfolioSummary: document.getElementById('portfolio-summary'),
    portfolioList: document.getElementById('portfolio-list'),
    portfolioForm: document.getElementById('portfolio-form'),
    coinInput: document.getElementById('coin-input'),
    coinOptions: document.getElementById('coin-options'),
    quantityInput: document.getElementById('quantity-input'),
    costInput: document.getElementById('cost-input'),
    editIdInput: document.getElementById('edit-id'),
    resetFormBtn: document.getElementById('reset-form-btn'),
    prevBtn: document.getElementById('prev-btn'),
    nextBtn: document.getElementById('next-btn'),
    pageInfo: document.getElementById('page-info')
  };

  function applyTheme(theme) {
    document.documentElement.classList.toggle('theme-dark', theme === 'dark');
    if (el.themeToggle) el.themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  function setActiveView(id) {
    el.views.forEach((view) => view.classList.toggle('active', view.id === id));
    el.tabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.view === id));
  }

  function setActiveCategory(category) {
    el.filterChips.forEach((chip) => chip.classList.toggle('active', chip.dataset.category === category));
  }

  function renderSkeletonRows() {
    el.coinsList.innerHTML = '';
    for (let i = 0; i < 6; i++) {
      const card = document.createElement('div');
      card.className = 'crypto-card skeleton';
      card.style.height = '280px';
      el.coinsList.appendChild(card);
    }
  }

  function renderCoins(coins, helpers, actions, options = {}) {
    el.coinsList.innerHTML = '';
    if (!coins.length) {
      const message = options.errorMessage || 'No results.';
      el.coinsList.innerHTML = `<div class="muted" style="grid-column: 1/-1; padding: 40px 20px; text-align: center;">${message}</div>`;
      return;
    }
    const template = document.getElementById('coin-card-template');
    coins.forEach((coin) => {
      const node = template.content.cloneNode(true);
      node.querySelector('.coin-symbol').textContent = coin.symbol;
      node.querySelector('.coin-name').textContent = coin.name;
      node.querySelector('.card-icon').textContent = coin.symbol.slice(0, 1);
      node.querySelector('.card-price').textContent = helpers.formatCurrency(coin.quote?.USD?.price);
      const c24 = coin.quote?.USD?.percent_change_24h ?? 0;
      const changeEl = node.querySelector('.card-change');
      changeEl.textContent = helpers.formatChange(c24);
      if (c24 < 0) changeEl.classList.add('change-neg');
      
      node.querySelector('.stat-value').textContent = helpers.formatNumber(coin.quote?.USD?.market_cap);
      const volEl = node.querySelectorAll('.stat-value')[1];
      volEl.textContent = helpers.formatNumber(coin.quote?.USD?.volume_24h);
      
      const sparkCanvas = node.querySelector('canvas');
      setTimeout(() => helpers.drawMiniSparkline(sparkCanvas, coin), 0);

      const card = node.querySelector('.crypto-card');
      card.addEventListener('click', () => {
        console.log('Card clicked for coin:', coin.name, 'ID:', coin.id);
        actions.onOpenDetail(coin.id);
      });
      
      node.querySelector('.card-action').addEventListener('click', (e) => {
        e.stopPropagation();
        actions.onAddPortfolio(coin);
      });
      
      el.coinsList.appendChild(node);
    });
  }

  function renderCoinOptions(coins, mapList) {
    el.coinOptions.innerHTML = '';
    const seen = new Set();
    [...coins, ...mapList].forEach((coin) => {
      const label = `${coin.name} (${coin.symbol})`;
      if (seen.has(label)) return;
      seen.add(label);
      const option = document.createElement('option');
      option.value = label;
      el.coinOptions.appendChild(option);
    });
  }

  function renderCategories(categories, helpers, actions) {
    el.categoriesList.innerHTML = '';
    if (!categories.length) {
      el.categoriesList.innerHTML = '<tr><td colspan="5" class="muted">No categories loaded.</td></tr>';
      return;
    }
    const template = document.getElementById('category-row-template');
    categories.forEach((cat) => {
      const node = template.content.cloneNode(true);
      node.querySelector('.cat-name').textContent = cat.name;
      node.querySelector('.cat-count').textContent = cat.num_tokens ?? '—';
      node.querySelector('.cat-cap').textContent = helpers.formatNumber(cat.market_cap);
      node.querySelector('.cat-vol').textContent = helpers.formatNumber(cat.volume_24h);
      node.querySelector('.cat-open').addEventListener('click', () => actions.onOpenCategory(cat.name));
      el.categoriesList.appendChild(node);
    });
  }

  function renderNews(items) {
    if (!el.newsList) return;
    el.newsList.innerHTML = '';
    if (!items.length) {
      el.newsList.innerHTML = '<div class="muted" style="padding: 40px; text-align: center; grid-column: 1/-1;">No news available.</div>';
      return;
    }
    items.forEach((item, index) => {
      const article = document.createElement('article');
      article.className = 'news-card';
      article.style.animationDelay = `${index * 0.1}s`;
      
      const date = new Date(item.published_at || item.published || Date.now());
      const timeAgo = getTimeAgo(date);
      const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      
      const imageUrl = item.image_url || item.image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"%3E%3Crect fill="%236366f1" width="400" height="200"/%3E%3Ctext fill="white" font-family="system-ui" font-size="48" font-weight="bold" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3E📰%3C/text%3E%3C/svg%3E';
      const source = item.source || 'Crypto News';
      const entities = item.entities || [];
      const sentiment = item.sentiment || 'neutral';
      
      article.innerHTML = `
        <div class="news-image-wrapper">
          <img src="${imageUrl}" alt="${item.title || 'News'}" class="news-image" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22200%22 viewBox=%220 0 400 200%22%3E%3Crect fill=%22%236366f1%22 width=%22400%22 height=%22200%22/%3E%3Ctext fill=%22white%22 font-family=%22system-ui%22 font-size=%2248%22 font-weight=%22bold%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3E📰%3C/text%3E%3C/svg%3E'">
          <div class="news-badge ${sentiment}">${source}</div>
        </div>
        <div class="news-content">
          <div class="news-meta">
            <span class="news-time">⏱️ ${timeAgo}</span>
            <span class="news-date">${formattedDate}</span>
          </div>
          <h3 class="news-title">${item.title || 'Untitled'}</h3>
          <p class="news-description">${(item.description || item.snippet || 'No description available.').slice(0, 150)}${(item.description || '').length > 150 ? '…' : ''}</p>
          ${entities.length > 0 ? `<div class="news-tags">${entities.slice(0, 3).map(e => `<span class="news-tag">${e.symbol || e.name || e}</span>`).join('')}</div>` : ''}
          <a href="${item.url}" target="_blank" rel="noreferrer noopener" class="news-read-btn">Read Article →</a>
        </div>
      `;
      el.newsList.appendChild(article);
    });
  }
  
  function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    const intervals = [
      { label: 'year', seconds: 31536000 },
      { label: 'month', seconds: 2592000 },
      { label: 'day', seconds: 86400 },
      { label: 'hour', seconds: 3600 },
      { label: 'minute', seconds: 60 }
    ];
    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.seconds);
      if (count >= 1) {
        return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
      }
    }
    return 'Just now';
  }

  function showDetailLoading() {
    el.detailContent.innerHTML = '<p class="muted">Loading…</p>';
  }

  function showDetailError(message) {
    el.detailContent.innerHTML = `<p class="muted">${message}</p>`;
  }

  function renderDetail({ coin, info, detailRange }, helpers, actions) {
    const modalOverlay = document.getElementById('modal-overlay');
    const modalBody = document.getElementById('modal-body');
    const modalClose = document.getElementById('modal-close');
    if (!modalBody || !modalOverlay) {
      if (!el.detailContent) return;
      el.detailContent.innerHTML = `
        <div class="modal-header">
          <div class="modal-icon">${coin.symbol.slice(0, 1)}</div>
          <div class="modal-header-info">
            <h2>${coin.name}</h2>
            <p class="modal-header-subtitle">Rank #${coin.cmc_rank ?? '-'} • ${coin.symbol}</p>
          </div>
        </div>
        <div class="modal-price-display">
          <div class="modal-price-large">${helpers.formatCurrency(coin.quote?.USD?.price)}</div>
          <div class="modal-price-change ${coin.quote?.USD?.percent_change_24h < 0 ? 'negative' : ''}">${helpers.formatChange(coin.quote?.USD?.percent_change_24h ?? 0)}</div>
        </div>
        <p class="muted">${helpers.sanitizeDescription(info?.description || 'No description available.')}</p>
      `;
      return;
    }
    
    // Header
    const header = document.createElement('div');
    header.className = 'modal-header';
    header.innerHTML = `
      <div class="modal-icon">${coin.symbol.slice(0, 1)}</div>
      <div class="modal-header-info">
        <h2>${coin.name}</h2>
        <p class="modal-header-subtitle">Rank #${coin.cmc_rank ?? '-'} • ${coin.symbol}</p>
      </div>
    `;

    // Price Display
    const priceDisplay = document.createElement('div');
    priceDisplay.className = 'modal-price-display';
    const c24 = coin.quote?.USD?.percent_change_24h ?? 0;
    priceDisplay.innerHTML = `
      <div class="modal-price-large">${helpers.formatCurrency(coin.quote?.USD?.price)}</div>
      <div class="modal-price-change ${c24 < 0 ? 'negative' : ''}">${helpers.formatChange(c24)}</div>
    `;

    // Chart Box
    const chartBox = document.createElement('div');
    chartBox.className = 'modal-chart';
    chartBox.innerHTML = `
      <h3>Price Chart</h3>
      <div class="chart-controls" id="timeframe-buttons"></div>
      <canvas id="detail-chart" width="640" height="200"></canvas>
    `;

    // Stats Grid
    const statGrid = document.createElement('div');
    statGrid.className = 'modal-stats';
    const stats = [
      ['1h', helpers.formatChange(coin.quote?.USD?.percent_change_1h)],
      ['24h', helpers.formatChange(coin.quote?.USD?.percent_change_24h)],
      ['7d', helpers.formatChange(coin.quote?.USD?.percent_change_7d)],
      ['30d', helpers.formatChange(coin.quote?.USD?.percent_change_30d)],
      ['Market Cap', helpers.formatNumber(coin.quote?.USD?.market_cap)],
      ['Volume 24h', helpers.formatNumber(coin.quote?.USD?.volume_24h)]
    ];
    stats.forEach(([label, value]) => {
      const stat = document.createElement('div');
      stat.className = 'modal-stat';
      stat.innerHTML = `<div class="modal-stat-label">${label}</div><div class="modal-stat-value">${value}</div>`;
      statGrid.appendChild(stat);
    });

    // Description
    const description = document.createElement('p');
    description.className = 'muted';
    description.style.lineHeight = '1.6';
    description.textContent = helpers.sanitizeDescription(info?.description || 'No description available.');

    // Links
    const links = document.createElement('div');
    links.className = 'link-list';
    links.style.marginTop = '16px';
    helpers.extractLinks(info?.urls || {}).forEach(({ label, url }) => {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noreferrer';
      a.className = 'link-pill';
      a.textContent = label;
      links.appendChild(a);
    });

    // Add to Portfolio Button
    const addButton = document.createElement('button');
    addButton.className = 'primary-btn';
    addButton.textContent = '➕ Add to Portfolio';
    addButton.style.marginTop = '20px';
    addButton.addEventListener('click', () => actions.onAddPortfolio(coin));

    // Clear and append
    modalBody.innerHTML = '';
    modalBody.appendChild(header);
    modalBody.appendChild(priceDisplay);
    modalBody.appendChild(chartBox);
    modalBody.appendChild(statGrid);
    modalBody.appendChild(description);
    modalBody.appendChild(links);
    modalBody.appendChild(addButton);

    // Show modal
    console.log('Showing modal overlay, element:', modalOverlay);
    if (modalOverlay) {
      modalOverlay.classList.remove('hidden');
      console.log('Modal should now be visible');
    } else {
      console.error('Modal overlay element not found!');
    }

    // Close handlers
    modalClose.onclick = () => modalOverlay.classList.add('hidden');
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) modalOverlay.classList.add('hidden');
    });

    // Build timeframe buttons and chart
    buildTimeframeButtons(detailRange, (range) => actions.onRangeChange(range));
    renderDetailChart(coin, detailRange, helpers);
  }

  function buildTimeframeButtons(activeRange, onChange) {
    const ranges = ['1h', '24h', '7d', '30d', '90d'];
    const container = document.getElementById('timeframe-buttons');
    if (!container) return;
    container.innerHTML = '';
    ranges.forEach((range) => {
      const btn = document.createElement('button');
      btn.className = `chip-btn ${activeRange === range ? 'active' : ''}`;
      btn.textContent = range.toUpperCase();
      btn.dataset.range = range;
      btn.addEventListener('click', () => onChange(range));
      container.appendChild(btn);
    });
  }

  function renderDetailChart(coin, range, helpers) {
    const canvas = document.getElementById('detail-chart');
    if (!canvas) return;
    const { series, forecast } = helpers.buildSeries(coin, range);
    helpers.drawSeries(canvas, series, forecast);
    const note = document.getElementById('chart-note');
    if (note) note.textContent = `Curve built from ${range.toUpperCase()} change with a short forecast tail`;
  }

  function renderPortfolio(entries, coins, helpers, actions) {
    if (!entries.length) {
      el.portfolioSummary.innerHTML = '';
      el.portfolioList.innerHTML = '<p class="muted">No holdings yet.</p>';
      return;
    }
    let investedUsd = 0;
    let valueUsd = 0;
    const rows = [];
    const rate = helpers.fxRate ? helpers.fxRate() : 1;
    const currentCurrency = helpers.currentCurrency || 'USD';
    const rateFor = helpers.rateFor ? helpers.rateFor : (() => 1);

    entries.forEach((entry) => {
      const coin = coins.find((c) => String(c.id) === String(entry.id));
      const priceUsd = coin?.quote?.USD?.price ?? null;

      // Determine effective Cost in USD
      let costUsd = entry.costUsd;
      
      // CRITICAL FIX: If the user is viewing in the same currency they bought in,
      // force the cost basis to match exactly what they entered (entry.cost),
      // ignoring historical exchange rate drift.
      if (entry.costCurrency === currentCurrency && entry.cost !== undefined && entry.cost !== null) {
        costUsd = entry.cost / rate;
      } 
      // Fallback for legacy data or missing costUsd
      else if (costUsd === undefined || costUsd === null) {
        if (entry.cost !== undefined && entry.cost !== null) {
          const storedCurrencyRate = rateFor(entry.costCurrency || 'USD');
          costUsd = entry.cost / storedCurrencyRate;
        } else {
          costUsd = null;
        }
      }

      // Calculate totals in USD
      if (costUsd !== null) investedUsd += costUsd * entry.quantity;
      if (priceUsd !== null) valueUsd += priceUsd * entry.quantity;
      
      // Prepare entry for row
      let costInCurrentCurrency;
      if (entry.costCurrency === currentCurrency && entry.cost !== null) {
        costInCurrentCurrency = entry.cost;
      } else {
        costInCurrentCurrency = costUsd !== null ? costUsd * rate : null;
      }

      rows.push({
        entry: { ...entry, costUsd, cost: costInCurrentCurrency },
        coin,
        priceUsd
      });
    });

    const pnlUsd = valueUsd - investedUsd;
    const totalPnlPercent = investedUsd ? (pnlUsd / investedUsd) * 100 : (valueUsd > 0 ? 100 : 0);
    
    // Check if we have valid FX rates for non-USD currency
    const isFxMissing = helpers.fxRate && helpers.fxRate() === 1 && document.getElementById('currency-select')?.value !== 'USD';
    const fxWarning = isFxMissing ? '<span title="Exchange rates not loaded, showing 1:1 conversion" style="color:orange; cursor:help">⚠️</span> ' : '';

    el.portfolioSummary.innerHTML = `
      ${portfolioCard('Market value', fxWarning + helpers.formatCurrency(valueUsd || 0))}
      ${portfolioCard('Cost basis', fxWarning + (investedUsd ? helpers.formatCurrency(investedUsd) : '—'))}
      ${portfolioCard('P/L', fxWarning + `${helpers.formatCurrency(pnlUsd)} (${pnlUsd >= 0 ? '+' : ''}${totalPnlPercent.toFixed(2)}%)`, pnlUsd >= 0)}
    `;

    el.portfolioList.innerHTML = '';
    rows.forEach(({ entry, coin, priceUsd }) => {
      const row = document.createElement('div');
      row.className = 'portfolio-row';
      
      const currentValueUsd = priceUsd !== null ? priceUsd * entry.quantity : null;
      const costBasisUsd = entry.costUsd !== null ? entry.costUsd * entry.quantity : null;
      const individualPnLUsd = costBasisUsd !== null && currentValueUsd !== null ? currentValueUsd - costBasisUsd : null;
      
      let pnlPercent = 0;
      if (individualPnLUsd !== null) {
        if (costBasisUsd) {
          pnlPercent = (individualPnLUsd / costBasisUsd) * 100;
        } else if (currentValueUsd > 0) {
          pnlPercent = 100; // Treated as 100% gain if cost is 0
        }
      }
      
      const currentPriceDisplay = priceUsd !== null ? helpers.formatCurrency(priceUsd) : '—';
      const valueDisplay = currentValueUsd !== null ? helpers.formatCurrency(currentValueUsd) : '—';
      const costDisplay = costBasisUsd !== null ? helpers.formatCurrency(costBasisUsd) : '—';
      const avgBuyPriceDisplay = entry.costUsd !== null ? helpers.formatCurrency(entry.costUsd) : '—';
      
      const pnlCell = individualPnLUsd !== null
        ? `<span class="${individualPnLUsd >= 0 ? 'change-pos' : 'change-neg'}">${helpers.formatCurrency(individualPnLUsd)} (${individualPnLUsd >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}%)</span>`
        : '—';
      
      row.innerHTML = `
        <div><strong>${entry.name}</strong><p class="muted" style="margin:2px 0 0;">${entry.symbol}</p></div>
        <div><div class="muted label">Quantity</div><div>${entry.quantity}</div></div>
        <div><div class="muted label">Avg. Buy Price</div><div>${avgBuyPriceDisplay}</div></div>
        <div><div class="muted label">Current Price</div><div>${currentPriceDisplay}</div></div>
        <div><div class="muted label">Value</div><div>${valueDisplay}</div></div>
        <div><div class="muted label">Cost</div><div>${costDisplay}</div></div>
        <div><div class="muted label">P/L</div><div>${pnlCell}</div></div>
        <div class="portfolio-actions">
          <button class="ghost-btn" data-action="edit">Edit</button>
          <button class="ghost-btn" data-action="remove">Remove</button>
        </div>
      `;
      row.querySelector('[data-action="edit"]').addEventListener('click', () => actions.onEdit(entry));
      row.querySelector('[data-action="remove"]').addEventListener('click', () => actions.onRemove(entry));
      el.portfolioList.appendChild(row);
    });
  }

  function clearForm() {
    el.editIdInput.value = '';
    el.coinInput.value = '';
    el.quantityInput.value = '';
    el.costInput.value = '';
  }

  function populateCurrencyOptions(fxRates, current) {
    if (!el.currencySelect) return;
    const codes = Object.keys(fxRates || { USD: 1 });
    if (!codes.includes('USD')) codes.push('USD');
    
    // Default to INR if no current selection
    const selected = current || 'INR';
    
    // Ensure selected currency is always in the list
    if (!codes.includes(selected)) codes.push(selected);
    
    codes.sort();
    
    el.currencySelect.innerHTML = '';
    codes.forEach((code) => {
      const opt = document.createElement('option');
      opt.value = code;
      opt.textContent = code;
      if (code === selected) opt.selected = true;
      el.currencySelect.appendChild(opt);
    });
  }

  function pulseRefresh() {
    if (!el.refresh) return;
    el.refresh.classList.add('pulse');
    setTimeout(() => el.refresh.classList.remove('pulse'), 800);
  }

  function updatePagination(currentPage, totalPages, totalItems) {
    if (el.prevBtn) {
      el.prevBtn.disabled = currentPage <= 1;
    }
    if (el.nextBtn) {
      el.nextBtn.disabled = currentPage >= totalPages;
    }
    if (el.pageInfo) {
      el.pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    }
  }

  return {
    el,
    applyTheme,
    setActiveView,
    setActiveCategory,
    renderSkeletonRows,
    renderCoins,
    renderCategories,
    renderNews,
    renderCoinOptions,
    showDetailLoading,
    showDetailError,
    renderDetail,
    renderPortfolio,
    clearForm,
    populateCurrencyOptions,
    pulseRefresh,
    updatePagination
  };
}

function portfolioCard(label, value, positive) {
  const cls = positive === undefined ? '' : positive ? 'change-pos' : 'change-neg';
  return `<div class="portfolio-card"><div class="label">${label}</div><div class="${cls}">${value}</div></div>`;
}
