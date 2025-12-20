# 🚀 Crypto Pulse - Professional Cryptocurrency Dashboard

A modern, production-ready cryptocurrency tracking application built with React, TypeScript, and Material-UI.

![Made with React](https://img.shields.io/badge/React-18.3-61dafb?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6?style=flat-square&logo=typescript)
![Material-UI](https://img.shields.io/badge/Material--UI-6.1-007fff?style=flat-square&logo=mui)
![Vite](https://img.shields.io/badge/Vite-5.4-646cff?style=flat-square&logo=vite)

## ✨ Features

### 📊 **Live Market Data**
- Real-time cryptocurrency prices from CoinMarketCap API
- 100+ cryptocurrencies with live price updates
- Market cap, volume, and price change tracking
- Beautiful sparkline charts for quick visualization

### 💼 **Portfolio Management**
- Track your cryptocurrency holdings
- Multi-currency support (INR, USD, EUR, GBP, JPY, AUD, CAD, CHF)
- Profit/Loss calculation with percentage gains
- Cost basis tracking in original purchase currency
- Visual portfolio distribution with pie charts
- Automatic currency conversion using live FX rates

### 📰 **Crypto News**
- Latest cryptocurrency news aggregation
- Beautiful card-based layout with images
- Source attribution and time-ago formatting
- Entity tagging and sentiment analysis
- Click to read full articles

### 🎨 **Beautiful UI/UX**
- **Dark/Light theme** with smooth transitions
- Gradient backgrounds and glassmorphism effects
- Smooth animations and micro-interactions
- Professional typography with Inter font
- Responsive design for mobile, tablet, and desktop
- Custom scrollbars and hover effects
- Loading states and empty state illustrations

### 📈 **Coin Details Modal**
- Comprehensive coin information
- Interactive price charts
- 1h, 24h, 7d, 30d price changes
- Market statistics and supply information
- Tags and external links
- Description and about section

### 🗂️ **Categories View**
- Browse coins by category
- Market cap and volume by category
- Search and filter functionality
- Professional table design with gradients

## 🛠️ Tech Stack

- **Framework:** React 18.3 with TypeScript
- **Build Tool:** Vite 5.4
- **UI Library:** Material-UI (MUI) 6.1
- **State Management:** React Query (TanStack Query)
- **HTTP Client:** Native Fetch API
- **Styling:** Emotion (CSS-in-JS) + Custom CSS
- **Icons:** Material Icons
- **Font:** Inter (Google Fonts)

## 📦 Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔧 Configuration

Create a `.env` file in the root directory:

```env
VITE_CMC_API_KEY=your_coinmarketcap_api_key
VITE_NEWS_API_KEY=your_news_api_key
VITE_FX_API_KEY=your_fx_api_key
```

## 🌐 API Endpoints

The application connects to a backend server that proxies requests to:
- **CoinMarketCap API** - Cryptocurrency data
- **MarketAux API** - Crypto news
- **FreeCurrencyAPI** - Exchange rates

## 📱 Responsive Design

- **Mobile First:** Optimized for mobile devices
- **Tablet:** Enhanced layouts for medium screens
- **Desktop:** Full feature experience with multi-column layouts

## 🎯 Key Features Breakdown

### Dashboard
- Search functionality with instant results
- Sort by market cap, price, 24h change, or name
- Category filters (All, DeFi, Layer 1, Meme coins)
- Grid layout with coin cards
- Market statistics overview

### Portfolio
- Add/edit/delete positions
- Multiple currency support
- Original purchase price preservation
- P/L calculations
- Distribution visualization
- Summary statistics cards

### News
- Modern card grid layout
- Image thumbnails
- Source badges
- Time-ago formatting
- Entity chips
- Sentiment indicators

### Categories
- Searchable table view
- Token count badges
- Market cap rankings
- Volume tracking
- Change indicators

## 🚀 Performance Optimizations

- Code splitting with React.lazy
- Memoized calculations with useMemo
- Optimized re-renders
- Image lazy loading
- Canvas-based charts (no heavy libraries)

## 🎨 Design System

### Colors
- **Primary:** Indigo (#6366f1 / #4f46e5)
- **Secondary:** Pink (#ec4899 / #db2777)
- **Success:** Green (#10b981)
- **Error:** Red (#ef4444)

### Typography
- **Font Family:** Inter
- **Weights:** 400, 500, 600, 700, 800

### Spacing
- **Base Unit:** 8px
- **Border Radius:** 12px (cards), 8px (buttons)

## 📄 License

This project is for educational purposes.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📧 Contact

For questions or feedback, please open an issue.

---

**Built with ❤️ using React & TypeScript**
