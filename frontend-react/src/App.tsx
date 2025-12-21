import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { CssBaseline, ThemeProvider, createTheme, Container, AppBar, Toolbar, Typography, Tabs, Tab, Select, MenuItem, IconButton, Box, Stack, CircularProgress, TextField, InputAdornment, Avatar, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useMemo, useState, useEffect, lazy, Suspense } from 'react';
import { Brightness4, Brightness7, Logout, Search, ShowChart, CurrencyBitcoin } from '@mui/icons-material';
import { getListings, getCategories, getNews } from './api';
import { PortfolioProvider, usePortfolio } from './state/PortfolioContext';
import { MarketModeProvider, useMarketMode } from './context/MarketModeContext';
import AuthPage from './pages/AuthPage';

// Lazy load page components for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));
const PortfolioPage = lazy(() => import('./pages/PortfolioPage'));
const NewsPage = lazy(() => import('./pages/NewsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const StockDashboard = lazy(() => import('./pages/StockDashboard'));
const StockNewsPage = lazy(() => import('./pages/StockNewsPage'));
const StockCategoriesPage = lazy(() => import('./pages/StockCategoriesPage'));
const StockPortfolioPage = lazy(() => import('./pages/StockPortfolioPage'));
import { useFx } from './hooks/useFx';
import { PageTransition } from './components/PageTransition';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatWidget } from './components/ChatWidget';

const queryClient = new QueryClient();

function Shell() {
  const [tab, setTab] = useState(0);
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const { currency, setCurrency, fxRates } = usePortfolio();
  const { user, loading, logout } = useAuth();
  const { mode: marketMode, toggleMode: toggleMarketMode } = useMarketMode();
  useFx();

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') {
      setMode(saved);
    } else {
      setMode(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', mode);
    document.documentElement.setAttribute('data-theme', mode);
    document.documentElement.classList.toggle('theme-dark', mode === 'dark');
    document.documentElement.style.scrollBehavior = 'smooth';
  }, [mode]);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: mode === 'dark' ? '#00D09C' : '#00D09C',
            light: mode === 'dark' ? '#1DE4B0' : '#1DE4B0',
            dark: mode === 'dark' ? '#00B881' : '#00B881',
          },
          secondary: {
            main: mode === 'dark' ? '#44C1F0' : '#44C1F0',
            light: mode === 'dark' ? '#6DD0F5' : '#6DD0F5',
          },
          background: {
            default: mode === 'dark' ? '#0a0f1a' : '#f5f7fa',
            paper: mode === 'dark' ? '#131a2b' : '#ffffff',
          },
          success: {
            main: mode === 'dark' ? '#00D09C' : '#00B386',
            light: mode === 'dark' ? '#1DE4B0' : '#00D09C',
          },
          error: {
            main: mode === 'dark' ? '#EB5B3C' : '#EB5B3C',
            light: mode === 'dark' ? '#F08070' : '#F08070',
          },
          warning: {
            main: mode === 'dark' ? '#FF9800' : '#FF9800',
          },
          info: {
            main: mode === 'dark' ? '#44C1F0' : '#44C1F0',
          },
          text: {
            primary: mode === 'dark' ? '#ECEFF1' : '#44475B',
            secondary: mode === 'dark' ? '#9E9E9E' : '#7C7E8C',
          },
        },
        typography: {
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
          h4: {
            fontWeight: 500,
            fontSize: '1.5rem',
            color: mode === 'dark' ? '#ECEFF1' : '#44475B',
          },
          h5: {
            fontWeight: 500,
            fontSize: '1.25rem',
            color: mode === 'dark' ? '#ECEFF1' : '#44475B',
          },
          h6: {
            fontWeight: 500,
            fontSize: '1rem',
            color: mode === 'dark' ? '#ECEFF1' : '#44475B',
          },
          body1: {
            fontSize: '0.875rem',
            color: mode === 'dark' ? '#ECEFF1' : '#44475B',
          },
          body2: {
            fontSize: '0.8125rem',
            color: mode === 'dark' ? '#9E9E9E' : '#7C7E8C',
          },
        },
        shape: {
          borderRadius: 8,
        },
        components: {
          MuiCard: {
            styleOverrides: {
              root: {
                boxShadow: mode === 'dark' 
                  ? '0 2px 8px rgba(0, 0, 0, 0.3)'
                  : '0 1px 2px rgba(0, 0, 0, 0.05)',
                border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #EBEBEB',
                borderRadius: 8,
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: mode === 'dark'
                    ? '0 4px 12px rgba(0, 0, 0, 0.4)'
                    : '0 2px 4px rgba(0, 0, 0, 0.08)',
                },
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                fontWeight: 500,
                borderRadius: 6,
                fontSize: '0.9rem',
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: 'none',
                },
              },
              contained: {
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                },
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                fontWeight: 500,
                fontSize: '0.8rem',
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
              },
            },
          },
          MuiTab: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.95rem',
                minHeight: 48,
              },
            },
          },
        },
      }),
    [mode]
  );

  const listings = useQuery({ queryKey: ['listings'], queryFn: getListings });
  const categories = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  const news = useQuery({ queryKey: ['news'], queryFn: getNews });

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: mode === 'dark'
              ? '#0f1419'
              : '#F8F9FA',
          }}
        >
          <CircularProgress size={60} sx={{ color: '#00D09C' }} />
        </Box>
      </ThemeProvider>
    );
  }

  // Show auth page if user is not logged in
  if (!user) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthPage />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: mode === 'dark'
            ? '#1a1f26'
            : '#FFFFFF',
          borderBottom: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #EBEBEB',
          boxShadow: 'none',
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, minHeight: '60px', px: 2 }}>
          <Stack direction="row" spacing={3} alignItems="center">
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #00D09C 0%, #44C1F0 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.3rem',
                fontWeight: 700,
                color: 'white',
              }}
            >
              ₿
            </Box>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 500, 
                color: mode === 'dark' ? '#ECEFF1' : '#44475B',
                fontSize: '1.1rem',
                letterSpacing: '-0.01em',
              }}
            >
              {marketMode === 'crypto' ? 'Crypto Pulse' : 'Stock Market'}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <ToggleButtonGroup
              value={marketMode}
              exclusive
              onChange={() => toggleMarketMode()}
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  px: 1.5,
                  py: 0.5,
                  fontSize: '0.75rem',
                  textTransform: 'none',
                  border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #EBEBEB',
                },
              }}
            >
              <ToggleButton value="crypto">
                <CurrencyBitcoin sx={{ fontSize: '1rem', mr: 0.5 }} />
                Crypto
              </ToggleButton>
              <ToggleButton value="stock">
                <ShowChart sx={{ fontSize: '1rem', mr: 0.5 }} />
                Stocks
              </ToggleButton>
            </ToggleButtonGroup>
            <Select
              size="small"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as any)}
              inputProps={{ 'aria-label': 'Select currency' }}
              sx={{
                minWidth: 90,
                fontSize: '0.8125rem',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#EBEBEB',
                },
              }}
            >
              {['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF'].map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </Select>
            <IconButton
              onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
              size="small"
              aria-label="Toggle theme"
              sx={{
                color: mode === 'dark' ? '#9E9E9E' : '#7C7E8C',
                '&:hover': { 
                  bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F5F5F5',
                },
              }}
            >
              {mode === 'dark' ? <Brightness7 fontSize="small" /> : <Brightness4 fontSize="small" />}
            </IconButton>
            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton
                onClick={() => setTab(4)}
                size="small"
                sx={{
                  '&:hover': { 
                    bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#F5F5F5',
                  },
                }}
                title="Profile"
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: '#00D09C',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                  }}
                >
                  {user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.875rem' }}>
                  {user?.displayName || user?.email?.split('@')[0]}
                </Typography>
              </Box>
            </Stack>
            <IconButton
              onClick={logout}
              size="small"
              sx={{
                color: '#EB5B3C',
                '&:hover': { 
                  bgcolor: 'rgba(235, 91, 60, 0.08)',
                },
              }}
              title="Logout"
            >
              <Logout fontSize="small" />
            </IconButton>
          </Stack>
        </Toolbar>
        <Box sx={{ borderBottom: 1, borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#EBEBEB' }}>
          <Container maxWidth="xl">
            <Tabs 
              value={tab > 3 ? false : tab}
              onChange={(_, v) => setTab(v)} 
              textColor="inherit"
              variant="fullWidth"
              TabIndicatorProps={{
                style: {
                  backgroundColor: mode === 'dark' ? '#00D09C' : '#00D09C',
                  height: 2,
                }
              }}
              sx={{
                minHeight: '48px',
                '.MuiTab-root': {
                  color: mode === 'dark' ? '#9E9E9E' : '#7C7E8C',
                  fontWeight: 400,
                  fontSize: '0.9rem',
                  textTransform: 'none',
                  minHeight: '48px',
                  transition: 'all 0.2s ease',
                  flex: 1,
                  maxWidth: 'none',
                  '&.Mui-selected': {
                    color: mode === 'dark' ? '#00D09C' : '#44475B',
                    fontWeight: 600,
                  },
                  '&:hover': {
                    color: mode === 'dark' ? '#00D09C' : '#44475B',
                  },
                },
              }}
            >
              <Tab label="Explore" />
              <Tab label="Categories" />
              <Tab label="Portfolio" />
              <Tab label="News" />
            </Tabs>
          </Container>
        </Box>
      </AppBar>
      <Container maxWidth="xl" sx={{ py: 4, px: { xs: 2, sm: 3, md: 4 }, minHeight: 'calc(100vh - 200px)' }}>
        <Suspense fallback={
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            <CircularProgress size={60} sx={{ color: '#00D09C' }} />
          </Box>
        }>
          {tab === 0 && (
            <PageTransition>
              {marketMode === 'crypto' ? (
                <Dashboard 
                  listings={Array.isArray(listings.data?.data) ? listings.data.data : []} 
                  isLoading={listings.isLoading} 
                />
              ) : (
                <StockDashboard />
              )}
            </PageTransition>
          )}
          {tab === 1 && (
            <PageTransition>
              {marketMode === 'crypto' ? (
                <CategoriesPage
                  categories={Array.isArray(categories.data?.data) ? categories.data.data : []}
                  isLoading={categories.isLoading}
                  currency={currency}
                  fxRates={fxRates}
                />
              ) : (
                <StockCategoriesPage />
              )}
            </PageTransition>
          )}
          {tab === 2 && (
            <PageTransition>
              {marketMode === 'crypto' ? (
                <PortfolioPage coins={Array.isArray(listings.data?.data) ? listings.data.data : []} />
              ) : (
                <StockPortfolioPage />
              )}
            </PageTransition>
          )}
          {tab === 3 && (
            <PageTransition>
              {marketMode === 'crypto' ? (
                <NewsPage items={Array.isArray(news.data?.data) ? news.data.data : []} isLoading={news.isLoading} />
              ) : (
                <StockNewsPage />
              )}
            </PageTransition>
          )}
          {tab === 4 && (
            <PageTransition>
              <ProfilePage />
            </PageTransition>
          )}
        </Suspense>
      </Container>

      {tab === 0 && <ChatWidget />}
      
      <Box
        component="footer"
        sx={{
          py: 2,
          px: 2,
          mt: 'auto',
          borderTop: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #EBEBEB',
          background: mode === 'dark' ? '#1a1f26' : '#FAFAFA',
        }}
      >
        <Container maxWidth="xl">
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
          >
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
              © {new Date().getFullYear()} Crypto Pulse. Real-time cryptocurrency data.
            </Typography>
            <Stack direction="row" spacing={2.5}>
              <Typography
                component="a"
                href="#"
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: '0.8125rem', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
              >
                About
              </Typography>
              <Typography
                component="a"
                href="#"
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: '0.8125rem', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
              >
                API
              </Typography>
              <Typography
                component="a"
                href="#"
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: '0.8125rem', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
              >
                Docs
              </Typography>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MarketModeProvider>
          <PortfolioProvider>
            <Shell />
          </PortfolioProvider>
        </MarketModeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
