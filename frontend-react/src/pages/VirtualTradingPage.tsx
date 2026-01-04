import {
    Card,
    CardContent,
    Typography,
    Stack,
    Button,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Chip,
    Grid,
    Paper,
    Box,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
} from '@mui/material';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AccountBalance, TrendingUp, TrendingDown, Refresh, ShoppingCart, AttachMoney, PieChart as PieChartIcon, AddCircle } from '@mui/icons-material';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { VirtualPortfolio, VirtualHolding, Coin } from '../types';
import { getVirtualPortfolio, resetVirtualPortfolio } from '../virtualTradingApi';
import { getListings } from '../api';
import { getBatchQuotes } from '../stockApi';
import { useAuth } from '../context/AuthContext';
import { usePortfolio } from '../state/PortfolioContext';
import { formatCurrency, convert } from '../utils';
import { TradingModal } from '../components/TradingModal';

export default function VirtualTradingPage() {
    const { user } = useAuth();
    const { currency, fxRates } = usePortfolio();
    const queryClient = useQueryClient();
    const [tradingModalOpen, setTradingModalOpen] = useState(false);
    const [resetDialogOpen, setResetDialogOpen] = useState(false);

    // Fetch crypto listings for price data
    const { data: cryptoData } = useQuery({
        queryKey: ['listings'],
        queryFn: getListings,
    });

    // Fetch virtual portfolio
    const { data: portfolioData, isLoading } = useQuery({
        queryKey: ['virtual-portfolio', user?.uid],
        queryFn: () => getVirtualPortfolio(user?.uid),
        refetchInterval: 30000, // Refetch every 30 seconds for real-time prices
    });

    const portfolio: VirtualPortfolio = portfolioData?.data || {
        balance: 1000000,
        holdings: [],
        transactions: [],
    };

    const coins: Coin[] = cryptoData?.data || [];

    // Get stock symbols for fetching quotes
    const stockSymbols = portfolio.holdings
        .filter(h => h.assetType === 'stock')
        .map(h => h.symbol);

    // Fetch stock quotes
    const { data: stockQuotes } = useQuery({
        queryKey: ['stock-quotes-batch', stockSymbols],
        queryFn: () => getBatchQuotes(stockSymbols),
        enabled: stockSymbols.length > 0,
    });

    // Reset portfolio mutation
    const resetMutation = useMutation({
        mutationFn: () => resetVirtualPortfolio(user?.uid),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['virtual-portfolio'] });
            setResetDialogOpen(false);
        },
    });

    // Calculate portfolio value with real-time prices
    const holdingsValue = useMemo(() => {
        return portfolio.holdings.reduce((sum, holding) => {
            let currentPriceINR = 0;

            if (holding.assetType === 'crypto') {
                const coin = coins.find(c => String(c.id) === String(holding.assetId));
                if (coin?.quote?.USD?.price) {
                    currentPriceINR = convert(coin.quote.USD.price, 'USD', 'INR', fxRates);
                }
            } else {
                const quote = stockQuotes?.[holding.symbol];
                if (quote?.c) {
                    currentPriceINR = convert(quote.c, 'USD', 'INR', fxRates);
                }
            }

            return sum + (currentPriceINR * holding.quantity);
        }, 0);
    }, [portfolio.holdings, coins, stockQuotes, fxRates]);

    const totalValue = portfolio.balance + holdingsValue;
    const initialBalance = 1000000;
    const totalPnL = totalValue - initialBalance;
    const pnlPercent = (totalPnL / initialBalance) * 100;

    // Convert values to selected currency
    const balanceInCurrency = convert(portfolio.balance, 'INR', currency, fxRates) || 0;
    const totalValueInCurrency = convert(totalValue, 'INR', currency, fxRates) || 0;
    const pnlInCurrency = convert(totalPnL, 'INR', currency, fxRates) || 0;

    // Chart data for portfolio distribution
    const chartData = useMemo(() => {
        return portfolio.holdings.map((holding) => {
            let currentPriceINR = 0;
            if (holding.assetType === 'crypto') {
                const coin = coins.find(c => String(c.id) === String(holding.assetId));
                currentPriceINR = coin?.quote?.USD?.price ? (convert(coin.quote.USD.price, 'USD', 'INR', fxRates) || 0) : 0;
            } else {
                currentPriceINR = stockQuotes?.[holding.symbol]?.c ? (convert(stockQuotes[holding.symbol].c, 'USD', 'INR', fxRates) || 0) : 0;
            }
            return {
                name: holding.symbol,
                fullName: holding.name,
                value: currentPriceINR * holding.quantity,
            };
        }).filter(d => d.value > 0);
    }, [portfolio.holdings, coins, stockQuotes, fxRates]);

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <Typography>Loading virtual portfolio...</Typography>
            </Box>
        );
    }

    return (
        <Stack spacing={3}>
            {/* Navigation & Summary Alert */}
            <Alert severity="info" sx={{
                borderRadius: 2,
                background: (theme) => theme.palette.mode === 'dark' ? 'rgba(2, 132, 199, 0.1)' : 'rgba(2, 132, 199, 0.05)',
                border: '1px solid rgba(2, 132, 199, 0.2)',
            }}>
                <Typography variant="body2" fontWeight={600} color="info.main">
                    Virtual Trading Practice Mode
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Trade with ₹1,000,000 virtual balance using real-time market data. No real money involved.
                </Typography>
            </Alert>

            {/* Stat Cards - Mirroring PortfolioPage style */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <StatCard
                        label="Total Value"
                        value={formatCurrency(totalValueInCurrency, currency, {})}
                        icon={<AccountBalance sx={{ fontSize: 40 }} />}
                        color="primary"
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <StatCard
                        label="Cash Balance"
                        value={formatCurrency(balanceInCurrency, currency, {})}
                        icon={<AttachMoney sx={{ fontSize: 40 }} />}
                        color="info"
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <StatCard
                        label="Total P/L"
                        value={`${formatCurrency(pnlInCurrency, currency, {})} (${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}%)`}
                        icon={totalPnL >= 0 ? <TrendingUp sx={{ fontSize: 40 }} /> : <TrendingDown sx={{ fontSize: 40 }} />}
                        color={totalPnL >= 0 ? 'success' : 'error'}
                    />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                {/* Main Content Area */}
                <Grid item xs={12} lg={8}>
                    <Stack spacing={3}>
                        {/* Action Card */}
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
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Stack direction="row" alignItems="center" spacing={1.5}>
                                        <AddCircle sx={{ color: 'primary.main', fontSize: 28 }} />
                                        <Typography variant="h6" fontWeight={700}>
                                            Execute Virtual Trade
                                        </Typography>
                                    </Stack>
                                    <Stack direction="row" spacing={2}>
                                        <Button
                                            variant="contained"
                                            startIcon={<ShoppingCart />}
                                            onClick={() => setTradingModalOpen(true)}
                                            sx={{
                                                background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                                                '&:hover': { background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)' },
                                                borderRadius: 2,
                                                px: 3,
                                            }}
                                        >
                                            Buy / Sell Assets
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            startIcon={<Refresh />}
                                            onClick={() => setResetDialogOpen(true)}
                                            color="error"
                                            sx={{ borderRadius: 2 }}
                                        >
                                            Reset
                                        </Button>
                                    </Stack>
                                </Stack>
                            </CardContent>
                        </Card>

                        {/* Holdings Table */}
                        <Card sx={{
                            borderRadius: 2,
                            background: (theme) => theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.8)',
                            backdropFilter: 'blur(10px)',
                        }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom fontWeight={700} sx={{ mb: 3 }}>
                                    Your Holdings
                                </Typography>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell><strong>Asset</strong></TableCell>
                                            <TableCell align="right"><strong>Type</strong></TableCell>
                                            <TableCell align="right"><strong>Qty</strong></TableCell>
                                            <TableCell align="right"><strong>Avg Price</strong></TableCell>
                                            <TableCell align="right"><strong>Current</strong></TableCell>
                                            <TableCell align="right"><strong>Value</strong></TableCell>
                                            <TableCell align="right"><strong>P/L</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {portfolio.holdings.map((holding) => {
                                            let currentPriceINR = 0;
                                            if (holding.assetType === 'crypto') {
                                                const coin = coins.find(c => String(c.id) === String(holding.assetId));
                                                currentPriceINR = coin?.quote?.USD?.price ? convert(coin.quote.USD.price, 'USD', 'INR', fxRates) : 0;
                                            } else {
                                                currentPriceINR = stockQuotes?.[holding.symbol]?.c ? convert(stockQuotes[holding.symbol].c, 'USD', 'INR', fxRates) : 0;
                                            }

                                            const currentValue = currentPriceINR * holding.quantity;
                                            const pnl = currentValue - holding.totalCost;
                                            const pnlPct = holding.totalCost > 0 ? (pnl / holding.totalCost) * 100 : 0;
                                            const isPositive = pnl >= 0;

                                            return (
                                                <TableRow key={`${holding.assetType}-${holding.assetId}`} hover>
                                                    <TableCell>
                                                        <Box>
                                                            <Typography variant="body2" fontWeight={600}>{holding.symbol}</Typography>
                                                            <Typography variant="caption" color="text.secondary" noWrap>{holding.name}</Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Chip
                                                            label={holding.assetType}
                                                            size="small"
                                                            sx={{
                                                                height: 20,
                                                                fontSize: '0.65rem',
                                                                bgcolor: holding.assetType === 'crypto' ? 'primary.main' : 'secondary.main',
                                                                color: 'white',
                                                                fontWeight: 600,
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right">{holding.quantity}</TableCell>
                                                    <TableCell align="right">₹{holding.avgBuyPrice.toLocaleString()}</TableCell>
                                                    <TableCell align="right">₹{currentPriceINR.toLocaleString()}</TableCell>
                                                    <TableCell align="right">
                                                        <Typography fontWeight={600}>₹{currentValue.toLocaleString()}</Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Box>
                                                            <Typography
                                                                variant="body2"
                                                                fontWeight={600}
                                                                color={isPositive ? 'success.main' : 'error.main'}
                                                            >
                                                                ₹{pnl.toLocaleString()}
                                                            </Typography>
                                                            <Typography
                                                                variant="caption"
                                                                color={isPositive ? 'success.main' : 'error.main'}
                                                            >
                                                                ({pnlPct.toFixed(2)}%)
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                        {portfolio.holdings.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={7} align="center">
                                                    <Typography color="text.secondary" py={4}>
                                                        No holdings yet. Search and buy assets to begin.
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Transactions History */}
                        <Card sx={{ borderRadius: 2 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom fontWeight={700}>
                                    Recent Activity
                                </Typography>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell><strong>Time</strong></TableCell>
                                            <TableCell><strong>Type</strong></TableCell>
                                            <TableCell><strong>Asset</strong></TableCell>
                                            <TableCell align="right"><strong>Qty</strong></TableCell>
                                            <TableCell align="right"><strong>Price</strong></TableCell>
                                            <TableCell align="right"><strong>Total</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {portfolio.transactions.slice(0, 8).map((tx) => (
                                            <TableRow key={tx.id} hover>
                                                <TableCell>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={tx.type.toUpperCase()}
                                                        size="small"
                                                        variant="outlined"
                                                        color={tx.type === 'buy' ? 'success' : 'error'}
                                                        sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={600}>{tx.symbol}</Typography>
                                                </TableCell>
                                                <TableCell align="right">{tx.quantity}</TableCell>
                                                <TableCell align="right">₹{tx.price.toLocaleString()}</TableCell>
                                                <TableCell align="right">
                                                    <Typography fontWeight={600} variant="body2">₹{tx.total.toLocaleString()}</Typography>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </Stack>
                </Grid>

                {/* Sidebar */}
                <Grid item xs={12} lg={4}>
                    <Card
                        sx={{
                            background: (theme) =>
                                theme.palette.mode === 'dark'
                                    ? 'linear-gradient(145deg, rgba(18, 18, 26, 0.95) 0%, rgba(30, 30, 45, 0.95) 100%)'
                                    : 'linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)',
                            border: (theme) => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(109, 40, 217, 0.08)'}`,
                            borderRadius: 2,
                            height: '100%',
                        }}
                    >
                        <CardContent sx={{ p: 3 }}>
                            <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
                                <Box sx={{
                                    p: 1,
                                    borderRadius: 2,
                                    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <PieChartIcon sx={{ color: 'white', fontSize: 24 }} />
                                </Box>
                                <Typography variant="h6" fontWeight={700}>
                                    Asset Distribution
                                </Typography>
                            </Stack>
                            {chartData.length > 0 ? (
                                <PortfolioChart data={chartData} currency={currency} />
                            ) : (
                                <Box sx={{ textAlign: 'center', py: 8 }}>
                                    <PieChartIcon sx={{ fontSize: 64, color: 'text.disabled', opacity: 0.3, mb: 2 }} />
                                    <Typography variant="body2" color="text.secondary">
                                        Start trading to see distribution
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <TradingModal
                open={tradingModalOpen}
                onClose={() => setTradingModalOpen(false)}
                balance={portfolio.balance}
                holdings={portfolio.holdings}
            />

            <Dialog open={resetDialogOpen} onClose={() => setResetDialogOpen(false)} PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
                <DialogTitle sx={{ fontWeight: 800 }}>Reset Portfolio?</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        This will return your account to its initial state:
                    </Typography>
                    <Stack spacing={1}>
                        <Bullet text="Cash balance reset to ₹1,000,000" />
                        <Bullet text="All current holdings permanently cleared" />
                        <Bullet text="Full transaction history deleted" />
                    </Stack>
                    <Alert severity="warning" sx={{ mt: 3, borderRadius: 2 }}>
                        This action cannot be undone. Are you sure?
                    </Alert>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setResetDialogOpen(false)} sx={{ fontWeight: 600 }}>Keep Trading</Button>
                    <Button
                        onClick={() => resetMutation.mutate()}
                        color="error"
                        variant="contained"
                        disabled={resetMutation.isPending}
                        sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}
                    >
                        {resetMutation.isPending ? 'Resetting...' : 'Confirm Reset'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Stack>
    );
}

function Bullet({ text }: { text: string }) {
    return (
        <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main' }} />
            <Typography variant="body2">{text}</Typography>
        </Stack>
    );
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
    const colorMap: Record<string, string> = {
        primary: '#8b5cf6',
        success: '#22c55e',
        error: '#f43f5e',
        info: '#06b6d4',
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
                        ? 'linear-gradient(145deg, rgba(18, 18, 26, 0.95) 0%, rgba(30, 30, 45, 0.95) 100%)'
                        : 'linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)',
                border: (theme) => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(109, 40, 217, 0.08)'}`,
                borderRadius: 2,
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)' },
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
                    <Typography variant="h5" fontWeight={800}>
                        {value}
                    </Typography>
                </Box>
                <Box sx={{
                    color: accentColor,
                    opacity: 0.9,
                    bgcolor: `${accentColor}15`,
                    p: 1.5,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    {icon}
                </Box>
            </Stack>
        </Paper>
    );
}

function PortfolioChart({ data, currency }: { data: any[]; currency: string }) {
    const colors = ['#8b5cf6', '#06b6d4', '#f472b6', '#22c55e', '#f59e0b', '#3b82f6', '#f43f5e', '#a855f7', '#14b8a6', '#eab308'];
    const total = data.reduce((sum, d) => sum + d.value, 0);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const entry = payload[0].payload;
            const percent = ((entry.value / total) * 100).toFixed(1);
            return (
                <Paper elevation={8} sx={{ p: 2, background: 'rgba(18, 18, 26, 0.95)', border: `2px solid ${payload[0].fill}`, borderRadius: 2 }}>
                    <Typography variant="body2" fontWeight={700} color="white">{entry.fullName}</Typography>
                    <Typography variant="caption" color="grey.400">Value: ₹{entry.value.toLocaleString()}</Typography>
                    <Typography variant="caption" color="grey.400" display="block">Share: {percent}%</Typography>
                </Paper>
            );
        }
        return null;
    };

    const renderLabel = ({ cx, cy }: any) => (
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
            <tspan x={cx} dy="-0.5em" style={{ fontSize: '18px', fontWeight: 800, fill: '#f8fafc' }}>
                {formatCurrency(total, currency, {})}
            </tspan>
            <tspan x={cx} dy="1.5em" style={{ fontSize: '12px', fill: '#94a3b8', fontWeight: 500 }}>Total Value</tspan>
        </text>
    );

    return (
        <Box sx={{ width: '100%' }}>
            <ResponsiveContainer width="100%" height={300}>
                <RechartsPie>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={3}
                        dataKey="value"
                        labelLine={false}
                        label={renderLabel}
                    >
                        {data.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} stroke="rgba(255, 255, 255, 0.2)" strokeWidth={2} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                </RechartsPie>
            </ResponsiveContainer>
            <Stack spacing={1.5} sx={{ mt: 3 }}>
                {data.map((item, i) => {
                    const percent = ((item.value / total) * 100).toFixed(1);
                    return (
                        <Stack key={item.name} direction="row" alignItems="center" spacing={1.5} sx={{ px: 1 }}>
                            <Box sx={{ width: 14, height: 14, borderRadius: '4px', bgcolor: colors[i % colors.length], boxShadow: `0 2px 6px ${colors[i % colors.length]}40` }} />
                            <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }}>{item.name}</Typography>
                            <Chip label={`${percent}%`} size="small" sx={{ fontWeight: 700, bgcolor: `${colors[i % colors.length]}20`, color: colors[i % colors.length], height: 20, fontSize: '0.7rem' }} />
                        </Stack>
                    );
                })}
            </Stack>
        </Box>
    );
}

const CHART_COLORS = ['#8b5cf6', '#06b6d4', '#f472b6', '#22c55e', '#f59e0b', '#3b82f6', '#f43f5e', '#a855f7', '#14b8a6', '#eab308'];
