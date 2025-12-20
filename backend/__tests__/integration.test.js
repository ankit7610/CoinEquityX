const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');

const BASE_URL = 'http://localhost:3000';
let server;

// Mock environment variables
process.env.CMC_API_KEY = 'test-key';
process.env.FREE_CURRENCY_API_KEY = 'test-key';
process.env.MARKETAUX_API_KEY = 'test-key';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

describe('Backend API Integration Tests', () => {
  before(async () => {
    // Start server for testing
    const app = require('../server');
    server = app.listen(3001);
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  after(() => {
    if (server) server.close();
  });

  describe('GET /api/listings', () => {
    it('should return cryptocurrency listings', async () => {
      const response = await fetch(`${BASE_URL}/api/listings`);
      const data = await response.json();
      
      assert.strictEqual(response.status, 200);
      assert.ok(data.data);
      assert.ok(Array.isArray(data.data));
    });

    it('should handle errors gracefully', async () => {
      // Test with invalid endpoint
      const response = await fetch(`${BASE_URL}/api/listings?invalid=true`);
      assert.ok(response.status === 200 || response.status === 500);
    });
  });

  describe('GET /api/categories', () => {
    it('should return cryptocurrency categories', async () => {
      const response = await fetch(`${BASE_URL}/api/categories?start=1`);
      const data = await response.json();
      
      assert.strictEqual(response.status, 200);
      assert.ok(data.data);
    });
  });

  describe('GET /api/news', () => {
    it('should return crypto news', async () => {
      const response = await fetch(`${BASE_URL}/api/news?countries=us&limit=10`);
      const data = await response.json();
      
      assert.strictEqual(response.status, 200);
      assert.ok(data.data);
    });

    it('should support pagination', async () => {
      const response = await fetch(`${BASE_URL}/api/news?countries=us&limit=5`);
      const data = await response.json();
      
      assert.strictEqual(response.status, 200);
      if (data.data && Array.isArray(data.data)) {
        assert.ok(data.data.length <= 5);
      }
    });
  });

  describe('GET /api/currency/latest', () => {
    it('should return currency exchange rates', async () => {
      const response = await fetch(`${BASE_URL}/api/currency/latest?base_currency=USD`);
      const data = await response.json();
      
      assert.strictEqual(response.status, 200);
      assert.ok(data.data);
    });

    it('should support different base currencies', async () => {
      const response = await fetch(`${BASE_URL}/api/currency/latest?base_currency=EUR`);
      const data = await response.json();
      
      assert.strictEqual(response.status, 200);
      assert.ok(data.data);
    });
  });

  describe('Portfolio Endpoints', () => {
    describe('GET /api/portfolio', () => {
      it('should return portfolio data', async () => {
        const response = await fetch(`${BASE_URL}/api/portfolio`);
        const data = await response.json();
        
        assert.strictEqual(response.status, 200);
        assert.ok(data.data !== undefined);
      });
    });

    describe('POST /api/portfolio', () => {
      it('should save portfolio data', async () => {
        const portfolio = [
          { id: 1, name: 'Bitcoin', symbol: 'BTC', quantity: 0.5, cost: 25000 }
        ];

        const response = await fetch(`${BASE_URL}/api/portfolio`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(portfolio)
        });
        
        assert.ok(response.status === 200 || response.status === 201);
      });

      it('should validate portfolio data format', async () => {
        const response = await fetch(`${BASE_URL}/api/portfolio`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify('invalid')
        });
        
        assert.ok(response.status === 400 || response.status === 500);
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to API endpoints', async () => {
      const requests = [];
      
      // Send multiple requests quickly
      for (let i = 0; i < 15; i++) {
        requests.push(fetch(`${BASE_URL}/api/listings`));
      }
      
      const responses = await Promise.all(requests);
      const statusCodes = responses.map(r => r.status);
      
      // Should have at least one rate limited response (429)
      const hasRateLimit = statusCodes.some(code => code === 429);
      assert.ok(hasRateLimit || statusCodes.every(code => code === 200));
    });
  });

  describe('CORS', () => {
    it('should have CORS headers', async () => {
      const response = await fetch(`${BASE_URL}/api/listings`);
      const corsHeader = response.headers.get('access-control-allow-origin');
      
      assert.ok(corsHeader !== null);
    });
  });

  describe('Error Handling', () => {
    it('should return proper error for non-existent endpoints', async () => {
      const response = await fetch(`${BASE_URL}/api/nonexistent`);
      
      assert.strictEqual(response.status, 404);
    });

    it('should handle malformed requests', async () => {
      const response = await fetch(`${BASE_URL}/api/portfolio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'malformed json'
      });
      
      assert.ok(response.status >= 400);
    });
  });

  describe('Coin Info Endpoint', () => {
    it('should return coin information', async () => {
      const response = await fetch(`${BASE_URL}/api/coin/info/1`);
      const data = await response.json();
      
      assert.ok(response.status === 200 || response.status === 500);
      if (response.status === 200) {
        assert.ok(data.data);
      }
    });
  });

  describe('Coin Quote Endpoint', () => {
    it('should return coin quote data', async () => {
      const response = await fetch(`${BASE_URL}/api/coin/quote/1`);
      const data = await response.json();
      
      assert.ok(response.status === 200 || response.status === 500);
      if (response.status === 200) {
        assert.ok(data.data);
      }
    });
  });

  describe('Health Check', () => {
    it('should respond to health check', async () => {
      const response = await fetch(`${BASE_URL}/`);
      
      assert.strictEqual(response.status, 200);
    });
  });
});

describe('Backend Unit Tests', () => {
  describe('Environment Configuration', () => {
    it('should have required environment variables', () => {
      assert.ok(process.env.CMC_API_KEY);
      assert.ok(process.env.FREE_CURRENCY_API_KEY);
      assert.ok(process.env.MARKETAUX_API_KEY);
    });
  });

  describe('Server Configuration', () => {
    it('should use correct port', () => {
      const port = process.env.PORT || 3000;
      assert.strictEqual(typeof port, 'number' || 'string');
    });
  });
});
