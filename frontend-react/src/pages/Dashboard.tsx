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
import { Coin } from '../types';
import { usePortfolio } from '../state/PortfolioContext';
import { formatChange, formatCurrencyFromUsd, formatNumberFromUsd, sortCoinsBy, rateFor } from '../utils';
import { getCoinInfo, getCoinQuote } from '../api';

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

function CoinCard({
  coin,
  onOpen,
  currency,
  fxRates
}: {
  coin: Coin;
  onOpen: () => void;
  currency: string;
  fxRates: Record<string, number>;
}) {
  const change = coin.quote?.USD?.percent_change_24h ?? 0;
  const isPositive = change >= 0;

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
            {coin.symbol?.slice(0, 2).toUpperCase()}
          </Avatar>
          <Box flex={1}>
            <Typography variant="body1" fontWeight={600} sx={{ fontSize: '0.875rem', mb: 0.25 }}>
              {coin.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              {coin.symbol}
            </Typography>
          </Box>
        </Stack>
        
        <Stack spacing={1.5}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              Price
            </Typography>
            <Typography variant="body1" fontWeight={600} sx={{ fontSize: '0.875rem' }}>
              {formatCurrencyFromUsd(coin.quote?.USD?.price, currency, fxRates)}
            </Typography>
          </Stack>

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              1h Change
            </Typography>
            <Typography 
              variant="body2" 
              fontWeight={600}
              sx={{ 
                fontSize: '0.75rem',
                color: (coin.quote?.USD?.percent_change_1h ?? 0) >= 0 ? '#00B386' : '#EB5B3C',
              }}
            >
              {(coin.quote?.USD?.percent_change_1h ?? 0) >= 0 ? '+' : ''}{(coin.quote?.USD?.percent_change_1h ?? 0).toFixed(2)}%
            </Typography>
          </Stack>

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              24h Change
            </Typography>
            <Typography 
              variant="body2" 
              fontWeight={600}
              sx={{ 
                fontSize: '0.875rem',
                color: isPositive ? '#00B386' : '#EB5B3C',
              }}
            >
              {change >= 0 ? '+' : ''}{change.toFixed(2)}%
            </Typography>
          </Stack>

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              7d Change
            </Typography>
            <Typography 
              variant="body2" 
              fontWeight={600}
              sx={{ 
                fontSize: '0.75rem',
                color: (coin.quote?.USD?.percent_change_7d ?? 0) >= 0 ? '#00B386' : '#EB5B3C',
              }}
            >
              {(coin.quote?.USD?.percent_change_7d ?? 0) >= 0 ? '+' : ''}{(coin.quote?.USD?.percent_change_7d ?? 0).toFixed(2)}%
            </Typography>
          </Stack>

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              Market Cap
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
              {formatNumberFromUsd(coin.quote?.USD?.market_cap, currency, fxRates)}
            </Typography>
          </Stack>

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              Volume (24h)
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
              {formatNumberFromUsd(coin.quote?.USD?.volume_24h, currency, fxRates)}
            </Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function Dashboard({ listings, isLoading }: { listings: Coin[]; isLoading: boolean }) {
  const [selected, setSelected] = useState<Coin | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('market_cap');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(0);
  const itemsPerPage = 12;
  const { upsertEntry, currency, fxRates } = usePortfolio();

  const handleAdd = () => {
    if (!selected) return;
    void upsertEntry({
      id: selected.id,
      name: selected.name,
      symbol: selected.symbol,
      quantity: 0,
      cost: null,
      costCurrency: null
    });
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    let items = query
      ? listings.filter((c) => c?.name?.toLowerCase().includes(query) || c?.symbol?.toLowerCase().includes(query))
      : listings;
    
    if (category !== 'all') {
      items = items.filter(c => {
        const tags = (c as any).tags || [];
        if (category === 'defi') return tags.some((t: string) => t.toLowerCase().includes('defi'));
        if (category === 'layer1') return tags.some((t: string) => t.toLowerCase().includes('layer'));
        if (category === 'meme') return tags.some((t: string) => t.toLowerCase().includes('meme'));
        return true;
      });
    }
    
    const sorted = sortCoinsBy(items, sort);
    return sortDirection === 'desc' ? sorted : sorted.reverse();
  }, [listings, search, sort, sortDirection, category]);

  const paginatedData = useMemo(() => {
    const start = page * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, page]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  useEffect(() => {
    setPage(0);
  }, [search, sort, category, sortDirection]);

  const stats = useMemo(() => {
    const total = listings.reduce((sum, c) => sum + (c.quote?.USD?.market_cap || 0), 0);
    const volume = listings.reduce((sum, c) => sum + (c.quote?.USD?.volume_24h || 0), 0);
    const avgChange = listings.reduce((sum, c) => sum + (c.quote?.USD?.percent_change_24h || 0), 0) / (listings.length || 1);
    return { total, volume, avgChange };
  }, [listings]);

  return (
    <Box>
      <Typography variant="h5" fontWeight={500} mb={3} sx={{ fontSize: '1.25rem', color: (theme) => theme.palette.mode === 'dark' ? '#ECEFF1' : '#44475B' }}>
        Most traded cryptocurrencies
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
            placeholder="Search cryptocurrencies..."
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
            variant={category === 'defi' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setCategory('defi')}
            sx={{ 
              borderRadius: '8px',
              textTransform: 'none',
              fontSize: '0.8125rem',
              fontWeight: 500,
              px: 2.5,
              bgcolor: category === 'defi' ? '#00D09C' : 'transparent',
              color: category === 'defi' ? 'white' : 'text.secondary',
              borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#E8EAED',
              '&:hover': {
                bgcolor: category === 'defi' ? '#00B881' : 'rgba(0, 208, 156, 0.08)',
                borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : '#00D09C',
              },
            }}
          >
            DeFi
          </Button>
          <Button
            variant={category === 'layer1' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setCategory('layer1')}
            sx={{ 
              borderRadius: '8px',
              textTransform: 'none',
              fontSize: '0.8125rem',
              fontWeight: 500,
              px: 2.5,
              bgcolor: category === 'layer1' ? '#00D09C' : 'transparent',
              color: category === 'layer1' ? 'white' : 'text.secondary',
              borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#E8EAED',
              '&:hover': {
                bgcolor: category === 'layer1' ? '#00B881' : 'rgba(0, 208, 156, 0.08)',
                borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : '#00D09C',
              },
            }}
          >
            Layer 1
          </Button>
          <Button
            variant={category === 'meme' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setCategory('meme')}
            sx={{ 
              borderRadius: '8px',
              textTransform: 'none',
              fontSize: '0.8125rem',
              fontWeight: 500,
              px: 2.5,
              bgcolor: category === 'meme' ? '#00D09C' : 'transparent',
              color: category === 'meme' ? 'white' : 'text.secondary',
              borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#E8EAED',
              '&:hover': {
                bgcolor: category === 'meme' ? '#00B881' : 'rgba(0, 208, 156, 0.08)',
                borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : '#00D09C',
              },
            }}
          >
            Meme
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
            <MenuItem value="market_cap">Market Cap</MenuItem>
            <MenuItem value="price">Price</MenuItem>
            <MenuItem value="change">24h Change</MenuItem>
            <MenuItem value="volume">Volume</MenuItem>
          </Select>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc')}
            sx={{ 
              minWidth: 100,
              borderRadius: '8px',
              textTransform: 'none',
              fontSize: '0.8125rem',
              fontWeight: 500,
              borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#E8EAED',
              color: 'text.secondary',
              '&:hover': {
                borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : '#00D09C',
                bgcolor: 'rgba(0, 208, 156, 0.08)',
              },
            }}
          >
            {sortDirection === 'desc' ? '↓ High to Low' : '↑ Low to High'}
          </Button>
        </Stack>
      </Paper>

      {isLoading && <LinearProgress sx={{ mb: 3, borderRadius: 2, bgcolor: '#F5F5F5', '& .MuiLinearProgress-bar': { bgcolor: '#00D09C' } }} />}
      
      <Box sx={{ mb: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
          Showing {page * itemsPerPage + 1}-{Math.min((page + 1) * itemsPerPage, filtered.length)} of {filtered.length}
        </Typography>
        <Stack direction="row" spacing={1.5} alignItems="center">
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
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem', px: 1 }}>
            {page + 1} of {totalPages || 1}
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
      </Box>

      <Grid container spacing={3}>
        {paginatedData.map((coin) => (
          <Grid item key={coin.id} xs={12} sm={6} lg={4} xl={3}>
            <CoinCard coin={coin} onOpen={() => setSelected(coin)} currency={currency} fxRates={fxRates} />
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
            No cryptocurrencies found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search or filters
          </Typography>
        </Paper>
      )}
      <DetailDialog
        open={!!selected}
        coin={selected}
        onClose={() => setSelected(null)}
        onAdd={handleAdd}
        currency={currency}
        fxRates={fxRates}
      />
    </Box>
  );
}

function StatBox({ label, value, icon, color = 'primary' }: { label: string; value: string; icon: React.ReactNode; color?: string }) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        background: (theme) =>
          theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
        border: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} mb={1}>
        <Box sx={{ color: `${color}.main`, display: 'flex' }}>{icon}</Box>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          {label}
        </Typography>
      </Stack>
      <Typography variant="h6" fontWeight={700}>
        {value}
      </Typography>
    </Box>
  );
}

function PriceChart({ coin, currency, fxRates }: { coin: Coin | null; currency?: string; fxRates?: Record<string, number> }) {
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '30d' | '60d' | '90d'>('24h');

  const chartData = useMemo(() => {
    if (!coin) return [];

    const priceUsd = coin.quote?.USD?.price ?? 100;
    const rate = fxRates?.[currency || 'USD'] ?? 1;
    const current = priceUsd * rate;
    const change1h = coin.quote?.USD?.percent_change_1h ?? 0;
    const change24h = coin.quote?.USD?.percent_change_24h ?? 0;
    const change7d = coin.quote?.USD?.percent_change_7d ?? 0;
    const change30d = coin.quote?.USD?.percent_change_30d ?? 0;
    const change60d = coin.quote?.USD?.percent_change_60d ?? 0;
    const change90d = coin.quote?.USD?.percent_change_90d ?? 0;
    
    // Configure based on time range
    const config = {
      '1h': { points: 60, labels: Array.from({length: 13}, (_, i) => i === 12 ? 'Now' : `${60-i*5}m ago`), change: change1h, primaryWave: 0.2, secondaryWave: 0.1 },
      '24h': { points: 48, labels: Array.from({length: 9}, (_, i) => i === 8 ? 'Now' : `${24-i*3}h ago`), change: change24h, primaryWave: 0.15, secondaryWave: 0.08 },
      '30d': { points: 60, labels: Array.from({length: 7}, (_, i) => i === 6 ? 'Now' : `${30-i*5}d ago`), change: change30d, primaryWave: 0.1, secondaryWave: 0.05 },
      '60d': { points: 60, labels: Array.from({length: 7}, (_, i) => i === 6 ? 'Now' : `${60-i*10}d ago`), change: change60d, primaryWave: 0.08, secondaryWave: 0.04 },
      '90d': { points: 60, labels: Array.from({length: 7}, (_, i) => i === 6 ? 'Now' : `${90-i*15}d ago`), change: change90d, primaryWave: 0.06, secondaryWave: 0.03 },
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
        formatted: price >= 1 ? `$${price.toFixed(2)}` : `$${price.toFixed(6)}`,
      });
    }
    
    return data;
  }, [coin, currency, fxRates, timeRange]);

  const isPositive = (coin?.quote?.USD?.percent_change_24h ?? 0) >= 0;
  const lineColor = isPositive ? '#22c55e' : '#f43f5e';
  const gradientId = `colorPrice${coin?.id || 'default'}`;
  const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', JPY: '¥', INR: '₹', AUD: 'A$', CAD: 'C$', CHF: 'CHF ' };
  const currencySymbol = symbols[currency || 'USD'] || (currency || 'USD') + ' ';

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
          <Typography variant="body2" fontWeight={700} color={lineColor}>
            {payload[0].value >= 1 ? `${currencySymbol}${payload[0].value.toFixed(2)}` : `${currencySymbol}${payload[0].value.toFixed(6)}`}
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  const timeRanges: Array<{ value: '1h' | '24h' | '30d' | '60d' | '90d'; label: string }> = [
    { value: '1h', label: '1H' },
    { value: '24h', label: '24H' },
    { value: '30d', label: '30D' },
    { value: '60d', label: '60D' },
    { value: '90d', label: '90D' },
  ];

  return (
    <Box sx={{ width: '100%' }}>
      <Stack direction="row" spacing={1} mb={2} justifyContent="center">
        {timeRanges.map((range) => (
          <Button
            key={range.value}
            size="small"
            variant={timeRange === range.value ? 'contained' : 'outlined'}
            onClick={() => setTimeRange(range.value)}
            sx={{
              minWidth: 60,
              py: 0.5,
              fontSize: '0.75rem',
              fontWeight: 600,
              borderRadius: '8px',
              ...(timeRange === range.value ? {
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                borderColor: 'transparent',
              } : {
                borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(109, 40, 217, 0.2)',
                color: (theme) => theme.palette.mode === 'dark' ? 'rgba(139, 92, 246, 0.9)' : 'rgba(109, 40, 217, 0.8)',
              }),
            }}
          >
            {range.label}
          </Button>
        ))}
      </Stack>
      <Box sx={{ 
        width: '100%', 
        height: 320, 
        background: (theme) => theme.palette.mode === 'dark' 
          ? 'rgba(0, 0, 0, 0.2)' 
          : 'rgba(248, 250, 252, 0.5)',
        borderRadius: 2,
        p: 2,
      }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart 
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop 
                offset="5%" 
                stopColor={lineColor} 
                stopOpacity={0.4}
              />
              <stop 
                offset="50%" 
                stopColor={lineColor} 
                stopOpacity={0.15}
              />
              <stop 
                offset="95%" 
                stopColor={lineColor} 
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="rgba(148, 163, 184, 0.1)" 
            vertical={false}
          />
          <XAxis 
            dataKey="time" 
            stroke="rgba(148, 163, 184, 0.5)"
            style={{ fontSize: '11px' }}
            interval="preserveStartEnd"
            tickCount={8}
          />
          <YAxis 
            stroke="rgba(148, 163, 184, 0.5)"
            style={{ fontSize: '11px' }}
            tickFormatter={(value) => {
              const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', JPY: '¥', INR: '₹', AUD: 'A$', CAD: 'C$', CHF: 'CHF ' };
              const symbol = symbols[currency] || currency + ' ';
              return value >= 1 ? `${symbol}${value.toFixed(0)}` : `${symbol}${value.toFixed(4)}`;
            }}
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

function DetailDialog({
  open,
  coin,
  onClose,
  onAdd,
  currency,
  fxRates
}: {
  open: boolean;
  coin: Coin | null;
  onClose: () => void;
  onAdd: () => void;
  currency: string;
  fxRates: Record<string, number>;
}) {
  const id = coin?.id;
  const info = useQuery({
    queryKey: ['info', id],
    queryFn: () => getCoinInfo(String(id)),
    enabled: Boolean(id)
  });
  const quote = useQuery({
    queryKey: ['quote', id],
    queryFn: () => getCoinQuote(String(id)),
    enabled: Boolean(id)
  });
  const quoteCoin = useMemo(() => {
    if (!quote.data?.data) return coin || null;
    const payload = quote.data.data;
    const found = payload[String(id)] || Object.values(payload)[0];
    return (found as Coin) || coin || null;
  }, [quote.data, id, coin]);

  const infoData = useMemo(() => {
    if (!info.data?.data) return null;
    const payload = info.data.data;
    return payload[String(id)] || Object.values(payload)[0];
  }, [info.data, id]);

  const priceUsd = quoteCoin?.quote?.USD?.price ?? coin?.quote?.USD?.price ?? null;
  const priceLocal = priceUsd ? priceUsd * rateFor(currency, fxRates) : null;
  const change24h = quoteCoin?.quote?.USD?.percent_change_24h ?? 0;
  const chips = [
    { label: '1h', value: quoteCoin?.quote?.USD?.percent_change_1h },
    { label: '24h', value: quoteCoin?.quote?.USD?.percent_change_24h },
    { label: '7d', value: quoteCoin?.quote?.USD?.percent_change_7d },
    { label: '30d', value: quoteCoin?.quote?.USD?.percent_change_30d }
  ];

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
          {coin?.symbol?.slice(0, 2).toUpperCase()}
        </Avatar>
        <Box>
          <Typography variant="h5" fontWeight={700}>{coin?.name}</Typography>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>{coin?.symbol}</Typography>
        </Box>
        <Box sx={{ ml: 'auto' }}>
          <Chip
            icon={change24h >= 0 ? <TrendingUp /> : <TrendingDown />}
            label={`${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`}
            color={change24h >= 0 ? 'success' : 'error'}
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
              {priceLocal ? formatCurrencyFromUsd(priceUsd, currency, fxRates) : '—'}
            </Typography>
            <Stack direction="row" spacing={1} mb={2} flexWrap="wrap" useFlexGap>
              {chips.map((chip) => (
                <Chip
                  key={chip.label}
                  label={`${chip.label}: ${formatChange(chip.value)}`}
                  color={chip.value !== undefined && chip.value !== null && chip.value >= 0 ? 'success' : 'error'}
                  variant="filled"
                  size="small"
                />
              ))}
            </Stack>
            <PriceChart coin={quoteCoin} currency={currency} fxRates={fxRates} />
          </Paper>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <StatCard 
                label="Market Cap" 
                value={formatNumberFromUsd(quoteCoin?.quote?.USD?.market_cap, currency, fxRates)}
                icon={<ShowChart />}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard 
                label="Volume 24h" 
                value={formatNumberFromUsd(quoteCoin?.quote?.USD?.volume_24h, currency, fxRates)}
                icon={<ShowChart />}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard 
                label="Circulating Supply" 
                value={quoteCoin?.circulating_supply?.toLocaleString() ?? '—'}
                icon={<ShowChart />}
              />
            </Grid>
          </Grid>

          {infoData?.description ? (
            <Box>
              <Typography variant="h6" fontWeight={600} gutterBottom>About {coin?.name}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                {infoData.description}
              </Typography>
            </Box>
          ) : null}

          {infoData?.tags?.length ? (
            <Box>
              <Typography variant="h6" fontWeight={600} gutterBottom>Tags</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {infoData.tags.slice(0, 10).map((tag: string) => (
                  <Chip key={tag} label={tag} size="medium" variant="outlined" />
                ))}
              </Stack>
            </Box>
          ) : null}

          {infoData?.urls ? (
            <Box>
              <Typography variant="h6" fontWeight={600} gutterBottom>Links</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {Object.entries(infoData.urls).flatMap(([key, urls]) =>
                  (urls || []).slice(0, 1).map((url: string) => (
                    <Chip
                      key={`${key}-${url}`}
                      label={key}
                      component="a"
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      clickable
                      color="primary"
                      variant="outlined"
                    />
                  ))
                )}
              </Stack>
            </Box>
          ) : null}
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


