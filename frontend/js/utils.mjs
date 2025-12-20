export function sortCoins(list, sortKey) {
  const arr = [...list];
  const parts = sortKey.split('_');
  const dir = parts.pop();
  const key = parts.join('_');
  const multiplier = dir === 'asc' ? 1 : -1;
  const value = (coin, path) => {
    switch (path) {
      case 'market_cap':
        return coin.quote?.USD?.market_cap ?? 0;
      case 'price':
        return coin.quote?.USD?.price ?? 0;
      case 'change24':
        return coin.quote?.USD?.percent_change_24h ?? 0;
      case 'change7':
        return coin.quote?.USD?.percent_change_7d ?? 0;
      default:
        return 0;
    }
  };
  if (key === 'name') {
    arr.sort((a, b) => (a.name > b.name ? 1 : -1) * multiplier);
  } else {
    const field = { market_cap: 'market_cap', price: 'price', change24: 'change24', change7: 'change7' }[key] || 'market_cap';
    arr.sort((a, b) => (value(a, field) - value(b, field)) * multiplier);
  }
  return arr;
}

export function getCategory(coin) {
  const stableSyms = ['USDT', 'USDC', 'BUSD', 'DAI', 'TUSD'];
  const layer1Syms = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'AVAX', 'DOT', 'ATOM', 'MATIC'];
  if (stableSyms.includes(coin.symbol)) return 'stable';
  if (layer1Syms.includes(coin.symbol)) return 'layer1';
  return 'alt';
}

export function convertValue(value, fxRates, currency) {
  const rate = (fxRates && fxRates[currency]) || 1;
  return Number(value) * rate;
}

export function currencySymbol(code) {
  const map = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    JPY: '¥',
    AUD: 'A$',
    CAD: 'C$',
    CHF: 'CHF'
  };
  return map[code] || `${code} `;
}

export function formatCurrency(value, fxRates, currency) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const converted = convertValue(value, fxRates, currency);
  const symbol = currencySymbol(currency);
  if (converted < 1) {
    return `${symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 10 })}`;
  }
  if (converted < 1000) return `${symbol}${converted.toLocaleString(undefined, { maximumFractionDigits: 6 })}`;
  return `${symbol}${converted.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function formatNumber(value, fxRates, currency, digits = 0) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const converted = convertValue(value, fxRates, currency);
  return Number(converted).toLocaleString(undefined, { maximumFractionDigits: digits });
}

export function formatChange(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

export function pickCoinFromPayload(payload, id) {
  if (!payload || !payload.data) return null;
  const key = id in (payload.data || {}) ? id : String(id);
  if (payload.data[key]) return payload.data[key];
  const values = Object.values(payload.data);
  return values.length ? values[0] : null;
}

export function sanitizeDescription(text) {
  const div = document.createElement('div');
  div.innerHTML = text || '';
  return div.textContent || div.innerText || '';
}

export function extractLinks(urls) {
  const links = [];
  if (urls.website?.[0]) links.push({ label: 'Website', url: urls.website[0] });
  if (urls.explorer?.[0]) links.push({ label: 'Explorer', url: urls.explorer[0] });
  if (urls.technical_doc?.[0]) links.push({ label: 'Docs', url: urls.technical_doc[0] });
  if (urls.source_code?.[0]) links.push({ label: 'Source', url: urls.source_code[0] });
  return links;
}

export function buildSeries(coin, range) {
  const q = coin.quote?.USD || {};
  const price = q.price || 0;
  const pctMap = {
    '1h': q.percent_change_1h,
    '24h': q.percent_change_24h,
    '7d': q.percent_change_7d,
    '30d': q.percent_change_30d,
    '90d': q.percent_change_90d
  };
  const pct = pctMap[range] ?? 0;
  const end = price;
  const denom = 1 + pct / 100;
  const safeDenom = Math.abs(denom) < 0.01 ? 0.01 * Math.sign(denom || 1) : denom;
  const start = end / safeDenom;
  const steps = 40;
  const series = [];
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const eased = t * t * (3 - 2 * t);
    series.push(start + (end - start) * eased);
  }
  const forecast = [];
  const slope = series.length > 2 ? series[series.length - 1] - series[series.length - 2] : 0;
  let current = series[series.length - 1];
  for (let i = 0; i < 12; i++) {
    current += slope;
    forecast.push(Math.max(current, 0));
  }
  return { series, forecast };
}

export function drawSeries(canvas, series, forecast = []) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const all = forecast.length ? [...series, ...forecast] : series;
  const min = Math.min(...all);
  const max = Math.max(...all);
  const spread = max - min || 1;
  const padding = 8;
  const points = series.map((val, idx) => ({
    x: (idx / (series.length - 1)) * w * 0.8,
    y: padding + (h - 2 * padding) - (((val - min) / spread) * (h - 2 * padding))
  }));
  const forecastPoints = forecast.map((val, idx) => ({
    x: w * 0.8 + (idx / Math.max(1, forecast.length - 1)) * w * 0.2,
    y: padding + (h - 2 * padding) - (((val - min) / spread) * (h - 2 * padding))
  }));
  ctx.clearRect(0, 0, w, h);
  const last = forecast.length ? forecast[forecast.length - 1] : series[series.length - 1];
  const up = last >= series[0];
  const color = up ? '#10b981' : '#ef4444';
  let progress = 0;

  function frame() {
    progress += 0.08;
    const capped = Math.min(1, progress);
    ctx.clearRect(0, 0, w, h);
    
    // Draw gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, up ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)');
    gradient.addColorStop(1, up ? 'rgba(16, 185, 129, 0)' : 'rgba(239, 68, 68, 0)');
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, h);
    ctx.lineTo(points[0].x, points[0].y);
    
    // Draw smooth curve with quadratic bezier
    for (let i = 1; i < points.length; i++) {
      const pct = i / (points.length - 1);
      if (pct > capped) break;
      const prevPt = points[i - 1];
      const pt = points[i];
      const cpx = (prevPt.x + pt.x) / 2;
      ctx.quadraticCurveTo(prevPt.x, prevPt.y, cpx, (prevPt.y + pt.y) / 2);
      if (i === points.length - 1 || pct + (1 / points.length) > capped) {
        ctx.quadraticCurveTo(cpx, (prevPt.y + pt.y) / 2, pt.x, pt.y);
      }
    }
    
    const lastDrawnPoint = points[Math.min(Math.floor(capped * points.length), points.length - 1)];
    ctx.lineTo(lastDrawnPoint.x, h);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Draw line
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = color;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      const pct = i / (points.length - 1);
      if (pct > capped) break;
      const prevPt = points[i - 1];
      const pt = points[i];
      const cpx = (prevPt.x + pt.x) / 2;
      ctx.quadraticCurveTo(prevPt.x, prevPt.y, cpx, (prevPt.y + pt.y) / 2);
      if (i === points.length - 1 || pct + (1 / points.length) > capped) {
        ctx.quadraticCurveTo(cpx, (prevPt.y + pt.y) / 2, pt.x, pt.y);
      }
    }
    ctx.stroke();
    
    // Draw forecast with dashed line
    if (forecastPoints.length && capped === 1) {
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(points[points.length - 1].x, points[points.length - 1].y);
      
      for (let i = 0; i < forecastPoints.length; i++) {
        const pt = forecastPoints[i];
        if (i === 0) {
          ctx.lineTo(pt.x, pt.y);
        } else {
          const prevPt = forecastPoints[i - 1];
          const cpx = (prevPt.x + pt.x) / 2;
          ctx.quadraticCurveTo(prevPt.x, prevPt.y, cpx, (prevPt.y + pt.y) / 2);
          if (i === forecastPoints.length - 1) {
            ctx.quadraticCurveTo(cpx, (prevPt.y + pt.y) / 2, pt.x, pt.y);
          }
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    if (capped < 1) requestAnimationFrame(frame);
  }
  frame();
}

export function drawMiniSparkline(canvas, coin) {
  if (!canvas || !coin) return;
  const { series } = buildSeries(coin, '24h');
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const spread = max - min || 1;
  const padding = 4;
  const points = series.map((val, idx) => ({
    x: (idx / (series.length - 1)) * w,
    y: padding + (h - 2 * padding) - (((val - min) / spread) * (h - 2 * padding))
  }));
  ctx.clearRect(0, 0, w, h);
  
  const up = series[series.length - 1] >= series[0];
  const lineColor = up ? '#10b981' : '#ef4444';
  const gradientStart = up ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)';
  const gradientEnd = up ? 'rgba(16, 185, 129, 0)' : 'rgba(239, 68, 68, 0)';
  
  // Draw gradient fill
  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, gradientStart);
  gradient.addColorStop(1, gradientEnd);
  
  ctx.beginPath();
  ctx.moveTo(points[0].x, h);
  points.forEach((pt, idx) => {
    if (idx === 0) ctx.lineTo(pt.x, pt.y);
    else {
      const prevPt = points[idx - 1];
      const cpx = (prevPt.x + pt.x) / 2;
      ctx.quadraticCurveTo(prevPt.x, prevPt.y, cpx, (prevPt.y + pt.y) / 2);
      ctx.quadraticCurveTo(cpx, (prevPt.y + pt.y) / 2, pt.x, pt.y);
    }
  });
  ctx.lineTo(points[points.length - 1].x, h);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // Draw line
  ctx.lineWidth = 2;
  ctx.strokeStyle = lineColor;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  points.forEach((pt, idx) => {
    if (idx === 0) ctx.moveTo(pt.x, pt.y);
    else {
      const prevPt = points[idx - 1];
      const cpx = (prevPt.x + pt.x) / 2;
      ctx.quadraticCurveTo(prevPt.x, prevPt.y, cpx, (prevPt.y + pt.y) / 2);
      ctx.quadraticCurveTo(cpx, (prevPt.y + pt.y) / 2, pt.x, pt.y);
    }
  });
  ctx.stroke();
}
