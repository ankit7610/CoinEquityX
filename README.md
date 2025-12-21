# Crypto Pulse

A full-stack cryptocurrency dashboard with live market data, portfolio tracking, news, and optional Firebase authentication.

## Repository
- GitHub: https://github.com/ankit7610/Cryptocurrency

## Requirements
- Node.js 18+
- API keys for CoinMarketCap, FreeCurrency, MarketAux
- MongoDB (optional for portfolio persistence)

## Setup
```bash
npm install
cd frontend-react && npm install && cd ..
```

Create `.env` in the repo root:
```env
CMC_API_KEY=...
FREE_CURRENCY_API_KEY=...
MARKETAUX_API_KEY=...
PORT=3000
```

## Run
```bash
npm start          # Terminal 1 - Backend
cd frontend-react && npm run dev  # Terminal 2 - Frontend
```

Open http://localhost:5173

## Tests
```bash
npm test                          # Backend tests
npm run test:frontend             # Frontend tests
npx playwright test               # E2E tests
```

## License
MIT
