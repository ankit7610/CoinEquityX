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
  InputAdornment
} from '@mui/material';
import { Category as CategoryIcon, Search, TrendingUp } from '@mui/icons-material';
import { useState, useMemo } from 'react';
import { Category } from '../types';
import { formatNumberFromUsd, formatChange } from '../utils';

export default function CategoriesPage({
  categories,
  isLoading,
  currency,
  fxRates
}: {
  categories: Category[];
  isLoading: boolean;
  currency: string;
  fxRates: Record<string, number>;
}) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query
      ? categories.filter((c) => c?.name?.toLowerCase().includes(query))
      : categories;
  }, [categories, search]);

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
              Cryptocurrency Categories
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Explore market categories by tokens, market cap, and volume
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Stack direction="row" spacing={2} mb={3} alignItems="center">
        <TextField
          placeholder="Search categories..."
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
          sx={{ maxWidth: 400 }}
        />
        <Chip
          icon={<CategoryIcon />}
          label={`${filtered.length} Categories`}
          color="primary"
          variant="outlined"
        />
      </Stack>

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
        {isLoading && <LinearProgress sx={{ borderRadius: '12px 12px 0 0' }} />}
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table sx={{ 
              '& .MuiTableHead-root': {
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(139, 92, 246, 0.08)' : 'rgba(109, 40, 217, 0.04)',
              }
            }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Category</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
                    Tokens
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
                    Market Cap
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
                    Volume (24h)
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
                    Change (24h)
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((cat, index) => {
                  const change = (cat as any).market_cap_change_24h ?? (cat as any).volume_change_24h ?? 0;
                  return (
                    <TableRow
                      key={cat.id}
                      hover
                      sx={{
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: (theme) =>
                            theme.palette.mode === 'dark' ? 'rgba(139, 92, 246, 0.12)' : 'rgba(109, 40, 217, 0.06)',
                          transform: 'scale(1.005)',
                        },
                      }}
                    >
                      <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar
                            sx={{
                              width: 40,
                              height: 40,
                              fontSize: '0.9rem',
                              fontWeight: 700,
                              background: `linear-gradient(135deg, ${getGradientColors(index)})`,
                              boxShadow: `0 4px 12px ${getGradientColors(index).split(',')[0]}40`,
                            }}
                          >
                            {cat.name.slice(0, 2).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body1" fontWeight={600}>
                              {cat.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {cat.title || ''}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={cat.num_tokens ?? '—'}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ fontWeight: 600, minWidth: 50 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600}>
                          {formatNumberFromUsd(cat.market_cap, currency, fxRates)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="text.secondary">
                          {formatNumberFromUsd(cat.volume_24h, currency, fxRates)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          icon={change >= 0 ? <TrendingUp fontSize="small" /> : undefined}
                          label={formatChange(change)}
                          size="small"
                          color={change >= 0 ? 'success' : 'error'}
                          sx={{ fontWeight: 600, minWidth: 80 }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                      <CategoryIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No categories found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Try adjusting your search
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

function getGradientColors(index: number): string {
  const gradients = [
    '#6366f1 0%, #8b5cf6 100%',
    '#ec4899 0%, #f43f5e 100%',
    '#f59e0b 0%, #f97316 100%',
    '#10b981 0%, #14b8a6 100%',
    '#3b82f6 0%, #2563eb 100%',
    '#8b5cf6 0%, #a855f7 100%',
  ];
  return gradients[index % gradients.length];
}
