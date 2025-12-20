import test from 'node:test';
import assert from 'node:assert/strict';
import { sortCoins, getCategory, buildSeries } from '../js/utils.mjs';

test('sortCoins sorts by market cap desc and name asc', () => {
  const coins = [
    { name: 'Beta', symbol: 'B', quote: { USD: { market_cap: 2 } } },
    { name: 'Alpha', symbol: 'A', quote: { USD: { market_cap: 1 } } }
  ];
  const sortedDesc = sortCoins(coins, 'market_cap_desc');
  assert.equal(sortedDesc[0].name, 'Beta');
  const sortedByName = sortCoins(coins, 'name_asc');
  assert.equal(sortedByName[0].name, 'Alpha');
});

test('getCategory classifies stable and layer1', () => {
  assert.equal(getCategory({ symbol: 'USDT' }), 'stable');
  assert.equal(getCategory({ symbol: 'ETH' }), 'layer1');
  assert.equal(getCategory({ symbol: 'DOGE' }), 'alt');
});

test('buildSeries returns series and forecast of expected length', () => {
  const coin = { quote: { USD: { price: 100, percent_change_24h: 10 } } };
  const { series, forecast } = buildSeries(coin, '24h');
  assert.equal(series.length, 40);
  assert.equal(forecast.length, 12);
  assert.ok(series[0] > 0);
});
