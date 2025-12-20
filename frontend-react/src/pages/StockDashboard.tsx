import {
  Card,
  CardContent,
  Grid,
  Typography,
  Chip,
  Stack,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Select,
  Box,
  Divider,
  Avatar,
  Paper,
  InputAdornment
} from '@mui/material';
import { useMemo, useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, ShowChart, Search } from '@mui/icons-material';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceDot
} from 'recharts';
import { Stock, StockQuote } from '../stockTypes';
import { usePortfolio } from '../state/PortfolioContext';
import { formatCurrency, convert } from '../utils';
import { getStockSymbols, getStockQuote, getBatchQuotes } from '../stockApi';

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const chartData = data.map((value, index) => ({ index, value }));

  return (
    <ResponsiveContainer width="100%" height={30}>
      <LineChart data={chartData}>
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke={color} 
          strokeWidth={2} 
          dot={false}
          isAnimationActive={true}
          animationDuration={800}
          animationEasing="ease-in-out"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function StockCard({
  stock,
  quote,
  onOpen,
  currency,
  fxRates
}: {
  stock: Stock;
  quote?: StockQuote;
  onOpen: () => void;
  currency: string;
  fxRates: Record<string, number>;
}) {
  const change = quote?.dp ?? 0;
  const price = quote?.c ?? 0;
  const isPositive = change >= 0;
  const priceConverted = convert(price, 'USD', currency, fxRates) || 0;

  return (
    <Card 
      onClick={onOpen} 
      sx={{ 
        cursor: 'pointer',
        height: '100%',
        borderRadius: '8px',
        '&:hover': {
          boxShadow: (theme) => theme.palette.mode === 'dark' 
            ? '0 4px 12px rgba(0, 0, 0, 0.4)'
            : '0 4px 12px rgba(0, 0, 0, 0.1)',
        },
      }}
    >
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
          <Avatar 
            sx={{ 
              width: 40, 
              height: 40,
              background: (theme) => theme.palette.mode === 'dark' 
                ? 'rgba(0, 208, 156, 0.1)'
                : '#F5F7FA',
              border: '1px solid',
              borderColor: (theme) => theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.1)'
                : '#E8EAED',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: (theme) => theme.palette.mode === 'dark' ? '#00D09C' : '#44475B',
            }}
          >
            {stock.symbol?.slice(0, 2).toUpperCase()}
          </Avatar>
          <Box flex={1}>
            <Typography variant="body1" fontWeight={600} sx={{ fontSize: '0.875rem', mb: 0.25 }}>
              {stock.displaySymbol || stock.symbol}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }} noWrap>
              {stock.description}
            </Typography>
          </Box>
        </Stack>
        
        <Stack spacing={1.5}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              Price
            </Typography>
            <Typography variant="body1" fontWeight={600} sx={{ fontSize: '0.875rem' }}>
              {quote ? formatCurrency(priceConverted, currency, {}) : '—'}
            </Typography>
          </Stack>

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              Change
            </Typography>
            <Typography 
              variant="body2" 
              fontWeight={600}
              sx={{ 
                fontSize: '0.75rem',
                color: isPositive ? '#00B386' : '#EB5B3C',
              }}
            >
              {quote ? `${isPositive ? '+' : ''}${change.toFixed(2)}%` : '—'}
            </Typography>
          </Stack>

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              Day Range
            </Typography>
            <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.75rem' }}>
              {quote ? `${formatCurrency(convert(quote.l, 'USD', currency, fxRates) || 0, currency, {})} - ${formatCurrency(convert(quote.h, 'USD', currency, fxRates) || 0, currency, {})}` : '—'}
            </Typography>
          </Stack>

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              Open
            </Typography>
            <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.75rem' }}>
              {quote ? formatCurrency(convert(quote.o, 'USD', currency, fxRates) || 0, currency, {}) : '—'}
            </Typography>
          </Stack>

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              Prev Close
            </Typography>
            <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.75rem' }}>
              {quote ? formatCurrency(convert(quote.pc, 'USD', currency, fxRates) || 0, currency, {}) : '—'}
            </Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function StockDashboard() {
  const [selected, setSelected] = useState<{ stock: Stock; quote?: StockQuote } | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('popular');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(0);
  const itemsPerPage = 12;
  const { currency, fxRates } = usePortfolio();

  const { data: symbols = [], isLoading } = useQuery({
    queryKey: ['stockSymbols'],
    queryFn: () => getStockSymbols('US'),
    staleTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Popular stocks
  const popularSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM', 'V', 'WMT', 'JNJ', 'PG', 'BAC', 'DIS', 'NFLX', 'ORCL', 'CSCO', 'INTC', 'AMD', 'CRM'];
  
  const popularStocks = useMemo(() => {
    return symbols.filter(s => popularSymbols.includes(s.symbol)).slice(0, 50);
  }, [symbols]);

  const { data: quotes = {} } = useQuery({
    queryKey: ['stockQuotes', popularStocks.map(s => s.symbol)],
    queryFn: () => getBatchQuotes(popularStocks.map(s => s.symbol)),
    enabled: popularStocks.length > 0,
    staleTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Base list before sorting (search + category filters only)
  const baseFiltered = useMemo(() => {
    const query = search.trim().toLowerCase();
    let items = query
      ? symbols.filter((s) => s?.symbol?.toLowerCase().includes(query) || s?.description?.toLowerCase().includes(query))
      : popularStocks;
    
    if (category !== 'all') {
      items = items.filter(s => {
        const desc = s.description?.toLowerCase() || '';
        if (category === 'tech') return desc.includes('tech') || desc.includes('software') || desc.includes('computer');
        if (category === 'finance') return desc.includes('bank') || desc.includes('financial') || desc.includes('insurance');
        if (category === 'healthcare') return desc.includes('health') || desc.includes('pharma') || desc.includes('bio');
        return true;
      });
    }
    return items;
  }, [symbols, popularStocks, search, category]);

  // Fetch quotes for the first 80 filtered stocks to power sorting (with cache)
  const symbolsForQuotes = useMemo(
    () => baseFiltered.slice(0, 80).map((s) => s.symbol),
    [baseFiltered]
  );

  const { data: dynamicQuotes = {} } = useQuery({
    queryKey: ['stockQuotesDynamic', symbolsForQuotes],
    queryFn: () => getBatchQuotes(symbolsForQuotes),
    enabled: symbolsForQuotes.length > 0,
    staleTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const combinedQuotes = useMemo(
    () => ({ ...(quotes || {}), ...(dynamicQuotes || {}) }),
    [quotes, dynamicQuotes]
  );

  const filtered = useMemo(() => {
    // Sort by selected metric (mirroring crypto sort behavior)
    const multiplier = sortDirection === 'desc' ? -1 : 1;
    const items = [...baseFiltered];
    items.sort((a, b) => {
      const qa = combinedQuotes[a.symbol];
      const qb = combinedQuotes[b.symbol];
      const changeA = qa?.dp ?? 0;
      const changeB = qb?.dp ?? 0;
      const priceA = qa?.c ?? 0;
      const priceB = qb?.c ?? 0;

      let cmp = 0;
      switch (sort) {
        case 'change':
          cmp = changeA - changeB;
          break;
        case 'price':
          cmp = priceA - priceB;
          break;
        default:
          // 'popular' fallback: price as proxy, then symbol
          cmp = priceA - priceB;
          if (cmp === 0) cmp = a.symbol.localeCompare(b.symbol);
          break;
      }
      return cmp * multiplier;
    });
    return items;
  }, [baseFiltered, combinedQuotes, sort, sortDirection]);

  const paginatedData = useMemo(() => {
    const start = page * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, page]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  useEffect(() => {
    setPage(0);
  }, [search, sort, category, sortDirection]);

  const handleAdd = () => {
    // TODO: Implement add to portfolio
    alert('Add to portfolio - coming soon!');
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={500} mb={3} sx={{ fontSize: '1.25rem', color: (theme) => theme.palette.mode === 'dark' ? '#ECEFF1' : '#44475B' }}>
        Most traded stocks
      </Typography>
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: '8px',
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap mb={2.5}>
          <TextField
            placeholder="Search stocks..."
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              flex: 1,
              minWidth: 250,
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                fontSize: '0.875rem',
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: '1.1rem', color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant={category === 'all' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setCategory('all')}
            sx={{ 
              borderRadius: '8px',
              textTransform: 'none',
              fontSize: '0.8125rem',
              fontWeight: 500,
              px: 2.5,
              bgcolor: category === 'all' ? '#00D09C' : 'transparent',
              color: category === 'all' ? 'white' : 'text.secondary',
              borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#E8EAED',
              '&:hover': {
                bgcolor: category === 'all' ? '#00B881' : 'rgba(0, 208, 156, 0.08)',
                borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : '#00D09C',
              },
            }}
          >
            All
          </Button>
          <Button
            variant={category === 'tech' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setCategory('tech')}
            sx={{ 
              borderRadius: '8px',
              textTransform: 'none',
              fontSize: '0.8125rem',
              fontWeight: 500,
              px: 2.5,
              bgcolor: category === 'tech' ? '#00D09C' : 'transparent',
              color: category === 'tech' ? 'white' : 'text.secondary',
              borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#E8EAED',
              '&:hover': {
                bgcolor: category === 'tech' ? '#00B881' : 'rgba(0, 208, 156, 0.08)',
                borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : '#00D09C',
              },
            }}
          >
            Technology
          </Button>
          <Button
            variant={category === 'finance' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setCategory('finance')}
            sx={{ 
              borderRadius: '8px',
              textTransform: 'none',
              fontSize: '0.8125rem',
              fontWeight: 500,
              px: 2.5,
              bgcolor: category === 'finance' ? '#00D09C' : 'transparent',
              color: category === 'finance' ? 'white' : 'text.secondary',
              borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#E8EAED',
              '&:hover': {
                bgcolor: category === 'finance' ? '#00B881' : 'rgba(0, 208, 156, 0.08)',
                borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : '#00D09C',
              },
            }}
          >
            Finance
          </Button>
          <Button
            variant={category === 'healthcare' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setCategory('healthcare')}
            sx={{ 
              borderRadius: '8px',
              textTransform: 'none',
              fontSize: '0.8125rem',
              fontWeight: 500,
              px: 2.5,
              bgcolor: category === 'healthcare' ? '#00D09C' : 'transparent',
              color: category === 'healthcare' ? 'white' : 'text.secondary',
              borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#E8EAED',
              '&:hover': {
                bgcolor: category === 'healthcare' ? '#00B881' : 'rgba(0, 208, 156, 0.08)',
                borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : '#00D09C',
              },
            }}
          >
            Healthcare
          </Button>
          <Select
            size="small"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            sx={{ 
              minWidth: 140,
              fontSize: '0.8125rem',
              borderRadius: '8px',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#E8EAED',
              },
            }}
          >
            <MenuItem value="popular">Popular</MenuItem>
            <MenuItem value="price">Price</MenuItem>
            <MenuItem value="change">Change</MenuItem>
          </Select>
          <Button
            variant="text"
            size="small"
            onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
            sx={{
              fontSize: '0.8125rem',
              fontWeight: 400,
              color: '#00D09C',
              textTransform: 'none',
              minWidth: 'auto',
              px: 1.5,
              '&:hover': {
                bgcolor: 'rgba(0, 208, 156, 0.08)',
              },
            }}
          >
            {sortDirection === 'desc' ? 'High → Low' : 'Low → High'}
          </Button>
        </Stack>

        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
            Showing {paginatedData.length} of {filtered.length} stocks
          </Typography>
          <Button
            variant="text"
            size="small"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
            sx={{
              fontSize: '0.8125rem',
              fontWeight: 400,
              color: page === 0 ? 'text.disabled' : '#00D09C',
              textTransform: 'none',
              '&:hover': {
                bgcolor: 'rgba(0, 208, 156, 0.08)',
              },
            }}
          >
            Previous
          </Button>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
            Page {page + 1} of {totalPages || 1}
          </Typography>
          <Button
            variant="text"
            size="small"
            disabled={page >= totalPages - 1}
            onClick={() => setPage(page + 1)}
            sx={{
              fontSize: '0.8125rem',
              fontWeight: 400,
              color: page >= totalPages - 1 ? 'text.disabled' : '#00D09C',
              textTransform: 'none',
              '&:hover': {
                bgcolor: 'rgba(0, 208, 156, 0.08)',
              },
            }}
          >
            Next
          </Button>
        </Stack>
      </Paper>

      {isLoading && <LinearProgress sx={{ mb: 3 }} />}

      <Grid container spacing={3}>
        {paginatedData.map((stock) => (
          <Grid item key={stock.symbol} xs={12} sm={6} lg={4} xl={3}>
            <StockCard 
              stock={stock} 
              quote={combinedQuotes[stock.symbol]}
              onOpen={() => setSelected({ stock, quote: combinedQuotes[stock.symbol] })} 
              currency={currency} 
              fxRates={fxRates} 
            />
          </Grid>
        ))}
      </Grid>
      {!isLoading && !filtered.length && (
        <Paper
          elevation={0}
          sx={{
            p: 8,
            textAlign: 'center',
            background: (theme) =>
              theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(51, 65, 85, 0.5) 100%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(248, 250, 252, 0.5) 100%)',
          }}
        >
          <Search sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No stocks found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search or filters
          </Typography>
        </Paper>
      )}
      <StockDetailDialog
        open={!!selected}
        stock={selected?.stock || null}
        quote={selected?.quote}
        onClose={() => setSelected(null)}
        onAdd={handleAdd}
        currency={currency}
        fxRates={fxRates}
      />
    </Box>
  );
}

function StockDetailDialog({
  open,
  stock,
  quote,
  onClose,
  onAdd,
  currency,
  fxRates
}: {
  open: boolean;
  stock: Stock | null;
  quote?: StockQuote;
  onClose: () => void;
  onAdd: () => void;
  currency: string;
  fxRates: Record<string, number>;
}) {
  const price = quote?.c ?? 0;
  const priceConverted = convert(price, 'USD', currency, fxRates) || 0;
  const change = quote?.dp ?? 0;
  const changeAbs = quote?.d ?? 0;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: {
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? 'linear-gradient(145deg, #0a0a0f 0%, #12121a 50%, #1a1a2e 100%)'
              : 'linear-gradient(145deg, #ffffff 0%, #fafbfc 50%, #f1f5f9 100%)',
          border: (theme) => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(109, 40, 217, 0.1)'}`,
          borderRadius: 3,
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        background: (theme) => theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)'
          : 'linear-gradient(135deg, rgba(109, 40, 217, 0.08) 0%, rgba(139, 92, 246, 0.03) 100%)',
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        pb: 2,
      }}>
        <Avatar
          sx={{
            width: 60,
            height: 60,
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #4f46e5 100%)',
            fontSize: '1.5rem',
            fontWeight: 700,
            boxShadow: '0 8px 24px rgba(139, 92, 246, 0.4)',
          }}
        >
          {stock?.symbol?.slice(0, 2).toUpperCase()}
        </Avatar>
        <Box>
          <Typography variant="h5" fontWeight={700}>{stock?.displaySymbol || stock?.symbol}</Typography>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>{stock?.description}</Typography>
        </Box>
        <Box sx={{ ml: 'auto' }}>
          <Chip
            icon={change >= 0 ? <TrendingUp /> : <TrendingDown />}
            label={`${change >= 0 ? '+' : ''}${change.toFixed(2)}%`}
            color={change >= 0 ? 'success' : 'error'}
            sx={{ 
              fontWeight: 700, 
              fontSize: '1rem', 
              px: 1.5,
              py: 2.5,
              '& .MuiChip-icon': { fontSize: '1.2rem' },
            }}
          />
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={3}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              background: (theme) => theme.palette.mode === 'dark' 
                ? 'linear-gradient(145deg, rgba(18, 18, 26, 0.8) 0%, rgba(30, 30, 45, 0.8) 100%)'
                : 'linear-gradient(145deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)',
              border: (theme) => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(109, 40, 217, 0.08)'}`,
              borderRadius: 2,
            }}
          >
            <Typography variant="h3" fontWeight={700} gutterBottom>
              {formatCurrency(priceConverted, currency, {})}
            </Typography>
            <Stack direction="row" spacing={1} mb={2}>
              <Chip
                label={`Change: ${change >= 0 ? '+' : ''}${formatCurrency(convert(changeAbs, 'USD', currency, fxRates) || 0, currency, {})}`}
                color={change >= 0 ? 'success' : 'error'}
                variant="filled"
                size="small"
              />
              <Chip
                label={`${change >= 0 ? '+' : ''}${change.toFixed(2)}%`}
                color={change >= 0 ? 'success' : 'error'}
                variant="filled"
                size="small"
              />
            </Stack>
            <StockPriceChart stock={stock} quote={quote} currency={currency} fxRates={fxRates} />
          </Paper>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <StatCard 
                label="Open" 
                value={quote ? formatCurrency(convert(quote.o, 'USD', currency, fxRates) || 0, currency, {}) : '—'}
                icon={<ShowChart />}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <StatCard 
                label="Previous Close" 
                value={quote ? formatCurrency(convert(quote.pc, 'USD', currency, fxRates) || 0, currency, {}) : '—'}
                icon={<ShowChart />}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <StatCard 
                label="Day High" 
                value={quote ? formatCurrency(convert(quote.h, 'USD', currency, fxRates) || 0, currency, {}) : '—'}
                icon={<TrendingUp />}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <StatCard 
                label="Day Low" 
                value={quote ? formatCurrency(convert(quote.l, 'USD', currency, fxRates) || 0, currency, {}) : '—'}
                icon={<TrendingDown />}
              />
            </Grid>
          </Grid>

          <Box>
            <Typography variant="h6" fontWeight={600} gutterBottom>About {stock?.displaySymbol || stock?.symbol}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
              {stock?.description || 'No description available.'}
            </Typography>
            {stock?.type && (
              <Box mt={2}>
                <Chip label={stock.type} size="medium" variant="outlined" />
              </Box>
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} size="large">Close</Button>
        <Button variant="contained" onClick={onAdd} size="large" startIcon={<TrendingUp />}>
          Add to Portfolio
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function StockPriceChart({ stock, quote, currency, fxRates }: { stock: Stock | null; quote?: StockQuote; currency?: string; fxRates?: Record<string, number> }) {
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '30d' | '60d' | '90d'>('24h');

  const chartData = useMemo(() => {
    if (!quote) return [];

    const current = convert(quote.c, 'USD', currency || 'USD', fxRates || {}) || quote.c;
    const open = convert(quote.o, 'USD', currency || 'USD', fxRates || {}) || quote.o;
    const change = ((current - open) / open) * 100;
    
    const config = {
      '1h': { points: 60, labels: Array.from({length: 13}, (_, i) => i === 12 ? 'Now' : `${60-i*5}m ago`), change, primaryWave: 0.2, secondaryWave: 0.1 },
      '24h': { points: 48, labels: Array.from({length: 9}, (_, i) => i === 8 ? 'Now' : `${24-i*3}h ago`), change, primaryWave: 0.15, secondaryWave: 0.08 },
      '30d': { points: 60, labels: Array.from({length: 7}, (_, i) => i === 6 ? 'Now' : `${30-i*5}d ago`), change, primaryWave: 0.1, secondaryWave: 0.05 },
      '60d': { points: 60, labels: Array.from({length: 7}, (_, i) => i === 6 ? 'Now' : `${60-i*10}d ago`), change, primaryWave: 0.08, secondaryWave: 0.04 },
      '90d': { points: 60, labels: Array.from({length: 7}, (_, i) => i === 6 ? 'Now' : `${90-i*15}d ago`), change, primaryWave: 0.06, secondaryWave: 0.03 },
    }[timeRange];
    
    const data = [];
    for (let i = 0; i < config.points; i++) {
      const progress = i / (config.points - 1);
      const wave1 = Math.sin(i * config.primaryWave) * 2;
      const wave2 = Math.sin(i * config.secondaryWave) * 1.5;
      const noise = (Math.random() - 0.5) * 0.8;
      const trend = config.change * progress;
      const price = current * (1 - (trend + wave1 + wave2 + noise) / 100);
      
      const timeIndex = Math.floor((i / config.points) * config.labels.length);
      data.push({
        time: config.labels[Math.min(timeIndex, config.labels.length - 1)],
        price: price,
        formatted: formatCurrency(price, currency || 'USD', {}),
      });
    }
    
    return data;
  }, [quote, currency, fxRates, timeRange]);

  const isPositive = (quote?.dp ?? 0) >= 0;
  const lineColor = isPositive ? '#22c55e' : '#f43f5e';
  const gradientId = `colorStockPrice${stock?.symbol || 'default'}`;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper
          elevation={8}
          sx={{
            p: 1.5,
            background: (theme) => theme.palette.mode === 'dark'
              ? 'rgba(18, 18, 26, 0.98)'
              : 'rgba(255, 255, 255, 0.98)',
            border: (theme) => `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
          }}
        >
          <Typography variant="caption" color="text.secondary" display="block">
            {payload[0].payload.time}
          </Typography>
          <Typography variant="body2" fontWeight={700}>
            {payload[0].payload.formatted}
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  return (
    <Box>
      <Stack direction="row" spacing={1} mb={2} justifyContent="center" flexWrap="wrap" useFlexGap>
        {['1h', '24h', '30d', '60d', '90d'].map((range) => (
          <Button
            key={range}
            size="small"
            variant={timeRange === range ? 'contained' : 'outlined'}
            onClick={() => setTimeRange(range as any)}
            sx={{
              minWidth: 60,
              fontSize: '0.75rem',
              py: 0.5,
              px: 1.5,
              borderRadius: 2,
              bgcolor: timeRange === range ? 'primary.main' : 'transparent',
              color: timeRange === range ? 'white' : 'text.secondary',
              borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#E8EAED',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            {range}
          </Button>
        ))}
      </Stack>
      <Box sx={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={lineColor} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={lineColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 100, 100, 0.2)" />
            <XAxis 
              dataKey="time" 
              stroke="#888"
              style={{ fontSize: '0.75rem' }}
              tickLine={false}
            />
            <YAxis 
              stroke="#888"
              style={{ fontSize: '0.75rem' }}
              tickFormatter={(val) => formatCurrency(val, currency || 'USD', {})}
              tickLine={false}
              domain={['auto', 'auto']}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: lineColor, strokeWidth: 1, strokeDasharray: '5 5' }} />
            <Area
              type="monotone"
              dataKey="price"
              stroke={lineColor}
              strokeWidth={3}
              fill={`url(#${gradientId})`}
              isAnimationActive={true}
              animationDuration={1200}
              animationEasing="ease-in-out"
              dot={false}
              activeDot={{ 
                r: 6, 
                fill: lineColor, 
                stroke: '#fff', 
                strokeWidth: 2,
                filter: `drop-shadow(0 0 8px ${lineColor})`,
              }}
            />
            {chartData.length > 0 && (
              <ReferenceDot
                x={chartData[chartData.length - 1].time}
                y={chartData[chartData.length - 1].price}
                r={8}
                fill={lineColor}
                stroke="#fff"
                strokeWidth={3}
                style={{ filter: `drop-shadow(0 0 12px ${lineColor})` }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        background: (theme) => theme.palette.mode === 'dark'
          ? 'rgba(30, 41, 59, 0.5)'
          : 'rgba(248, 250, 252, 0.5)',
        border: (theme) => `1px solid ${theme.palette.divider}`,
        height: '100%',
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" mb={1}>
        <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
        <Typography variant="body2" color="text.secondary" fontWeight={600}>
          {label}
        </Typography>
      </Stack>
      <Typography variant="h6" fontWeight={700}>{value}</Typography>
    </Paper>
  );
}
