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
} from '@mui/material';
import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CurrencyBitcoin, ShowChart, TrendingUp, TrendingDown } from '@mui/icons-material';
import { getListings } from '../api';
import { getStockSymbols, getStockQuote } from '../stockApi';
import { executeTrade } from '../virtualTradingApi';
import { VirtualHolding, Coin } from '../types';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, convert } from '../utils';
import { usePortfolio } from '../state/PortfolioContext';

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
            // Convert to INR (virtual trading is in INR)
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
                h => h.assetId === selectedAsset.id && h.assetType === assetType
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
                data: coin,
            }));
        } else {
            const stocks = stockData || [];
            return stocks.slice(0, 100).map((stock: any) => ({
                id: stock.symbol,
                symbol: stock.symbol,
                name: stock.description || stock.displaySymbol,
                type: 'stock',
                data: stock,
            }));
        }
    }, [assetType, cryptoData, stockData]);

    // Validation
    const canTrade = useMemo(() => {
        if (!selectedAsset || !quantity || Number(quantity) <= 0) return false;

        if (tradeType === 'buy') {
            return total <= balance;
        } else {
            return Number(quantity) <= availableQuantity;
        }
    }, [selectedAsset, quantity, tradeType, total, balance, availableQuantity]);

    const validationMessage = useMemo(() => {
        if (!selectedAsset || !quantity) return '';

        if (tradeType === 'buy' && total > balance) {
            return `Insufficient balance. You need ₹${total.toLocaleString()} but have ₹${balance.toLocaleString()}`;
        }

        if (tradeType === 'sell' && Number(quantity) > availableQuantity) {
            return `Insufficient holdings. You have ${availableQuantity} ${selectedAsset.symbol}`;
        }

        return '';
    }, [tradeType, selectedAsset, quantity, total, balance, availableQuantity]);

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
            assetId: selectedAsset.id,
            symbol: selectedAsset.symbol,
            name: selectedAsset.name,
            quantity: Number(quantity),
            price: currentPrice,
        });
    };

    // Reset selected asset when asset type changes
    useEffect(() => {
        setSelectedAsset(null);
        setQuantity('');
        setError('');
    }, [assetType]);

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Stack direction="row" alignItems="center" spacing={1}>
                    {assetType === 'crypto' ? <CurrencyBitcoin /> : <ShowChart />}
                    <Typography variant="h6" fontWeight={700}>
                        {tradeType === 'buy' ? 'Buy' : 'Sell'} {assetType === 'crypto' ? 'Cryptocurrency' : 'Stock'}
                    </Typography>
                </Stack>
            </DialogTitle>

            <DialogContent>
                <Stack spacing={3} sx={{ mt: 1 }}>
                    {/* Trade Type Toggle */}
                    <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Trade Type
                        </Typography>
                        <ToggleButtonGroup
                            value={tradeType}
                            exclusive
                            onChange={(_, value) => value && setTradeType(value)}
                            fullWidth
                        >
                            <ToggleButton value="buy" color="success">
                                <TrendingUp sx={{ mr: 1 }} />
                                Buy
                            </ToggleButton>
                            <ToggleButton value="sell" color="error">
                                <TrendingDown sx={{ mr: 1 }} />
                                Sell
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Box>

                    {/* Asset Type Toggle */}
                    <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Asset Type
                        </Typography>
                        <ToggleButtonGroup
                            value={assetType}
                            exclusive
                            onChange={(_, value) => value && setAssetType(value)}
                            fullWidth
                        >
                            <ToggleButton value="crypto">
                                <CurrencyBitcoin sx={{ mr: 1 }} />
                                Crypto
                            </ToggleButton>
                            <ToggleButton value="stock">
                                <ShowChart sx={{ mr: 1 }} />
                                Stock
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Box>

                    {/* Asset Selection */}
                    <Autocomplete
                        value={selectedAsset}
                        onChange={(_, newValue) => setSelectedAsset(newValue)}
                        options={assetOptions}
                        getOptionLabel={(option) => `${option.name} (${option.symbol})`}
                        renderOption={(props, option) => (
                            <Box component="li" {...props}>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="body2" fontWeight={600}>{option.symbol}</Typography>
                                        <Typography variant="caption" color="text.secondary">{option.name}</Typography>
                                    </Box>
                                </Stack>
                            </Box>
                        )}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label={`Search ${assetType === 'crypto' ? 'Cryptocurrency' : 'Stock'}`}
                                placeholder="Type to search..."
                            />
                        )}
                        loading={assetType === 'crypto' ? !cryptoData : !stockData}
                    />

                    {/* Quantity Input */}
                    <TextField
                        label="Quantity"
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        fullWidth
                        InputProps={{
                            inputProps: { min: 0, step: assetType === 'crypto' ? '0.00000001' : '1' },
                        }}
                        helperText={
                            tradeType === 'sell' && selectedAsset
                                ? `Available: ${availableQuantity} ${selectedAsset.symbol}`
                                : ''
                        }
                    />

                    {/* Price Display */}
                    {selectedAsset && (
                        <Box
                            sx={{
                                p: 2,
                                borderRadius: 2,
                                bgcolor: 'action.hover',
                                border: '1px solid',
                                borderColor: 'divider',
                            }}
                        >
                            <Stack spacing={1}>
                                <Stack direction="row" justifyContent="space-between">
                                    <Typography variant="body2" color="text.secondary">Current Price</Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        ₹{(currentPrice || 0).toLocaleString()}
                                    </Typography>
                                </Stack>
                                <Stack direction="row" justifyContent="space-between">
                                    <Typography variant="body2" color="text.secondary">Quantity</Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {quantity || 0}
                                    </Typography>
                                </Stack>
                                <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1, mt: 1 }}>
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography variant="body1" fontWeight={700}>Total</Typography>
                                        <Typography variant="body1" fontWeight={700} color="primary.main">
                                            ₹{total.toLocaleString()}
                                        </Typography>
                                    </Stack>
                                </Box>
                            </Stack>
                        </Box>
                    )}

                    {/* Balance Display */}
                    <Box
                        sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                        }}
                    >
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2">Available Balance</Typography>
                            <Typography variant="h6" fontWeight={700}>
                                ₹{balance.toLocaleString()}
                            </Typography>
                        </Stack>
                    </Box>

                    {/* Validation Message */}
                    {validationMessage && (
                        <Alert severity="error">{validationMessage}</Alert>
                    )}

                    {/* Error Message */}
                    {error && (
                        <Alert severity="error" onClose={() => setError('')}>
                            {error}
                        </Alert>
                    )}
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button onClick={handleClose}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={handleTrade}
                    disabled={!canTrade || tradeMutation.isPending}
                    color={tradeType === 'buy' ? 'success' : 'error'}
                    startIcon={tradeMutation.isPending ? <CircularProgress size={20} /> : null}
                >
                    {tradeMutation.isPending
                        ? 'Processing...'
                        : `${tradeType === 'buy' ? 'Buy' : 'Sell'} ${selectedAsset?.symbol || 'Asset'}`}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
