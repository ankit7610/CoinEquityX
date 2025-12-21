# Crypto Pulse 🚀

A comprehensive, full-stack cryptocurrency and stock market dashboard with real-time data, portfolio tracking, AI-powered chat, and advanced analytics.

**GitHub**: [ankit7610/Cryptocurrency](https://github.com/ankit7610/Cryptocurrency)

---

## Table of Contents

- [Features](#features)
- [Technical Stack](#technical-stack)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [CI/CD Pipeline](#cicd-pipeline)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Performance & Optimization](#performance--optimization)
- [Development Workflow](#development-workflow)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### 🪙 Cryptocurrency Dashboard
- **Real-time Market Data**: Live cryptocurrency prices, market cap, and 24h/7d/30d price changes.
- **CoinMarketCap Integration**: Top 100 cryptocurrencies with advanced filtering.
- **Category Explorer**: Browse crypto assets by categories (Layer 1, DeFi, Stablecoins, etc.).
- **Sparkline Charts**: Visual price trend visualization for each asset using Recharts.
- **Search Functionality**: Fast search and filtering across cryptocurrency listings.

### 📈 Stock Market Integration
- **Finnhub API Integration**: Real-time stock quotes and metrics.
- **Stock News**: Latest financial news and market insights.
- **Stock Categories**: Browse stocks by sectors and categories.
- **Stock Portfolio Tracking**: Manage stock holdings separately from crypto.

### 💼 Portfolio Management
- **Dual Portfolio System**: Track both cryptocurrency and stock holdings.
- **Portfolio Analytics**: Gain/loss calculations, holdings breakdown with charts, price entry tracking.
- **Buy Price Tracking**: Record entry prices and calculate returns.
- **Portfolio Persistence**: Save to MongoDB for cross-device access.

### 📰 News & Information
- **Crypto News**: MarketAux integration for cryptocurrency news.
- **Stock News**: Financial news from Finnhub.
- **Filtered Content**: Curated news with entity filtering.
- **Trending Topics**: Stay informed on market movements.

### 👤 User Authentication & Profiles
- **Firebase Authentication**: Secure login with email/password, Google, GitHub.
- **Supabase Integration**: User profile storage and management.
- **User Profiles**: Personal info, professional details, market preferences, avatar customization.
- **Cross-device Sync**: Profile data synced via Supabase PostgreSQL.

### 🤖 AI-Powered Features
- **Gemini AI Chat**: Integrated chatbot for market insights and general queries using Google Gemini AI.
- **Natural Language**: Ask questions about cryptocurrencies, stocks, and market trends.
- **Context-Aware**: Chat widget available throughout the application.

### 🌙 User Experience
- **Light/Dark Mode**: System preference detection with manual toggle.
- **Responsive Design**: Fully responsive for mobile, tablet, and desktop using Material-UI.
- **Multi-currency Support**: Real-time currency conversion (USD, EUR, GBP, INR, etc.) via FreeCurrencyAPI.
- **Smooth Animations**: Page transitions and loading states with Material-UI.
- **Tab Navigation**: Intuitive tab-based navigation between sections.

---

## Technical Stack

### Frontend (React + TypeScript)
- **Framework**: React 18.3.1 with TypeScript 5.6.3.
- **Build Tool**: Vite 5.4.8 with HMR.
- **State Management**: React Context API + TanStack React Query 5.59.16.
- **UI Components**: Material-UI (MUI) 6.1.7 with Emotion CSS-in-JS.
- **Routing**: React Router 6.28.0.
- **Charts**: Recharts 3.5.1 for data visualization (Sparklines, Area Charts).
- **Code Splitting**: Lazy loading of page components.

### Backend (Node.js)
- **Runtime**: Node.js 18+ with native `http` module (No Express for minimal overhead).
- **Language**: JavaScript (CommonJS).
- **API Integrations**: CoinMarketCap Pro, Finnhub, MarketAux, Google Generative AI (Gemini), FreeCurrency API.
- **Database**: MongoDB with native Node.js driver.
- **HTTP Features**: CORS, Rate limiting (custom implementation), Passthrough proxying, JSON handling.

### Caching Strategy
- **IndexedDB (Client)**: 24-hour TTL cache for API responses using a custom implementation.
- **Memory Cache (Client)**: In-memory caching with timestamp validation via React Query.
- **Server-side Cache**: In-memory Map for rapid re-requests within 24 hours.

### Database
- **MongoDB Atlas**: `crypto` database with `portfolio` and `stock_portfolio` collections.
- **Supabase (PostgreSQL)**: User profiles with Row-Level Security (RLS).
- **Firebase**: Authentication + Analytics.

### Testing Frameworks
- **Vitest 2.1.4**: Unit tests with jsdom, Coverage reporting.
- **React Testing Library 16.1.0**: Component testing.
- **Playwright 1.57.0**: E2E testing with route interception, HTML reports.
- **Node.js Test Runner**: Backend unit & integration tests.

### Rate Limiting
- **Custom Implementation**: IP-based rate limiter in `backend/server.js`.
- **Configurable**: Default 1000 requests per 24 hours.
- **Returns**: 429 status with `Retry-After` header.

### Performance Optimization
- **Web Vitals Tracking**: CLS, FCP, LCP, TTFB, INP monitoring via `web-vitals`.
- **Code Splitting**: Lazy loading for page components.
- **Vite Optimization**: Fast bundling and HMR.
- **IndexedDB Caching**: Reduces API calls significantly.
- **React Query**: Automatic deduplication and cache invalidation.

### Code Quality
- **ESLint 9.39.2**: Comprehensive code rules.
- **Prettier 3.4.1**: Code formatting.
- **TypeScript**: Strict mode enabled.
- **Type Checking**: `npm run typecheck`.

---

## Architecture

### System Design

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Client)                        │
├─────────────────────────────────────────────────────────────┤
│  React Components + Material-UI                             │
│  State: AuthContext, PortfolioContext, React Query          │
│  Caching: Memory Cache + IndexedDB (24h TTL)                │
│  API: Fetch with custom interceptors                        │
└─────────────────────────────────────────────────────────────┘
                            ↓ (HTTP/HTTPS)
┌─────────────────────────────────────────────────────────────┐
│                  Node.js Backend (Port 3000)                │
├─────────────────────────────────────────────────────────────┤
│  Middleware: CORS, Rate Limiter, JSON Parser                │
│  API Controllers:                                           │
│  ├─ /api/listings (CoinMarketCap)                           │
│  ├─ /api/categories, /api/info, /api/quote                  │
│  ├─ /api/news (MarketAux)                                   │
│  ├─ /api/stock/* (Finnhub)                                  │
│  ├─ /api/portfolio (MongoDB CRUD)                           │
│  ├─ /api/chat (Gemini AI)                                   │
│  └─ /api/currency (FreeCurrency)                            │
│  Cache: In-Memory Map (24h TTL)                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────┬──────────────────────┐
│  External APIs                       │  Services            │
├──────────────────────────────────────┼──────────────────────┤
│  • CoinMarketCap Pro                 │  • MongoDB Atlas     │
│  • Finnhub                           │  • Firebase Auth     │
│  • MarketAux                         │  • Supabase          │
│  • Google Generative AI (Gemini)     │  • Google Analytics  │
│  • FreeCurrency API                  │                      │
└──────────────────────────────────────┴──────────────────────┘
```

### Directory Structure
```
Cryptocurrency/
├── frontend-react/           # React 18 SPA with Vite
│   ├── src/
│   │   ├── pages/           # Lazy-loaded page components
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # Auth, Portfolio, MarketMode contexts
│   │   ├── hooks/           # Custom hooks (useFx)
│   │   ├── api.ts           # Crypto API client
│   │   ├── stockApi.ts      # Stock API client
│   │   ├── idbCache.ts      # IndexedDB caching layer
│   │   ├── performance.ts   # Web Vitals tracking
│   │   ├── firebase.ts      # Firebase config
│   │   ├── supabase.ts      # Supabase client
│   │   ├── __tests__/       # Unit tests (Vitest)
│   │   └── types.ts         # TypeScript interfaces
│   ├── tests/               # E2E tests (Playwright)
│   ├── vitest.config.ts     # Unit test config
│   ├── playwright.config.ts # E2E test config
│   ├── vite.config.ts       # Vite build config
│   └── .env                 # Frontend env vars
│
├── backend/
│   ├── server.js            # HTTP server & API routes
│   └── __tests__/           # Backend tests (Node.js test runner)
│       ├── unit.test.js
│       ├── integration.test.js
│       ├── rate-limit.test.js
│       └── server.test.js
│
├── .env                     # Backend env vars
├── package.json             # Root dependencies + scripts
├── tsconfig.json            # TypeScript config
├── eslint.config.cjs        # ESLint rules
└── README.md                # This file
```

---

## Installation

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm 8+
- Git

### API Keys Required
1. **CoinMarketCap Pro**: https://coinmarketcap.com/api
2. **Finnhub**: https://finnhub.io
3. **MarketAux**: https://marketaux.com
4. **Google Generative AI**: https://makersuite.google.com
5. **FreeCurrency**: https://freecurrencyapi.com
6. **Firebase**: https://firebase.google.com
7. **Supabase**: https://supabase.io
8. **MongoDB Atlas** (optional): https://mongodb.com/cloud/atlas

### Clone and Install

```bash
git clone https://github.com/ankit7610/Cryptocurrency.git
cd Cryptocurrency

npm run setup
```

---

## Configuration

### Root `.env` File

```env
# API Keys (Required)
CMC_API_KEY=your_coinmarketcap_api_key
FREE_CURRENCY_API_KEY=your_freecurrency_api_key
MARKETAUX_API_KEY=your_marketaux_api_key
FINNHUB_API_KEY=your_finnhub_api_key
GEMINI_API_KEY=your_google_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash

# Server Configuration
PORT=3000
DEFAULT_CURRENCY=INR

# Rate Limiting
RATE_LIMIT=1000
RATE_LIMIT_WINDOW_MS=86400000

# Database (Optional)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=crypto
MONGODB_COLLECTION=portfolio
```

### Frontend `.env` File (`frontend-react/.env`)

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Supabase Configuration
VITE_SUPABASE_URL=https://your-instance.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# API Configuration
VITE_API_BASE_URL=http://localhost:3000
```

---

## Running the Application

### Development Mode

**Terminal 1 - Backend (Port 3000)**
```bash
npm start
# or
npm run dev
```

**Terminal 2 - Frontend (Port 5173)**
```bash
cd frontend-react
npm run dev
```

Open http://localhost:5173 in your browser.

### Production Build

```bash
npm run build
npm start
```

---

## Testing

### Unit Tests (Vitest)

```bash
npm run test:frontend
cd frontend-react && npm run test:watch  # Watch mode
cd frontend-react && npm run test:ui     # UI mode
```

### E2E Tests (Playwright)

```bash
npm run test:e2e                    # Headless
npm run test:e2e:ui                 # Browser UI
cd frontend-react && npx playwright test --project=chromium --headed
```

### Backend Tests (Node.js)

```bash
npm test                    # All tests
npm run test:backend        # Unit tests only
npm run test:backend:integration  # Integration tests
```

### Full CI Pipeline

```bash
npm run ci    # Lint + typecheck + all tests
```

### Test Coverage

```bash
cd frontend-react && npm test -- --coverage
```

---

## CI/CD Pipeline

The project uses **GitHub Actions** for continuous integration. The workflows are defined in `.github/workflows/`:
- `ci.yml`: Runs linting, type checking, and all tests (backend, frontend, e2e) on every push and pull request.
- `tests.yml`: Specifically handles test execution across different environments.

### Available Scripts

```bash
npm run lint                 # ESLint check
npm run typecheck            # TypeScript check
npm run format               # Prettier format check
npm run test                 # All tests
npm run test:all             # Backend + Frontend + E2E
npm run ci                   # Full pipeline (lint + typecheck + test:all)
npm run build                # Build production frontend
npm run setup                # Fresh install
npm run clean                # Remove node_modules and dist
```

---

## API Reference

### Cryptocurrency Endpoints
- `GET /api/listings`: Fetch top cryptocurrencies.
- `GET /api/categories`: Fetch cryptocurrency categories.
- `GET /api/info?id={id}`: Get detailed info.
- `GET /api/quote?id={id}`: Get price quote.
- `GET /api/news`: Fetch crypto news.

### Stock Endpoints
- `GET /api/stock/symbols`: Fetch available stock symbols.
- `GET /api/stock/search?q={query}`: Search for stocks.
- `GET /api/stock/quote?symbol={symbol}`: Get stock quote.
- `GET /api/stock/news`: Fetch financial news.

### User Endpoints
- `GET /api/portfolio`: Fetch crypto portfolio.
- `PUT /api/portfolio`: Update crypto portfolio.
- `GET /api/stock/portfolio`: Fetch stock portfolio.
- `PUT /api/stock/portfolio`: Update stock portfolio.

### AI Chat
- `POST /api/chat`: Send message to Gemini AI.

---

## Database Schema

### MongoDB (Portfolio)
Stores user holdings for both crypto and stocks.

### Supabase (PostgreSQL)
Stores user profile information with RLS enabled.

### IndexedDB (Client Cache)
Stores API responses locally to reduce network requests and improve performance.

---

## Performance & Optimization
- **Caching**: Multi-layer caching (In-memory, IndexedDB, Server-side).
- **Code Splitting**: React.lazy and Suspense for faster initial load.
- **Web Vitals**: Monitoring performance metrics.
- **Rate Limiting**: Protecting the backend from abuse.

---

## License
MIT License - see LICENSE file for details

---

**Last Updated**: December 21, 2024
**Version**: 1.0.0
