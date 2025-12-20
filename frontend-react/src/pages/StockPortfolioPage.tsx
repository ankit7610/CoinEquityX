import {
  Card,
  CardContent,
  Typography,
  Stack,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  MenuItem,
  Chip,
  Grid,
  Paper,
  Box,
  IconButton,
  Autocomplete,
  createFilterOptions
} from '@mui/material';
import { useEffect, useState, useMemo } from 'react';
import { AccountBalance, TrendingUp, TrendingDown, Delete, Edit, PieChart, AddCircle } from '@mui/icons-material';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePortfolio } from '../state/PortfolioContext'; // For currency and fxRates
import { useAuth } from '../context/AuthContext';
import { convert, formatCurrency, rateFor } from '../utils';
import { getStockSymbols, getStockPortfolio, saveStockPortfolio, getBatchQuotes } from '../stockApi';
import { Stock, StockPortfolioEntry, StockQuote } from '../stockTypes';

function PortfolioChart({ entries, quotes, currency, fxRates }: { entries: StockPortfolioEntry[]; quotes: Record<string, StockQuote>; currency: string; fxRates: Record<string, number> }) {
  const chartData = useMemo(() => {
    return entries.map((entry) => {
      const quote = quotes[entry.symbol];
      const { valueLocal } = computeEntry(entry, quote, currency, fxRates);
      return {
        name: entry.symbol,
        value: valueLocal || 0,
        fullName: entry.name,
        formatted: formatCurrency(valueLocal || 0, currency, {}),
      };
    }).filter((d) => d.value > 0);
  }, [entries, quotes, currency, fxRates]);

  // Professional color palette
  const colors = [
    '#8b5cf6', // Purple
    '#06b6d4', // Cyan  
    '#f472b6', // Pink
    '#22c55e', // Green
    '#f59e0b', // Amber
    '#3b82f6', // Blue
    '#f43f5e', // Rose
    '#a855f7', // Violet
    '#14b8a6', // Teal
    '#eab308', // Yellow
  ];

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percent = ((data.value / total) * 100).toFixed(1);
      return (
        <Paper
          elevation={8}
          sx={{
            p: 2,
            background: (theme) => theme.palette.mode === 'dark'
              ? 'rgba(18, 18, 26, 0.98)'
              : 'rgba(255, 255, 255, 0.98)',
            border: (theme) => `2px solid ${payload[0].fill}`,
            borderRadius: 2,
          }}
        >
          <Typography variant="body2" fontWeight={700} gutterBottom>
            {data.fullName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Value: {data.formatted}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Share: {percent}%
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy }: any) => {
    return (
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        <tspan
          x={cx}
          dy="-0.5em"
          style={{
            fontSize: '18px',
            fontWeight: 'bold',
            fill: '#f8fafc',
          }}
        >
          {formatCurrency(total, currency, {})}
        </tspan>
        <tspan
          x={cx}
          dy="1.5em"
          style={{
            fontSize: '12px',
            fill: '#94a3b8',
          }}
        >
          Total Value
        </tspan>
      </text>
    );
  };

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <ResponsiveContainer width="100%" height={320}>
        <RechartsPie>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            innerRadius={80}
            outerRadius={130}
            paddingAngle={2}
            dataKey="value"
            isAnimationActive={true}
            animationBegin={0}
            animationDuration={1000}
            animationEasing="ease-out"
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={colors[index % colors.length]}
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </RechartsPie>
      </ResponsiveContainer>
      <Stack spacing={1.5} sx={{ mt: 3, width: '100%' }}>
        {chartData.map((data, i) => {
          const percent = ((data.value / total) * 100).toFixed(1);
          return (
            <Stack 
              key={data.name} 
              direction="row" 
              alignItems="center" 
              spacing={1.5}
              sx={{
                p: 1,
                borderRadius: 1,
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Box sx={{ 
                width: 18, 
                height: 18, 
                borderRadius: '6px', 
                bgcolor: colors[i % colors.length],
                boxShadow: `0 2px 8px ${colors[i % colors.length]}40`,
              }} />
              <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }}>
                {data.name}
              </Typography>
              <Chip 
                label={`${percent}%`}
                size="small"
                sx={{ 
                  fontWeight: 600,
                  bgcolor: `${colors[i % colors.length]}20`,
                  color: colors[i % colors.length],
                }}
              />
            </Stack>
          );
        })}
      </Stack>
    </Box>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  const colorMap: Record<string, string> = {
    primary: '#8b5cf6',
    success: '#22c55e',
    error: '#f43f5e',
    info: '#06b6d4',
    warning: '#f59e0b',
  };
  const accentColor = colorMap[color] || colorMap.primary;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        height: '100%',
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? `linear-gradient(145deg, rgba(18, 18, 26, 0.95) 0%, rgba(30, 30, 45, 0.95) 100%)`
            : `linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)`,
        border: (theme) => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(109, 40, 217, 0.08)'}`,
        borderRadius: 2,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: accentColor,
        },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom fontWeight={500}>
            {label}
          </Typography>
          <Typography variant="h5" fontWeight={700}>
            {value}
          </Typography>
        </Box>
        <Box 
          sx={{ 
            color: accentColor, 
            opacity: 0.8,
            bgcolor: `${accentColor}15`,
            p: 1,
            borderRadius: 2,
          }}
        >
          {icon}
        </Box>
      </Stack>
    </Paper>
  );
}

function computeEntry(entry: StockPortfolioEntry, quote: StockQuote | undefined, currency: string, fxRates: Record<string, number>) {
  const rateSelected = rateFor(currency, fxRates);
  const priceUsd = quote?.c ?? null;
  const buyPriceLocal =
    entry.cost !== null && entry.cost !== undefined
      ? convert(entry.cost, entry.costCurrency || 'USD', currency, fxRates)
      : entry.costUsd !== null && entry.costUsd !== undefined
        ? entry.costUsd * rateSelected
        : null;

  const currentPriceLocal = priceUsd !== null ? priceUsd * rateSelected : null;
  const valueLocal = currentPriceLocal !== null ? currentPriceLocal * entry.quantity : null;
  const costBasisLocal = buyPriceLocal !== null ? buyPriceLocal * entry.quantity : null;
  const pnlLocal = valueLocal !== null && costBasisLocal !== null ? valueLocal - costBasisLocal : null;
  const pnlPct = pnlLocal !== null && costBasisLocal ? (pnlLocal / costBasisLocal) * 100 : null;

  return { buyPriceLocal, currentPriceLocal, valueLocal, costBasisLocal, pnlLocal, pnlPct };
}

function computeTotals(entries: StockPortfolioEntry[], quotes: Record<string, StockQuote>, currency: string, fxRates: Record<string, number>) {
  let invested = 0;
  let value = 0;
  entries.forEach((entry) => {
    const quote = quotes[entry.symbol];
    const { costBasisLocal, valueLocal } = computeEntry(entry, quote, currency, fxRates);
    if (costBasisLocal !== null && costBasisLocal !== undefined) invested += costBasisLocal;
    if (valueLocal !== null && valueLocal !== undefined) value += valueLocal;
  });
  return { invested, value, pnl: value - invested };
}

export default function StockPortfolioPage() {
  const { user } = useAuth();
  const { currency, fxRates } = usePortfolio();
  const queryClient = useQueryClient();
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [form, setForm] = useState({ quantity: '', cost: '', costCurrency: currency });

  const filterOptions = createFilterOptions({
    limit: 50,
    matchFrom: 'any',
    stringify: (option: any) => option.label,
  });

  // Fetch portfolio
  const { data: portfolioData } = useQuery({
    queryKey: ['stockPortfolio', user?.uid],
    queryFn: () => getStockPortfolio(user?.uid),
    enabled: !!user?.uid,
  });
  const entries = portfolioData?.data || [];

  // Fetch symbols for autocomplete
  const { data: stocks = [] } = useQuery({
    queryKey: ['stockSymbols', 'US'],
    queryFn: () => getStockSymbols('US'),
    staleTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Popular stocks for dropdown prices
  const popularSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM', 'V', 'WMT', 'JNJ', 'PG', 'BAC', 'DIS', 'NFLX', 'ORCL', 'CSCO', 'INTC', 'AMD', 'CRM'];

  const { data: popularQuotes = {} } = useQuery({
    queryKey: ['stockQuotes', 'popular'],
    queryFn: () => getBatchQuotes(popularSymbols),
    staleTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Fetch quotes for portfolio items
  const { data: quotes = {} } = useQuery({
    queryKey: ['stockQuotes', entries.map(e => e.symbol).join(',')],
    queryFn: () => getBatchQuotes(entries.map(e => e.symbol)),
    enabled: entries.length > 0,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const allQuotes = { ...popularQuotes, ...quotes };

  // Mutation to save portfolio
  const saveMutation = useMutation({
    mutationFn: (entries: StockPortfolioEntry[]) => saveStockPortfolio(entries, user?.uid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockPortfolio'] });
    },
  });

  useEffect(() => {
    setForm((f) => ({ ...f, costCurrency: f.costCurrency || currency }));
  }, [currency]);

  const stockOptions = useMemo(() => {
    const options = stocks.map((s) => {
      const quote = allQuotes[s.symbol];
      const price = quote?.c || 0;
      return {
        label: `${s.description} (${s.symbol})`,
        stock: s,
        price
      };
    });
    
    // Sort by price descending (high to low)
    return options.sort((a, b) => b.price - a.price);
  }, [stocks, allQuotes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(form.quantity);
    const cost = form.cost ? Number(form.cost) : null;
    if (!selectedStock || !qty) return;
    
    const costCurrency = form.costCurrency || currency;
    const rate = fxRates?.[costCurrency] || 1;
    const costUsd = cost !== null ? cost / rate : null;

    const newEntry: StockPortfolioEntry = {
      id: selectedStock.symbol,
      symbol: selectedStock.symbol,
      name: selectedStock.description,
      quantity: qty,
      cost,
      costUsd,
      costCurrency
    };

    // Check if entry exists and update or add
    const existingIndex = entries.findIndex(e => e.symbol === newEntry.symbol);
    let newEntries = [...entries];
    if (existingIndex >= 0) {
      newEntries[existingIndex] = newEntry;
    } else {
      newEntries.push(newEntry);
    }

    await saveMutation.mutateAsync(newEntries);
    setSelectedStock(null);
    setForm({ quantity: '', cost: '', costCurrency: currency });
  };

  const handleRemove = async (symbol: string) => {
    const newEntries = entries.filter(e => e.symbol !== symbol);
    await saveMutation.mutateAsync(newEntries);
  };

  const handleEdit = (entry: StockPortfolioEntry) => {
    const stock = stocks.find(s => s.symbol === entry.symbol);
    if (stock) {
      setSelectedStock(stock);
      setForm({
        quantity: String(entry.quantity),
        cost: entry.cost !== null && entry.cost !== undefined ? String(entry.cost) : '',
        costCurrency: (entry.costCurrency || currency) as any
      });
    }
  };

  const { invested, value, pnl } = computeTotals(entries, quotes, currency, fxRates);
  const pnlPercent = invested ? (pnl / invested) * 100 : 0;

  return (
    <Stack spacing={3}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <StatCard
            label="Total Value"
            value={formatCurrency(value, currency, {})}
            icon={<AccountBalance sx={{ fontSize: 40 }} />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            label="Total Invested"
            value={formatCurrency(invested, currency, {})}
            icon={<AccountBalance sx={{ fontSize: 40 }} />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            label="Total P/L"
            value={`${formatCurrency(pnl, currency, {})} (${pnlPercent.toFixed(2)}%)`}
            icon={pnl >= 0 ? <TrendingUp sx={{ fontSize: 40 }} /> : <TrendingDown sx={{ fontSize: 40 }} />}
            color={pnl >= 0 ? 'success' : 'error'}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card
            sx={{
              background: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'linear-gradient(145deg, rgba(18, 18, 26, 0.95) 0%, rgba(30, 30, 45, 0.95) 100%)'
                  : 'linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)',
              border: (theme) => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(109, 40, 217, 0.08)'}`,
              borderRadius: 2,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                <AddCircle sx={{ color: 'primary.main', fontSize: 28 }} />
                <Typography variant="h6" fontWeight={700}>
                  Add / Edit Position
                </Typography>
              </Stack>
              <form onSubmit={handleSubmit}>
                <Stack spacing={2}>
                  <Autocomplete
                    value={selectedStock ? { label: `${selectedStock.description} (${selectedStock.symbol})`, stock: selectedStock } : null}
                    onChange={(_, newValue) => setSelectedStock(newValue?.stock || null)}
                    options={stockOptions}
                    filterOptions={filterOptions}
                    getOptionLabel={(option) => option.label}
                    isOptionEqualToValue={(option, value) => option.stock.symbol === value.stock.symbol}
                    renderOption={(props, option) => {
                      const quote = allQuotes[option.stock.symbol];
                      const price = quote?.c;

                      return (
                        <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5 }}>
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: '10px',
                              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                            }}
                          >
                            {option.stock.symbol?.slice(0, 2).toUpperCase()}
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" fontWeight={600}>{option.stock.description}</Typography>
                            <Typography variant="caption" color="text.secondary">{option.stock.symbol}</Typography>
                          </Box>
                          {price && (
                            <Typography variant="body2" fontWeight={600} color="primary.main">
                              {formatCurrency(
                                convert(price, 'USD', currency, fxRates),
                                currency,
                                fxRates
                              )}
                            </Typography>
                          )}
                        </Box>
                      );
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Search & Select Stock"
                        placeholder="Type to search from all available stocks..."
                        fullWidth
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: selectedStock ? (
                            <Box
                              sx={{
                                width: 28,
                                height: 28,
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 700,
                                fontSize: '0.65rem',
                                mr: 1,
                              }}
                            >
                              {selectedStock.symbol?.slice(0, 2).toUpperCase()}
                            </Box>
                          ) : null,
                        }}
                      />
                    )}
                    fullWidth
                    sx={{ 
                      '& .MuiAutocomplete-listbox': { maxHeight: 350 },
                    }}
                  />
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      label="Quantity"
                      type="number"
                      value={form.quantity}
                      onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                      fullWidth
                      InputProps={{ inputProps: { min: 0, step: 'any' } }}
                    />
                    <TextField
                      label="Buy Price (per share)"
                      type="number"
                      value={form.cost}
                      onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
                      fullWidth
                      InputProps={{ inputProps: { min: 0, step: 'any' } }}
                    />
                    <TextField
                      select
                      label="Currency"
                      value={form.costCurrency}
                      onChange={(e) => setForm((f) => ({ ...f, costCurrency: e.target.value as any }))}
                      sx={{ minWidth: 120 }}
                    >
                      {Object.keys(fxRates || { USD: 1 }).map((code) => (
                        <MenuItem key={code} value={code}>
                          {code}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Stack>
                  <Button 
                    variant="contained" 
                    type="submit" 
                    size="large"
                    startIcon={<AddCircle />}
                    disabled={!selectedStock}
                    sx={{ 
                      py: 1.5,
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                      },
                    }}
                  >
                    {selectedStock ? `Add ${selectedStock.symbol} to Portfolio` : 'Select a Stock'}
                  </Button>
                </Stack>
              </form>
            </CardContent>
          </Card>

          <Card
            sx={{
              background: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(51, 65, 85, 0.9) 100%)'
                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)',
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={700}>
                Holdings
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Asset</strong></TableCell>
                    <TableCell align="right"><strong>Quantity</strong></TableCell>
                    <TableCell align="right"><strong>Buy Price</strong></TableCell>
                    <TableCell align="right"><strong>Current Price</strong></TableCell>
                    <TableCell align="right"><strong>Value</strong></TableCell>
                    <TableCell align="right"><strong>P/L</strong></TableCell>
                    <TableCell align="center"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {entries.map((entry) => {
                    const quote = quotes[entry.symbol];
                    const { buyPriceLocal, currentPriceLocal, valueLocal, pnlLocal, pnlPct } = computeEntry(
                      entry,
                      quote,
                      currency,
                      fxRates
                    );
                    const isPositive = (pnlLocal ?? 0) >= 0;
                    return (
                      <TableRow key={entry.id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{entry.symbol}</Typography>
                            <Typography variant="caption" color="text.secondary">{entry.name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">{entry.quantity}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" alignItems="center" spacing={0.5} justifyContent="flex-end">
                            <Chip size="small" label={entry.costCurrency || '—'} sx={{ height: 20 }} />
                            <Typography variant="body2">{formatCurrency(buyPriceLocal, currency, fxRates)}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell align="right">{formatCurrency(currentPriceLocal, currency, fxRates)}</TableCell>
                        <TableCell align="right">
                          <Typography fontWeight={600}>{formatCurrency(valueLocal, currency, fxRates)}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          {pnlLocal !== null ? (
                            <Box>
                              <Typography
                                variant="body2"
                                fontWeight={600}
                                color={isPositive ? 'success.main' : 'error.main'}
                              >
                                {formatCurrency(pnlLocal, currency, fxRates)}
                              </Typography>
                              <Typography
                                variant="caption"
                                color={isPositive ? 'success.main' : 'error.main'}
                              >
                                ({pnlPct?.toFixed(2) ?? '0.00'}%)
                              </Typography>
                            </Box>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEdit(entry)}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleRemove(entry.symbol)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {entries.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography color="text.secondary" py={3}>
                          No holdings yet. Add your first position above.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card
            sx={{
              background: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'linear-gradient(145deg, rgba(18, 18, 26, 0.95) 0%, rgba(30, 30, 45, 0.95) 100%)'
                  : 'linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)',
              border: (theme) => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(109, 40, 217, 0.08)'}`,
              borderRadius: 2,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PieChart sx={{ color: 'white', fontSize: 24 }} />
                </Box>
                <Typography variant="h6" fontWeight={700}>
                  Portfolio Distribution
                </Typography>
              </Stack>
              {entries.length > 0 ? (
                <PortfolioChart entries={entries} quotes={quotes} currency={currency} fxRates={fxRates} />
              ) : (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <PieChart sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                  <Typography color="text.secondary">
                    Add holdings to see distribution
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}