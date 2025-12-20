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
  Typography as MuiTypography,
  Grid,
  Paper,
  Box,
  IconButton,
  Autocomplete
} from '@mui/material';
import { useEffect, useState, useRef, useMemo } from 'react';
import { AccountBalance, TrendingUp, TrendingDown, Delete, Edit, PieChart, AddCircle } from '@mui/icons-material';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Coin, PortfolioEntry } from '../types';
import { usePortfolio } from '../state/PortfolioContext';
import { convert, formatCurrency, rateFor } from '../utils';

function PortfolioChart({ entries, coins, currency, fxRates }: { entries: PortfolioEntry[]; coins: Coin[]; currency: string; fxRates: Record<string, number> }) {
  const chartData = useMemo(() => {
    return entries.map((entry) => {
      const coin = coins.find((c) => c && String(c.id) === String(entry.id));
      const { valueLocal } = computeEntry(entry, coin, currency, fxRates);
      return {
        name: entry.symbol,
        value: valueLocal || 0,
        fullName: entry.name,
        formatted: formatCurrency(valueLocal || 0, currency, {}),
      };
    }).filter((d) => d.value > 0);
  }, [entries, coins, currency, fxRates]);

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
          const percent = ((data.value / chartData.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(1);
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

export default function PortfolioPage({ coins }: { coins: Coin[] }) {
  const { entries, currency, fxRates, upsertEntry, removeEntry } = usePortfolio();
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);
  const [form, setForm] = useState({ quantity: '', cost: '', costCurrency: currency });

  useEffect(() => {
    setForm((f) => ({ ...f, costCurrency: f.costCurrency || currency }));
  }, [currency]);

  const coinOptions = useMemo(() => {
    return coins.map((c) => ({
      label: `${c.name} (${c.symbol})`,
      coin: c,
    }));
  }, [coins]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(form.quantity);
    const cost = form.cost ? Number(form.cost) : null;
    if (!selectedCoin || !qty) return;
    const costCurrency = form.costCurrency || currency;
    const rate = fxRates?.[costCurrency] || 1;
    const costUsd = cost !== null ? cost / rate : null;
    const entry: PortfolioEntry = {
      id: selectedCoin.id,
      name: selectedCoin.name,
      symbol: selectedCoin.symbol,
      quantity: qty,
      cost,
      costUsd,
      costCurrency
    };
    await upsertEntry(entry);
    setSelectedCoin(null);
    setForm({ quantity: '', cost: '', costCurrency: currency });
  };

  const { invested, value, pnl } = computeTotals(entries, coins, currency, fxRates);
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
                    value={selectedCoin ? { label: `${selectedCoin.name} (${selectedCoin.symbol})`, coin: selectedCoin } : null}
                    onChange={(_, newValue) => setSelectedCoin(newValue?.coin || null)}
                    options={coinOptions}
                    getOptionLabel={(option) => option.label}
                    isOptionEqualToValue={(option, value) => option.coin.id === value.coin.id}
                    renderOption={(props, option) => (
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
                          {option.coin.symbol?.slice(0, 2).toUpperCase()}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight={600}>{option.coin.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{option.coin.symbol}</Typography>
                        </Box>
                        <Typography variant="body2" fontWeight={600} color="primary.main">
                          {formatCurrency(
                            convert(option.coin.quote?.USD?.price || 0, 'USD', currency, fxRates),
                            currency,
                            fxRates
                          )}
                        </Typography>
                      </Box>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Search & Select Coin"
                        placeholder="Type to search from all available coins..."
                        fullWidth
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: selectedCoin ? (
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
                              {selectedCoin.symbol?.slice(0, 2).toUpperCase()}
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
                      label="Buy Price (per coin)"
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
                    disabled={!selectedCoin}
                    sx={{ 
                      py: 1.5,
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                      },
                    }}
                  >
                    {selectedCoin ? `Add ${selectedCoin.symbol} to Portfolio` : 'Select a Coin'}
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
                Categories
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
                    const coin = coins.find((c) => String(c.id) === String(entry.id));
                    const { buyPriceLocal, currentPriceLocal, valueLocal, costBasisLocal, pnlLocal, pnlPct } = computeEntry(
                      entry,
                      coin,
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
                            aria-label={`Edit ${entry.symbol}`}
                            onClick={() => {
                              const coin = coins.find((c) => String(c.id) === String(entry.id));
                              setSelectedCoin(coin || null);
                              setForm({
                                quantity: String(entry.quantity),
                                cost: entry.cost !== null && entry.cost !== undefined ? String(entry.cost) : '',
                                costCurrency: entry.costCurrency || currency
                              });
                            }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            aria-label={`Delete ${entry.symbol}`}
                            onClick={() => void removeEntry(entry.id)}
                          >
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
                          No categories yet. Add your first position above.
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
                <PortfolioChart entries={entries} coins={coins} currency={currency} fxRates={fxRates} />
              ) : (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <PieChart sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                  <Typography color="text.secondary">
                    Add categories to see distribution
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



function computeEntry(entry: PortfolioEntry, coin: Coin | undefined, currency: string, fxRates: Record<string, number>) {
  const rateSelected = rateFor(currency, fxRates);
  const priceUsd = coin?.quote?.USD?.price ?? null;
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

function computeTotals(entries: PortfolioEntry[], coins: Coin[], currency: string, fxRates: Record<string, number>) {
  let invested = 0;
  let value = 0;
  entries.forEach((entry) => {
    const coin = coins.find((c) => String(c.id) === String(entry.id));
    const { costBasisLocal, valueLocal } = computeEntry(entry, coin, currency, fxRates);
    if (costBasisLocal !== null && costBasisLocal !== undefined) invested += costBasisLocal;
    if (valueLocal !== null && valueLocal !== undefined) value += valueLocal;
  });
  return { invested, value, pnl: value - invested };
}

