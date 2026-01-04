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
import { AccountBalance, TrendingUp, TrendingDown, Refresh, ShoppingCart, AttachMoney } from '@mui/icons-material';
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

    const coins: Coin[] = cryptoData?.data || [];

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
    const totalPnL = totalValue - 1000000; // Initial balance was 1M
    const pnlPercent = (totalPnL / 1000000) * 100;

    // Convert balance to selected currency
    const balanceInCurrency = convert(portfolio.balance, 'INR', currency, fxRates);
    const totalValueInCurrency = convert(totalValue, 'INR', currency, fxRates);
    const pnlInCurrency = convert(totalPnL, 'INR', currency, fxRates);

    // Chart data for portfolio distribution
    const chartData = portfolio.holdings.map((holding, i) => ({
        name: holding.symbol,
        value: holding.totalCost,
        color: CHART_COLORS[i % CHART_COLORS.length],
    }));

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <Typography>Loading virtual portfolio...</Typography>
            </Box>
        );
    }

    return (
        <Stack spacing={3}>
            {/* Header Alert */}
            <Alert severity="info" sx={{ borderRadius: 2 }}>
                <Typography variant="body2" fontWeight={600}>
                    Virtual Trading Practice Mode
                </Typography>
                <Typography variant="body2">
                    Practice trading with ₹1,000,000 virtual money. All trades use real-time market prices but no real money is involved.
                </Typography>
            </Alert>

            {/* Stats Cards */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                    <StatCard
                        label="Cash Balance"
                        value={formatCurrency(balanceInCurrency, currency, {})}
                        subValue="Available to trade"
                        icon={<AttachMoney sx={{ fontSize: 40 }} />}
                        color="#06b6d4"
                    />
                </Grid>
                <Grid item xs={12} md={3}>
                    <StatCard
                        label="Portfolio Value"
                        value={formatCurrency(totalValueInCurrency, currency, {})}
                        subValue="Cash + Holdings"
                        icon={<AccountBalance sx={{ fontSize: 40 }} />}
                        color="#8b5cf6"
                    />
                </Grid>
                <Grid item xs={12} md={3}>
                    <StatCard
                        label="Total P/L"
                        value={formatCurrency(pnlInCurrency, currency, {})}
                        subValue={`${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}%`}
                        icon={totalPnL >= 0 ? <TrendingUp sx={{ fontSize: 40 }} /> : <TrendingDown sx={{ fontSize: 40 }} />}
                        color={totalPnL >= 0 ? '#22c55e' : '#f43f5e'}
                    />
                </Grid>
                <Grid item xs={12} md={3}>
                    <StatCard
                        label="Total Trades"
                        value={portfolio.transactions.length.toString()}
                        subValue="Buy & Sell orders"
                        icon={<ShoppingCart sx={{ fontSize: 40 }} />}
                        color="#f59e0b"
                    />
                </Grid>
            </Grid>

            {/* Action Buttons */}
            <Stack direction="row" spacing={2}>
                <Button
                    variant="contained"
                    size="large"
                    startIcon={<ShoppingCart />}
                    onClick={() => setTradingModalOpen(true)}
                    sx={{
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                        },
                    }}
                >
                    Buy / Sell Assets
                </Button>
                <Button
                    variant="outlined"
                    size="large"
                    startIcon={<Refresh />}
                    onClick={() => setResetDialogOpen(true)}
                    color="error"
                >
                    Reset Portfolio
                </Button>
            </Stack>

            <Grid container spacing={3}>
                {/* Holdings Table */}
                <Grid item xs={12} lg={8}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom fontWeight={700}>
                                Your Holdings
                            </Typography>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell><strong>Asset</strong></TableCell>
                                        <TableCell align="right"><strong>Type</strong></TableCell>
                                        <TableCell align="right"><strong>Quantity</strong></TableCell>
                                        <TableCell align="right"><strong>Avg Buy Price</strong></TableCell>
                                        <TableCell align="right"><strong>Current Price</strong></TableCell>
                                        <TableCell align="right"><strong>Value</strong></TableCell>
                                        <TableCell align="right"><strong>P/L</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {portfolio.holdings.map((holding) => {
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

                                        const currentValue = currentPriceINR * holding.quantity;
                                        const pnl = currentValue - holding.totalCost;
                                        const pnlPct = holding.totalCost > 0 ? (pnl / holding.totalCost) * 100 : 0;
                                        const isPositive = pnl >= 0;

                                        return (
                                            <TableRow key={`${holding.assetType}-${holding.assetId}`} hover>
                                                <TableCell>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={600}>{holding.symbol}</Typography>
                                                        <Typography variant="caption" color="text.secondary">{holding.name}</Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Chip
                                                        label={holding.assetType}
                                                        size="small"
                                                        color={holding.assetType === 'crypto' ? 'primary' : 'secondary'}
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
                                                <Typography color="text.secondary" py={3}>
                                                    No holdings yet. Click "Buy / Sell Assets" to start trading!
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Transaction History */}
                    <Card sx={{ mt: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom fontWeight={700}>
                                Transaction History
                            </Typography>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell><strong>Date</strong></TableCell>
                                        <TableCell><strong>Type</strong></TableCell>
                                        <TableCell><strong>Asset</strong></TableCell>
                                        <TableCell align="right"><strong>Quantity</strong></TableCell>
                                        <TableCell align="right"><strong>Price</strong></TableCell>
                                        <TableCell align="right"><strong>Total</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {portfolio.transactions.slice(0, 10).map((tx) => (
                                        <TableRow key={tx.id} hover>
                                            <TableCell>
                                                <Typography variant="caption">
                                                    {new Date(tx.timestamp).toLocaleDateString()} {new Date(tx.timestamp).toLocaleTimeString()}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={tx.type.toUpperCase()}
                                                    size="small"
                                                    color={tx.type === 'buy' ? 'success' : 'error'}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={600}>{tx.symbol}</Typography>
                                            </TableCell>
                                            <TableCell align="right">{tx.quantity}</TableCell>
                                            <TableCell align="right">₹{tx.price.toLocaleString()}</TableCell>
                                            <TableCell align="right">
                                                <Typography fontWeight={600}>₹{tx.total.toLocaleString()}</Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {portfolio.transactions.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center">
                                                <Typography color="text.secondary" py={2}>
                                                    No transactions yet
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Portfolio Chart */}
                <Grid item xs={12} lg={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom fontWeight={700}>
                                Portfolio Distribution
                            </Typography>
                            {portfolio.holdings.length > 0 ? (
                                <PortfolioChart data={chartData} />
                            ) : (
                                <Box sx={{ textAlign: 'center', py: 6 }}>
                                    <Typography color="text.secondary">
                                        No holdings to display
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Trading Modal */}
            <TradingModal
                open={tradingModalOpen}
                onClose={() => setTradingModalOpen(false)}
                balance={portfolio.balance}
                holdings={portfolio.holdings}
            />

            {/* Reset Confirmation Dialog */}
            <Dialog open={resetDialogOpen} onClose={() => setResetDialogOpen(false)}>
                <DialogTitle>Reset Virtual Portfolio?</DialogTitle>
                <DialogContent>
                    <Typography>
                        This will reset your virtual portfolio to the initial state:
                    </Typography>
                    <Box component="ul" sx={{ mt: 2 }}>
                        <li>Cash balance: ₹1,000,000</li>
                        <li>All holdings will be cleared</li>
                        <li>Transaction history will be deleted</li>
                    </Box>
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        This action cannot be undone!
                    </Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setResetDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={() => resetMutation.mutate()}
                        color="error"
                        variant="contained"
                        disabled={resetMutation.isPending}
                    >
                        {resetMutation.isPending ? 'Resetting...' : 'Reset Portfolio'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Stack>
    );
}

function StatCard({ label, value, subValue, icon, color }: {
    label: string;
    value: string;
    subValue: string;
    icon: React.ReactNode;
    color: string;
}) {
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
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: color,
                },
            }}
        >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom fontWeight={500}>
                        {label}
                    </Typography>
                    <Typography variant="h5" fontWeight={700} gutterBottom>
                        {value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {subValue}
                    </Typography>
                </Box>
                <Box
                    sx={{
                        color: color,
                        opacity: 0.8,
                        bgcolor: `${color}15`,
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

function PortfolioChart({ data }: { data: Array<{ name: string; value: number; color: string }> }) {
    const total = data.reduce((sum, d) => sum + d.value, 0);

    return (
        <Box sx={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <RechartsPie>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                const percent = ((data.value / total) * 100).toFixed(1);
                                return (
                                    <Paper sx={{ p: 1.5 }}>
                                        <Typography variant="body2" fontWeight={600}>{data.name}</Typography>
                                        <Typography variant="caption">₹{data.value.toLocaleString()} ({percent}%)</Typography>
                                    </Paper>
                                );
                            }
                            return null;
                        }}
                    />
                </RechartsPie>
            </ResponsiveContainer>
            <Stack spacing={1} sx={{ mt: 2 }}>
                {data.map((item) => {
                    const percent = ((item.value / total) * 100).toFixed(1);
                    return (
                        <Stack key={item.name} direction="row" alignItems="center" spacing={1}>
                            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: item.color }} />
                            <Typography variant="body2" sx={{ flex: 1 }}>{item.name}</Typography>
                            <Chip label={`${percent}%`} size="small" />
                        </Stack>
                    );
                })}
            </Stack>
        </Box>
    );
}

const CHART_COLORS = [
    '#8b5cf6', '#06b6d4', '#f472b6', '#22c55e', '#f59e0b',
    '#3b82f6', '#f43f5e', '#a855f7', '#14b8a6', '#eab308',
];
