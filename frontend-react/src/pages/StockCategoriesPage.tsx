import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  LinearProgress,
  Box,
  Chip,
  Stack,
  Avatar,
  TextField,
  InputAdornment,
  Paper
} from '@mui/material';
import { Category as CategoryIcon, Search, TrendingUp } from '@mui/icons-material';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getStockSymbols, getBatchQuotes } from '../stockApi';
import { Stock, StockQuote } from '../stockTypes';
import { formatCurrency, convert } from '../utils';
import { usePortfolio } from '../state/PortfolioContext';

interface StockCategory {
  name: string;
  stocks: Stock[];
  totalMarketCap: number;
  avgChange: number;
}

export default function StockCategoriesPage() {
  const [search, setSearch] = useState('');
  const { currency, fxRates } = usePortfolio();

  const { data: symbols = [], isLoading } = useQuery({
    queryKey: ['stockSymbols'],
    queryFn: () => getStockSymbols('US'),
    staleTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Categorize stocks by sector/industry
  const categories = useMemo(() => {
    const cats: Record<string, Stock[]> = {
      'Technology': [],
      'Finance': [],
      'Healthcare': [],
      'Consumer': [],
      'Energy': [],
      'Industrial': [],
      'Real Estate': [],
      'Other': [],
    };

    symbols.forEach((stock: Stock) => {
      const desc = stock.description?.toLowerCase() || '';
      const type = stock.type?.toLowerCase() || '';
      
      if (desc.includes('tech') || desc.includes('software') || desc.includes('computer') || desc.includes('semiconductor') || desc.includes('data')) {
        cats['Technology'].push(stock);
      } else if (desc.includes('bank') || desc.includes('financial') || desc.includes('insurance') || desc.includes('capital') || desc.includes('credit')) {
        cats['Finance'].push(stock);
      } else if (desc.includes('health') || desc.includes('pharma') || desc.includes('bio') || desc.includes('medical') || desc.includes('drug')) {
        cats['Healthcare'].push(stock);
      } else if (desc.includes('retail') || desc.includes('consumer') || desc.includes('food') || desc.includes('beverage') || desc.includes('restaurant')) {
        cats['Consumer'].push(stock);
      } else if (desc.includes('energy') || desc.includes('oil') || desc.includes('gas') || desc.includes('petroleum')) {
        cats['Energy'].push(stock);
      } else if (desc.includes('industrial') || desc.includes('manufacturing') || desc.includes('machinery') || desc.includes('transport')) {
        cats['Industrial'].push(stock);
      } else if (desc.includes('real estate') || desc.includes('property') || desc.includes('reit')) {
        cats['Real Estate'].push(stock);
      } else if (type !== 'etp') { // Exclude ETPs from "Other"
        cats['Other'].push(stock);
      }
    });

    return Object.entries(cats)
      .filter(([_, stocks]) => stocks.length > 0)
      .map(([name, stocks]) => ({
        name,
        stocks,
        totalMarketCap: 0,
        avgChange: 0,
        count: stocks.length,
      }))
      .sort((a, b) => b.count - a.count);
  }, [symbols]);

  // Get quotes for top stocks in each category
  const topStocks = useMemo(() => {
    const tops: string[] = [];
    categories.forEach(cat => {
      tops.push(...cat.stocks.slice(0, 5).map((s: Stock) => s.symbol));
    });
    return tops.slice(0, 50); // Limit to 50 to avoid too many requests
  }, [categories]);

  const { data: quotes = {} } = useQuery({
    queryKey: ['stockCategoryQuotes', topStocks],
    queryFn: () => getBatchQuotes(topStocks),
    enabled: topStocks.length > 0,
    staleTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Calculate category stats
  const categoriesWithStats = useMemo(() => {
    return categories.map(cat => {
      let totalChange = 0;
      let count = 0;
      
      cat.stocks.slice(0, 5).forEach((stock: Stock) => {
        const quote = quotes[stock.symbol];
        if (quote) {
          totalChange += quote.dp || 0;
          count++;
        }
      });

      return {
        ...cat,
        avgChange: count > 0 ? totalChange / count : 0,
      };
    });
  }, [categories, quotes]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query
      ? categoriesWithStats.filter((c) => c?.name?.toLowerCase().includes(query))
      : categoriesWithStats;
  }, [categoriesWithStats, search]);

  return (
    <Box>
      <Box
        sx={{
          mb: 4,
          p: 4,
          borderRadius: 3,
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? 'linear-gradient(145deg, rgba(18, 18, 26, 0.95) 0%, rgba(30, 30, 45, 0.95) 50%, rgba(139, 92, 246, 0.1) 100%)'
              : 'linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 50%, rgba(139, 92, 246, 0.05) 100%)',
          border: (theme) => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(109, 40, 217, 0.1)'}`,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #8b5cf6 0%, #06b6d4 50%, #f472b6 100%)',
          },
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2.5} mb={2}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(139, 92, 246, 0.4)',
            }}
          >
            <CategoryIcon sx={{ fontSize: 36, color: 'white' }} />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Stock Market Sectors
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Explore market sectors by industry, companies, and performance
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Stack direction="row" spacing={2} mb={3} alignItems="center">
        <TextField
          placeholder="Search sectors..."
          size="small"
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Stack>

      {isLoading && <LinearProgress />}
      
      <Stack spacing={2}>
        {filtered.map((category, index) => (
          <CategoryCard key={category.name} category={category} index={index} quotes={quotes} currency={currency} fxRates={fxRates} />
        ))}
      </Stack>

      {!isLoading && !filtered.length && (
        <Paper
          elevation={0}
          sx={{
            textAlign: 'center',
            py: 8,
            px: 2,
            background: (theme) =>
              theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(51, 65, 85, 0.5) 100%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.8) 100%)',
          }}
        >
          <CategoryIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No sectors found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search
          </Typography>
        </Paper>
      )}
    </Box>
  );
}

function CategoryCard({ 
  category, 
  index, 
  quotes,
  currency,
  fxRates
}: { 
  category: StockCategory & { count: number }; 
  index: number;
  quotes: Record<string, StockQuote>;
  currency: string;
  fxRates: Record<string, number>;
}) {
  const colors = ['#8b5cf6', '#06b6d4', '#f472b6', '#22c55e', '#f59e0b', '#3b82f6', '#f43f5e'];
  const color = colors[index % colors.length];
  const isPositive = category.avgChange >= 0;

  return (
    <Card
      sx={{
        borderRadius: 2,
        transition: 'all 0.2s',
        border: (theme) => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
        '&:hover': {
          boxShadow: 4,
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar
              sx={{
                width: 50,
                height: 50,
                bgcolor: `${color}20`,
                color: color,
                fontWeight: 700,
              }}
            >
              {category.name.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                {category.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {category.count} stocks
              </Typography>
            </Box>
          </Stack>
          <Stack alignItems="flex-end" spacing={0.5}>
            <Chip
              icon={isPositive ? <TrendingUp /> : <TrendingUp sx={{ transform: 'rotate(180deg)' }} />}
              label={`${isPositive ? '+' : ''}${category.avgChange.toFixed(2)}%`}
              color={isPositive ? 'success' : 'error'}
              size="small"
              sx={{ fontWeight: 600 }}
            />
            <Typography variant="caption" color="text.secondary">
              Avg Change
            </Typography>
          </Stack>
        </Stack>

        {category.stocks.length > 0 && (
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mb: 1 }}>
              Top Stocks:
            </Typography>
            <Stack spacing={1}>
              {category.stocks.slice(0, 5).map((stock: Stock) => {
                const quote = quotes[stock.symbol];
                const change = quote?.dp || 0;
                const price = quote?.c || 0;
                const priceConverted = convert(price, 'USD', currency, fxRates) || 0;
                
                return (
                  <Stack 
                    key={stock.symbol} 
                    direction="row" 
                    justifyContent="space-between" 
                    alignItems="center"
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                      '&:hover': {
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                      },
                    }}
                  >
                    <Stack>
                      <Typography variant="body2" fontWeight={600}>
                        {stock.symbol}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                        {stock.description}
                      </Typography>
                    </Stack>
                    {quote ? (
                      <Stack alignItems="flex-end">
                        <Typography variant="body2" fontWeight={600}>
                          {formatCurrency(priceConverted, currency, {})}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          fontWeight={600}
                          color={change >= 0 ? 'success.main' : 'error.main'}
                        >
                          {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                        </Typography>
                      </Stack>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        Loading...
                      </Typography>
                    )}
                  </Stack>
                );
              })}
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
