import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Stack,
    TextField,
    ToggleButtonGroup,
    ToggleButton,
    Autocomplete,
    Box,
    Typography,
    Alert,
    Chip,
    CircularProgress,
    Paper,
    IconButton,
} from '@mui/material';
import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CurrencyBitcoin, ShowChart, TrendingUp, TrendingDown, Close, ShoppingCart } from '@mui/icons-material';
import { getListings } from '../api';
import { getStockSymbols, getStockQuote, getBatchQuotes } from '../stockApi';
import { executeTrade } from '../virtualTradingApi';
import { VirtualHolding, Coin } from '../types';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, convert } from '../utils';
import { usePortfolio } from '../state/PortfolioContext';

// Popular stocks for dropdown prices
const popularSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM', 'V', 'WMT', 'JNJ', 'PG', 'BAC', 'DIS', 'NFLX', 'ORCL', 'CSCO', 'INTC', 'AMD', 'CRM'];

interface TradingModalProps {
    open: boolean;
    onClose: () => void;
    balance: number;
    holdings: VirtualHolding[];
}

export function TradingModal({ open, onClose, balance, holdings }: TradingModalProps) {
    const { user } = useAuth();
    const { currency, fxRates } = usePortfolio();
    const queryClient = useQueryClient();

    const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
    const [assetType, setAssetType] = useState<'crypto' | 'stock'>('crypto');
    const [selectedAsset, setSelectedAsset] = useState<any>(null);
    const [quantity, setQuantity] = useState('');
    const [error, setError] = useState('');

    // Fetch crypto listings
    const { data: cryptoData } = useQuery({
        queryKey: ['listings'],
        queryFn: getListings,
        enabled: assetType === 'crypto',
    });

    // Fetch stock symbols
    const { data: stockData } = useQuery({
        queryKey: ['stock-symbols'],
        queryFn: () => getStockSymbols('US'),
        enabled: assetType === 'stock',
    });

    // Fetch popular stock quotes
    const { data: popularQuotes = {} } = useQuery({
        queryKey: ['stock-quotes-popular'],
        queryFn: () => getBatchQuotes(popularSymbols),
        enabled: assetType === 'stock',
        staleTime: 24 * 60 * 60 * 1000,
    });

    // Get current price for selected asset
    const { data: stockQuoteData } = useQuery({
        queryKey: ['stock-quote', selectedAsset?.symbol],
        queryFn: () => getStockQuote(selectedAsset.symbol),
        enabled: assetType === 'stock' && !!selectedAsset?.symbol,
    });

    // Execute trade mutation
    const tradeMutation = useMutation({
        mutationFn: (trade: any) => executeTrade(trade, user?.uid),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['virtual-portfolio'] });
            handleClose();
        },
        onError: (err: any) => {
            setError(err.message || 'Trade failed');
        },
    });

    // Get current price
    const currentPrice = useMemo(() => {
        if (!selectedAsset) return 0;

        if (assetType === 'crypto') {
            const priceUSD = selectedAsset.quote?.USD?.price || 0;
            return convert(priceUSD, 'USD', 'INR', fxRates);
        } else {
            const priceUSD = stockQuoteData?.c || 0;
            return convert(priceUSD, 'USD', 'INR', fxRates);
        }
    }, [selectedAsset, assetType, stockQuoteData, fxRates]);

    // Calculate total cost/proceeds
    const total = (currentPrice || 0) * Number(quantity || 0);

    // Get available quantity for selling
    const availableQuantity = useMemo(() => {
        if (tradeType === 'sell' && selectedAsset) {
            const holding = holdings.find(
                h => h.assetId === String(selectedAsset.id) && h.assetType === assetType
            );
            return holding?.quantity || 0;
        }
        return 0;
    }, [tradeType, selectedAsset, holdings, assetType]);

    // Asset options for autocomplete
    const assetOptions = useMemo(() => {
        if (assetType === 'crypto') {
            const coins = cryptoData?.data || [];
            return coins.map((coin: Coin) => ({
                id: coin.id,
                symbol: coin.symbol,
                name: coin.name,
                type: 'crypto',
                quote: coin.quote,
            }));
        } else {
            const stocks = stockData || [];
            const options = stocks.map((stock: any) => {
                const quote = popularQuotes[stock.symbol];
                const price = quote?.c || 0;
                return {
                    id: stock.symbol,
                    symbol: stock.symbol,
                    name: stock.description || stock.displaySymbol,
                    type: 'stock',
                    price,
                };
            });
            // Sort by price descending and limit to 100
            return options.sort((a, b) => b.price - a.price).slice(0, 100);
        }
    }, [assetType, cryptoData, stockData, popularQuotes]);

    // Validation
    const canTrade = useMemo(() => {
        if (!selectedAsset || !quantity || Number(quantity) <= 0 || (currentPrice || 0) <= 0) return false;
        if (tradeType === 'buy') return total <= balance;
        return Number(quantity) <= availableQuantity;
    }, [selectedAsset, quantity, tradeType, total, balance, availableQuantity, currentPrice]);

    const validationMessage = useMemo(() => {
        if (!selectedAsset || !quantity) return '';
        if ((currentPrice || 0) <= 0) return 'Fetching current market price...';
        if (tradeType === 'buy' && total > balance) {
            return `Insufficient balance. You need ₹${total.toLocaleString()} but have ₹${balance.toLocaleString()}`;
        }
        if (tradeType === 'sell' && Number(quantity) > availableQuantity) {
            return `Insufficient holdings. You have ${availableQuantity} ${selectedAsset.symbol}`;
        }
        return '';
    }, [tradeType, selectedAsset, quantity, total, balance, availableQuantity, currentPrice]);

    const handleClose = () => {
        setSelectedAsset(null);
        setQuantity('');
        setError('');
        onClose();
    };

    const handleTrade = () => {
        if (!canTrade || !selectedAsset) return;
        tradeMutation.mutate({
            type: tradeType,
            assetType,
            assetId: String(selectedAsset.id),
            symbol: selectedAsset.symbol,
            name: selectedAsset.name,
            quantity: Number(quantity),
            price: currentPrice,
        });
    };

    useEffect(() => {
        setSelectedAsset(null);
        setQuantity('');
        setError('');
    }, [assetType]);

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    background: (theme) => theme.palette.mode === 'dark'
                        ? 'rgba(15, 23, 42, 0.98)'
                        : '#ffffff',
                    backgroundImage: 'none',
                    boxShadow: (theme) => theme.palette.mode === 'dark'
                        ? '0 10px 40px rgba(0, 0, 0, 0.4)'
                        : '0 10px 40px rgba(0, 0, 0, 0.1)',
                    backdropFilter: 'blur(10px)',
                }
            }}
        >
            <DialogTitle sx={{ p: 3, pb: 0 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box sx={{
                            p: 1,
                            borderRadius: 2,
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                            color: 'white',
                            display: 'flex',
                        }}>
                            <ShoppingCart fontSize="small" />
                        </Box>
                        <Typography variant="h6" fontWeight={800}>
                            {tradeType === 'buy' ? 'Buy' : 'Sell'} {assetType === 'crypto' ? 'Crypto' : 'Stock'}
                        </Typography>
                    </Stack>
                    <IconButton onClick={handleClose} size="small" sx={{ color: 'text.disabled' }}>
                        <Close fontSize="small" />
                    </IconButton>
                </Stack>
            </DialogTitle>

            <DialogContent sx={{ p: 3 }}>
                <Stack spacing={3} sx={{ mt: 1 }}>
                    <Stack direction="row" spacing={1.5}>
                        <ToggleButtonGroup
                            value={tradeType}
                            exclusive
                            onChange={(_, v) => v && setTradeType(v)}
                            fullWidth
                            size="small"
                            sx={{
                                '& .MuiToggleButton-root': {
                                    fontWeight: 700,
                                    borderRadius: 2,
                                    py: 1.25,
                                    transition: 'all 0.2s',
                                }
                            }}
                        >
                            <ToggleButton
                                value="buy"
                                sx={{
                                    color: 'success.main',
                                    '&.Mui-selected': {
                                        bgcolor: 'success.main',
                                        color: 'white',
                                        boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)',
                                        '&:hover': { bgcolor: 'success.dark' }
                                    }
                                }}
                            >
                                BUY
                            </ToggleButton>
                            <ToggleButton
                                value="sell"
                                sx={{
                                    color: 'error.main',
                                    '&.Mui-selected': {
                                        bgcolor: 'error.main',
                                        color: 'white',
                                        boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
                                        '&:hover': { bgcolor: 'error.dark' }
                                    }
                                }}
                            >
                                SELL
                            </ToggleButton>
                        </ToggleButtonGroup>

                        <ToggleButtonGroup
                            value={assetType}
                            exclusive
                            onChange={(_, v) => v && setAssetType(v)}
                            fullWidth
                            size="small"
                            sx={{
                                '& .MuiToggleButton-root': {
                                    fontWeight: 700,
                                    borderRadius: 2,
                                    py: 1.25,
                                    transition: 'all 0.2s',
                                    '&.Mui-selected': {
                                        bgcolor: 'primary.main',
                                        color: 'white',
                                        boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
                                    }
                                }
                            }}
                        >
                            <ToggleButton value="crypto">CRYPTO</ToggleButton>
                            <ToggleButton value="stock">STOCK</ToggleButton>
                        </ToggleButtonGroup>
                    </Stack>

                    <Autocomplete
                        value={selectedAsset}
                        onChange={(_, nv) => setSelectedAsset(nv)}
                        options={assetOptions}
                        getOptionLabel={(o) => `${o.name} (${o.symbol})`}
                        renderOption={(props, option) => {
                            if (option.type === 'stock') {
                                const priceInCurrency = convert(option.price || 0, 'USD', 'INR', fxRates) || 0;
                                return (
                                    <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5 }}>
                                        <Box sx={{
                                            width: 36, height: 36, borderRadius: '10px',
                                            background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'white', fontWeight: 700, fontSize: '0.75rem',
                                        }}>
                                            {option.symbol?.slice(0, 2).toUpperCase()}
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="body2" fontWeight={600}>{option.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">{option.symbol}</Typography>
                                        </Box>
                                        {option.price > 0 && (
                                            <Typography variant="body2" fontWeight={600} color="primary.main">
                                                ₹{priceInCurrency.toLocaleString()}
                                            </Typography>
                                        )}
                                    </Box>
                                );
                            } else if (option.type === 'crypto') {
                                const priceUSD = option.quote?.USD?.price || 0;
                                const priceInCurrency = convert(priceUSD, 'USD', 'INR', fxRates) || 0;
                                return (
                                    <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5 }}>
                                        <Box sx={{
                                            width: 36, height: 36, borderRadius: '10px',
                                            background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'white', fontWeight: 700, fontSize: '0.75rem',
                                        }}>
                                            {option.symbol?.slice(0, 2).toUpperCase()}
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="body2" fontWeight={600}>{option.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">{option.symbol}</Typography>
                                        </Box>
                                        {priceUSD > 0 && (
                                            <Typography variant="body2" fontWeight={600} color="primary.main">
                                                ₹{priceInCurrency.toLocaleString()}
                                            </Typography>
                                        )}
                                    </Box>
                                );
                            }
                            return <Box component="li" {...props}>{option.name} ({option.symbol})</Box>;
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label={`Select ${assetType}`}
                                placeholder="Search..."
                                InputProps={{
                                    ...params.InputProps,
                                    sx: { borderRadius: 2.5 }
                                }}
                            />
                        )}
                        loading={assetType === 'crypto' ? !cryptoData : !stockData}
                    />

                    <TextField
                        label="Quantity"
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        fullWidth
                        helperText={tradeType === 'sell' && selectedAsset ? `Available: ${availableQuantity} ${selectedAsset.symbol}` : ''}
                        InputProps={{
                            sx: { borderRadius: 2.5 },
                            inputProps: { min: 0, step: assetType === 'crypto' ? '0.0001' : '1' }
                        }}
                    />

                    {selectedAsset && (
                        <Paper
                            variant="outlined"
                            sx={{
                                p: 2.5,
                                borderRadius: 2.5,
                                bgcolor: (theme) => theme.palette.mode === 'dark'
                                    ? 'rgba(139, 92, 246, 0.08)'
                                    : 'rgba(139, 92, 246, 0.04)',
                                borderColor: (theme) => theme.palette.mode === 'dark'
                                    ? 'rgba(139, 92, 246, 0.3)'
                                    : 'rgba(139, 92, 246, 0.2)',
                                borderWidth: 1.5,
                            }}
                        >
                            <Stack spacing={1.5}>
                                <Stack direction="row" justifyContent="space-between">
                                    <Typography variant="body2" color="text.secondary" fontWeight={600}>Market Price</Typography>
                                    <Typography variant="body2" fontWeight={700}>₹{(currentPrice || 0).toLocaleString()}</Typography>
                                </Stack>
                                <Stack direction="row" justifyContent="space-between" sx={{ pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                                    <Typography variant="subtitle1" fontWeight={800}>{tradeType === 'buy' ? 'Total Cost' : 'Proceeds'}</Typography>
                                    <Typography variant="subtitle1" fontWeight={800} color="primary.main">₹{total.toLocaleString()}</Typography>
                                </Stack>
                            </Stack>
                        </Paper>
                    )}

                    <Box sx={{ p: 2, borderRadius: 2, background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: 'white' }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="caption" sx={{ color: 'white', fontWeight: 800, letterSpacing: 1 }}>AVAILABLE CASH</Typography>
                            <Typography variant="h6" fontWeight={800} color="white">₹{balance.toLocaleString()}</Typography>
                        </Stack>
                    </Box>

                    {validationMessage && <Alert severity="info" sx={{ borderRadius: 2, fontWeight: 500 }}>{validationMessage}</Alert>}
                    {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
                </Stack>
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 0 }}>
                <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    onClick={handleTrade}
                    disabled={!canTrade || tradeMutation.isPending}
                    sx={{
                        py: 1.75,
                        borderRadius: 2.5,
                        fontWeight: 800,
                        fontSize: '1rem',
                        background: tradeType === 'buy'
                            ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                            : 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
                        boxShadow: tradeType === 'buy'
                            ? '0 4px 12px rgba(34, 197, 94, 0.3)'
                            : '0 4px 12px rgba(239, 68, 68, 0.3)',
                        transition: 'all 0.2s',
                        '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: tradeType === 'buy'
                                ? '0 6px 16px rgba(34, 197, 94, 0.4)'
                                : '0 6px 16px rgba(239, 68, 68, 0.4)',
                        },
                    }}
                >
                    {tradeMutation.isPending ? <CircularProgress size={24} color="inherit" /> : `CONFIRM ${tradeType.toUpperCase()}`}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
