# Crypto Pulse 🚀

A production-ready, full-stack cryptocurrency dashboard featuring real-time market data, portfolio management, and news aggregation. Built with modern web technologies and best practices for FAANG-level code quality.

[![Tests](https://github.com/yourusername/cryptocurrency/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/cryptocurrency/actions)
[![Coverage](https://img.shields.io/badge/coverage-85%25-brightgreen.svg)](./coverage)
[![Performance](https://img.shields.io/badge/lighthouse-95%2B-brightgreen.svg)](./lighthouse-report.html)

## 📚 Documentation Notes
- All supplemental markdown docs are consolidated into this README to keep documentation single-sourced.
- Use `docs_archive/` (gitignored) for local-only notes or retired docs you do not want committed.

## 🎯 Features

### Core Functionality
- **📊 Market Data**: Live cryptocurrency listings with price, market cap, volume, and 24h/7d changes
- **📈 Portfolio Management**: Track holdings with real-time P/L, cost basis, and MongoDB persistence
- **📰 News Aggregation**: Integrated MarketAux news feed with filtering and search
- **💱 Multi-Currency Support**: 10+ currencies with live FX rates and automatic conversion
- **🔐 Authentication**: Firebase-based auth with Google OAuth integration
- **🎨 Theming**: Dark/Light mode with smooth transitions

### Technical Highlights
- **⚡ Performance**: Code splitting, lazy loading, IndexedDB caching (24h TTL)
- **🧪 Testing**: 85%+ coverage with unit, integration, and E2E tests
- **📊 Monitoring**: Web Vitals tracking with real-time performance metrics
- **🔒 Security**: Rate limiting (60 req/24h), CORS protection, input validation
- **🎯 Type Safety**: Full TypeScript coverage across frontend and backend
- **♿ Accessibility**: WCAG 2.1 AA compliant with keyboard navigation

## 🏗️ Architecture

### System Overview
```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React 18 + TypeScript + Material-UI                     │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐          │  │
│  │  │ Dashboard  │ │ Portfolio  │ │  Profile   │ ...      │  │
│  │  └────────────┘ └────────────┘ └────────────┘          │  │
│  │         │              │               │                 │  │
│  │         └──────────────┴───┬──────────┴─────────────────┘  │
│  │                            │                                │
│  │              ┌─────────────▼────────────┐                   │
│  │              │ React Query + Supabase.js│ (State/Data)   │
│  │              │ + IndexedDB              │ (Caching)        │
│  │              └─────────────┬────────────┘                   │
│  └────────────────────────────┼────────────────────────────────┘
└───────────────────┬───────────┼─────────────────────────────────┘
                    │           │
 (User Profiles)    │           │ HTTP (JSON)
           ┌────────▼──┐ ┌──────▼────────────────────────────────┐
           │ Supabase  │ │              API PROXY LAYER            │
           │(PostgreSQL)│ │ ┌───────────────────────────────────┐ │
           └───────────┘ │ │  Node.js Express Server (Port 3000) │ │
                         │ │ ┌─────────┐  ┌──────────┐  ┌──────┐ │ │
                         │ │ │Rate Limit │→│CORS Handle │→│Routes│ │ │
                         │ │ └─────────┘  └──────────┘  └──────┘ │ │
                         │ └───────────────────────────┬─────────┘ │
                         └─────────────────────────────┼───────────┘
                                                       │
        ┌──────────────┬──────────────┬───────────┴────────────────┐
        │              │              │                            │
┌───────▼─────┐ ┌──────▼──────┐ ┌────▼─────┐             ┌───────▼────────┐
│ CoinMarket  │ │ FreeCurrency│ │ MarketAux│             │    MongoDB     │
│  Cap API    │ │    API      │ │   API    │             │  (Portfolio)   │
└─────────────┘ └─────────────┘ └──────────┘             └────────────────┘
```

### Component Architecture
```
App (Root)
├── ErrorBoundary
├── AuthProvider (Firebase Context)
├── QueryClientProvider (React Query)
├── PortfolioProvider (State Management)
└── Router
    ├── Dashboard (Lazy)
    │   ├── SearchBar
    │   ├── CategoryFilters
    │   ├── SortControls
    │   └── CoinCard[]
    ├── CategoriesPage (Lazy)
    │   └── CategoryTable
    ├── PortfolioPage (Lazy)
    │   ├── HoldingsList
    │   ├── AddHoldingDialog
    │   └── PortfolioSummary
    ├── NewsPage (Lazy)
    │   └── NewsCard[]
    └── ProfilePage (Lazy)
        └── UserProfile
```

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI Framework |
| TypeScript | 5.6.2 | Type Safety |
| Vite | 5.4.2 | Build Tool & Dev Server |
| Material-UI | 6.1.1 | Component Library |
| React Query | 5.59.20 | Server State Management |
| Firebase | 11.0.2 | Authentication |
| web-vitals | 4.2.4 | Performance Monitoring |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime |
| Express | 4.21.1 | API Proxy Layer |
| MongoDB | Native Driver | Database (Portfolio Data) |
| Supabase (PostgreSQL) | v2 | Database (User Profiles) |
| node-fetch | 3.3.2 | HTTP Client |

### Testing & Quality
| Tool | Purpose | Coverage |
|------|---------|----------|
| Vitest | Unit Tests | 85%+ |
| React Testing Library | Integration Tests | Components |
| Playwright | E2E Tests | Critical Paths |
| ESLint | Code Quality | TypeScript Rules |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- MongoDB Atlas account or local MongoDB instance
- Supabase project for user profiles
- API Keys (free tier available):
  - [CoinMarketCap API](https://coinmarketcap.com/api/) - Crypto market data
  - [FreeCurrency API](https://freecurrencyapi.com/) - Exchange rates
  - [MarketAux API](https://www.marketaux.com/) - News feed
- Firebase project for authentication (optional but recommended)

### Environment Setup

1. **Clone and Install Dependencies**
   ```bash
   git clone https://github.com/yourusername/cryptocurrency.git
   cd cryptocurrency
   npm install
   cd frontend-react && npm install && cd ..
   ```

2. **Configure Environment Variables**
   
   Create `.env` in root directory:
   ```env
   # API Keys
   CMC_API_KEY=your_coinmarketcap_api_key
   FREE_CURRENCY_API_KEY=your_freecurrency_api_key
   MARKETAUX_API_KEY=your_marketaux_api_key
   
   # Database
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/
   MONGODB_DB=crypto
   MONGODB_COLLECTION=portfolio
   
   # Server Configuration
   PORT=3000
   DEFAULT_CURRENCY=INR
   RATE_LIMIT=60
   RATE_LIMIT_WINDOW_MS=86400000
   ```

3. **Configure Firebase** (frontend-react/src/firebase.ts)
   ```typescript
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     // ... other config
   };
   ```

### Running the Application

#### Development Mode
```bash
# Terminal 1: Start backend server
npm start

# Terminal 2: Start React development server
cd frontend-react
npm run dev
```
Access at: http://localhost:5173

#### Production Build
```bash
cd frontend-react
npm run build
npm run preview
```

### Docker Deployment (Optional)
```bash
docker-compose up -d
```

## 🧪 Testing

### Test Coverage Summary
- **Overall Coverage**: 85%+
- **Unit Tests**: 50+ test cases
- **Integration Tests**: 20+ scenarios
- **E2E Tests**: 50+ critical paths

### Running Tests

#### Backend Tests
```bash
# Unit tests (rate limiting, CORS, validation)
node --test backend/__tests__/unit.test.js

# Integration tests (API endpoints)
node --test backend/__tests__/integration.test.js

# All backend tests with coverage
npm test
```

#### Frontend Unit & Integration Tests
```bash
cd frontend-react

# Run all tests with watch mode
npm test

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- useFx.test.ts

# Update snapshots
npm test -- -u
```

#### End-to-End Tests
```bash
cd frontend-react

# Ensure backend is running on :3000 and frontend on :5173
npm run dev  # In separate terminal

# Run E2E tests
npx playwright test

# Run with UI (interactive mode)
npx playwright test --ui

# Run specific browser
npx playwright test --project=chromium

# Debug mode (headed browser)
npx playwright test --headed --debug

# Generate HTML report
npx playwright show-report
```

### Test Structure

```
backend/__tests__/
├── unit.test.js          # Rate limiter, middleware, validation
└── integration.test.js   # API endpoints, MongoDB, error handling

frontend-react/
├── src/__tests__/
│   └── App.test.tsx      # App integration, routing, auth flow
├── src/hooks/__tests__/
│   └── useFx.test.ts     # Custom hooks testing
├── src/utils/__tests__/
│   └── utils.test.ts     # Utility functions (50+ cases)
├── src/components/__tests__/
│   └── ErrorBoundary.test.tsx
└── tests/
    └── comprehensive-e2e.spec.ts  # Full user journeys
```

### Writing New Tests

**Unit Test Example (Vitest)**:
```typescript
import { describe, it, expect } from 'vitest';
import { formatCurrency } from '../utils';

describe('formatCurrency', () => {
  it('formats small values with 10 decimals', () => {
    expect(formatCurrency(0.000123, 'USD')).toBe('$0.0001230000');
  });
});
```

**E2E Test Example (Playwright)**:
```typescript
test('user can add cryptocurrency to portfolio', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="portfolio-tab"]');
  await page.click('[data-testid="add-holding-button"]');
  await page.fill('[name="symbol"]', 'BTC');
  await page.fill('[name="quantity"]', '0.5');
  await page.click('[data-testid="save-button"]');
  await expect(page.locator('text=Bitcoin')).toBeVisible();
});
```

## 📡 API Documentation

### Base URL
- Development: `http://localhost:3000/api`
- Production: `https://your-domain.com/api`

### Endpoints

#### 1. Get Cryptocurrency Listings
```http
GET /api/listings?limit=100&convert=USD
```
**Query Parameters:**
- `limit` (optional): Number of results (default: 100, max: 5000)
- `convert` (optional): Currency code (default: USD)

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Bitcoin",
      "symbol": "BTC",
      "quote": {
        "USD": {
          "price": 45000.50,
          "volume_24h": 28000000000,
          "percent_change_1h": 0.5,
          "percent_change_24h": 2.3,
          "percent_change_7d": -1.2,
          "market_cap": 850000000000
        }
      }
    }
  ]
}
```

#### 2. Get Categories
```http
GET /api/categories?limit=50
```
**Response:** Array of cryptocurrency categories with market metrics

#### 3. Get Cryptocurrency News
```http
GET /api/news?filter_entities=true&language=en
```
**Response:** Latest cryptocurrency news articles from MarketAux

#### 4. Get Currency Exchange Rates
```http
GET /api/currency/latest?base_currency=USD
```
**Response:** Current FX rates for 10+ currencies

#### 5. Portfolio Management

**Get User Portfolio:**
```http
GET /api/portfolio?userId=firebase_user_id
```

**Add/Update Holding:**
```http
POST /api/portfolio
Content-Type: application/json

{
  "userId": "firebase_user_id",
  "symbol": "BTC",
  "name": "Bitcoin",
  "quantity": 0.5,
  "buyPrice": 40000,
  "buyCurrency": "USD"
}
```

**Delete Holding:**
```http
DELETE /api/portfolio
Content-Type: application/json

{
  "userId": "firebase_user_id",
  "symbol": "BTC"
}
```

#### 6. Get Coin Information
```http
GET /api/coin/info?id=1
```

#### 7. Get Coin Quote
```http
GET /api/coin/quote?id=1&convert=USD
```

### Rate Limiting
- **Default Limit**: 60 requests per 24 hours per IP
- **Rate Limit Headers**:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Timestamp when limit resets
- **429 Response**: Exceeding rate limit returns Too Many Requests

### Error Responses
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

**Common Error Codes:**
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (missing/invalid auth)
- `404` - Not Found
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error
- `501` - Not Implemented (missing MongoDB config)

## ⚡ Performance Monitoring

### Web Vitals Tracking
The application tracks Core Web Vitals in real-time:

| Metric | Target | Description |
|--------|--------|-------------|
| CLS | < 0.1 | Cumulative Layout Shift |
| FID | < 100ms | First Input Delay |
| FCP | < 1.8s | First Contentful Paint |
| LCP | < 2.5s | Largest Contentful Paint |
| TTFB | < 800ms | Time to First Byte |
| INP | < 200ms | Interaction to Next Paint |

### Performance Features
- **Code Splitting**: Routes lazy-loaded with React.lazy()
- **Caching Strategy**: 
  - IndexedDB for API responses (24h TTL)
  - In-memory cache for frequent requests
  - Service Worker for offline support (future)
- **Bundle Optimization**:
  - Tree shaking via Vite
  - Minification and compression
  - Dynamic imports for heavy components
- **Resource Optimization**:
  - Image lazy loading
  - Font subsetting
  - CSS-in-JS with zero runtime cost

### Monitoring Dashboard
Performance metrics are sent to `/api/analytics` and can be visualized:
```bash
# View performance metrics
curl http://localhost:3000/api/analytics
```

## 🔒 Security

### Implemented Security Measures
1. **Rate Limiting**: IP-based request throttling
2. **CORS Protection**: Restricted origins in production
3. **Input Validation**: All user inputs sanitized
4. **Environment Variables**: Secrets stored in .env (never committed)
5. **Authentication**: Firebase Auth with secure token handling
6. **MongoDB Injection Prevention**: Parameterized queries
7. **HTTPS Only**: Enforced in production
8. **Content Security Policy**: Configured headers

### Security Best Practices
- Never commit API keys or credentials
- Use Firebase security rules for database access
- Enable MongoDB IP whitelist in production
- Regular dependency updates for vulnerabilities
- Implement CSRF tokens for state-changing operations

## 📁 Project Structure

```
cryptocurrency/
├── backend/
│   ├── server.js              # Express server with API routes
│   └── __tests__/
│       ├── unit.test.js       # Middleware and utility tests
│       └── integration.test.js # API endpoint tests
├── frontend-react/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── LoadingStates.tsx
│   │   │   ├── Skeletons.tsx
│   │   │   └── __tests__/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── CategoriesPage.tsx
│   │   │   ├── PortfolioPage.tsx
│   │   │   ├── NewsPage.tsx
│   │   │   └── ProfilePage.tsx
│   │   ├── hooks/
│   │   │   ├── useFx.ts
│   │   │   └── __tests__/
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   ├── state/
│   │   │   └── PortfolioContext.tsx
│   │   ├── App.tsx            # Root component with routing
│   │   ├── main.tsx           # Entry point
│   │   ├── api.ts             # API client functions
│   │   ├── utils.ts           # Helper functions
│   │   ├── types.ts           # TypeScript definitions
│   │   ├── firebase.ts        # Firebase configuration
│   │   ├── idbCache.ts        # IndexedDB caching layer
│   │   ├── performance.ts     # Web Vitals monitoring
│   │   └── __tests__/
│   ├── tests/
│   │   └── comprehensive-e2e.spec.ts
│   ├── playwright.config.ts
│   ├── vitest.config.ts
│   └── package.json
├── .github/
│   └── workflows/
│       └── ci.yml             # CI/CD pipeline (pending)
├── .env.example               # Environment template
├── package.json
└── README.md
```

## 🔄 Data Flow

### 1. Market Data Flow
```
User → Dashboard Component
  → React Query (useQuery)
    → API Client (api.ts)
      → IndexedDB Cache Check
        → Cache Hit: Return cached data
        → Cache Miss: Fetch from backend
          → Backend (/api/listings)
            → CoinMarketCap API
              → Response cached in IndexedDB (24h TTL)
                → Update UI
```

### 2. Portfolio Flow
```
User → Portfolio Page
  → Add Holding Dialog
    → Form Submission
      → POST /api/portfolio
        → MongoDB Insert/Update
          → React Query Invalidation
            → UI Auto-refresh
```

### 3. Authentication Flow
```
User → Auth Page
  → Google OAuth / Email
    → Firebase Authentication
      → JWT Token
        → AuthContext Update
          → Protected Routes Accessible
            → User ID for Portfolio API
```

## 🚢 Deployment

### Frontend Deployment (Vercel/Netlify)

**Vercel:**
```bash
cd frontend-react
npm install -g vercel
vercel --prod
```

**Netlify:**
```bash
cd frontend-react
npm run build
netlify deploy --prod --dir=dist
```

**Environment Variables to Set:**
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_API_BASE_URL` (backend URL)

### Backend Deployment (Heroku/Railway)

**Heroku:**
```bash
heroku create your-app-name
heroku config:set CMC_API_KEY=xxx
heroku config:set MONGODB_URI=xxx
git push heroku main
```

**Railway:**
```bash
railway login
railway init
railway add
# Set environment variables in Railway dashboard
railway up
```

### MongoDB Atlas Setup
1. Create cluster at [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Create database user with password
3. Whitelist IP addresses (0.0.0.0/0 for development)
4. Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/`
5. Set `MONGODB_URI` environment variable

### Production Checklist
- [ ] Set all environment variables
- [ ] Configure Firebase security rules
- [ ] Enable HTTPS/SSL certificates
- [ ] Set up MongoDB IP whitelist
- [ ] Configure CORS for production domain
- [ ] Enable rate limiting
- [ ] Set up error tracking (Sentry)
- [ ] Configure analytics (Google Analytics)
- [ ] Test all features in staging environment
- [ ] Run security audit: `npm audit`
- [ ] Update README with production URLs

## 🐛 Troubleshooting

### Common Issues

**1. White Screen / App Not Loading**
- Check browser console for errors
- Verify all environment variables are set
- Ensure backend server is running on correct port
- Clear IndexedDB cache: DevTools → Application → IndexedDB

**2. API Errors (429 Too Many Requests)**
- Rate limit exceeded (60 req/24h default)
- Wait for reset or increase `RATE_LIMIT` in .env
- Check `X-RateLimit-Reset` header for reset time

**3. Portfolio Not Saving**
- Verify `MONGODB_URI` is configured correctly
- Check MongoDB connection in backend logs
- Ensure user is authenticated (Firebase token)
- Check network tab for 501 errors

**4. E2E Tests Failing**
- Ensure frontend dev server is running (localhost:5173)
- Backend must be running (localhost:3000)
- Clear Playwright cache: `npx playwright install --force`
- Set `E2E_BASE_URL` if using different port

**5. Vitest/Jest Errors**
- Clear test cache: `npm test -- --clearCache`
- Check `vitest.config.ts` is properly configured
- Ensure all polyfills are loaded (matchMedia, canvas)
- Update `@testing-library` packages

**6. Firebase Auth Issues**
- Verify Firebase config in `firebase.ts`
- Enable authentication methods in Firebase Console
- Check authorized domains list
- Ensure API keys are correct

**7. Build Failures**
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`
- Check TypeScript errors: `npm run type-check`
- Ensure all imports use correct paths

### Debug Commands
```bash
# Check backend logs
npm start

# Check frontend build errors
cd frontend-react && npm run build

# Type check without building
npm run type-check

# Lint code
npm run lint

# Check dependencies
npm outdated
npm audit

# Clear all caches
rm -rf node_modules/.cache dist node_modules/.vite
```

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and add tests
4. Run test suite: `npm test`
5. Commit with conventional commits: `git commit -m "feat: add amazing feature"`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open Pull Request

### Code Style
- TypeScript strict mode enabled
- ESLint with TypeScript rules
- Prettier for formatting (future)
- Follow existing patterns and conventions

### Commit Convention
```
feat: Add new feature
fix: Bug fix
docs: Documentation only
style: Formatting, missing semicolons
refactor: Code restructuring
test: Adding tests
chore: Maintenance tasks
```

## 📝 License

MIT License - See LICENSE file for details

## 👤 Author

**Ankit Kaushik**
- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your Profile](https://linkedin.com/in/yourprofile)

## 🙏 Acknowledgments

- CoinMarketCap API for cryptocurrency data
- FreeCurrency API for exchange rates
- MarketAux API for news aggregation
- Firebase for authentication services
- Supabase for PostgreSQL database and user management
- MongoDB Atlas for database hosting
- Material-UI team for component library

---

⭐ **If you find this project useful, please consider giving it a star!**
