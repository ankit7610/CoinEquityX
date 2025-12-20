import { 
  Card, 
  CardContent, 
  Typography, 
  Stack, 
  Chip, 
  LinearProgress, 
  Grid, 
  Box,
  CardMedia,
  Paper
} from '@mui/material';
import { Article, AccessTime, TrendingUp } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { getStockNews } from '../stockApi';
import { StockNews as StockNewsItem } from '../stockTypes';

export default function StockNewsPage() {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['stockNews'],
    queryFn: getStockNews,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return (
    <Box>
      <Paper
        elevation={0}
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
            background: 'linear-gradient(90deg, #f472b6 0%, #8b5cf6 50%, #06b6d4 100%)',
          },
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2.5} mb={1}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #f472b6 0%, #8b5cf6 50%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(139, 92, 246, 0.4)',
            }}
          >
            <Article sx={{ fontSize: 36, color: 'white' }} />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Latest Stock Market News
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Stay updated with real-time stock market news and insights
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {isLoading && <LinearProgress sx={{ mb: 3, borderRadius: 2 }} />}
      <Grid container spacing={3}>
        {items.map((item: StockNewsItem, idx: number) => (
          <Grid item key={item.id || idx} xs={12} sm={6} lg={4}>
            <NewsCard item={item} />
          </Grid>
        ))}
      </Grid>
      {!isLoading && !items.length && (
        <Paper
          elevation={0}
          sx={{
            textAlign: 'center',
            py: 10,
            px: 2,
            background: (theme) =>
              theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(51, 65, 85, 0.5) 100%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.8) 100%)',
          }}
        >
          <Article sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No news available
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please check back later for updates
          </Typography>
        </Paper>
      )}
    </Box>
  );
}

function NewsCard({ item }: { item: StockNewsItem }) {
  const timeAgo = (timestamp: number) => {
    const seconds = Math.floor(Date.now() / 1000 - timestamp);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <Card
      component="a"
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        textDecoration: 'none',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 3,
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: (theme) =>
            theme.palette.mode === 'dark'
              ? '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(139, 92, 246, 0.3)'
              : '0 20px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(139, 92, 246, 0.2)',
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #8b5cf6 0%, #06b6d4 100%)',
          opacity: 0,
          transition: 'opacity 0.3s',
        },
        '&:hover::before': {
          opacity: 1,
        },
      }}
    >
      {item.image && (
        <CardMedia
          component="img"
          height="200"
          image={item.image}
          alt={item.headline}
          sx={{
            objectFit: 'cover',
            background: (theme) =>
              theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(51, 65, 85, 0.5) 100%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.8) 100%)',
          }}
          onError={(e: any) => {
            e.target.style.display = 'none';
          }}
        />
      )}
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{
            fontSize: '1rem',
            fontWeight: 700,
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            mb: 1.5,
          }}
        >
          {item.headline}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            flexGrow: 1,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.6,
          }}
        >
          {item.summary}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center" mt="auto">
          <AccessTime sx={{ fontSize: '0.875rem', color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary" fontWeight={500}>
            {timeAgo(item.datetime)}
          </Typography>
          <Chip
            label={item.source}
            size="small"
            sx={{
              ml: 'auto',
              height: 24,
              fontSize: '0.7rem',
              fontWeight: 600,
              background: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(139, 92, 246, 0.2)'
                  : 'rgba(139, 92, 246, 0.1)',
              color: (theme) =>
                theme.palette.mode === 'dark' ? '#c4b5fd' : '#7c3aed',
              border: 'none',
            }}
          />
        </Stack>
        {item.related && (
          <Stack direction="row" spacing={0.5} mt={1.5} flexWrap="wrap" useFlexGap>
            <Chip
              label={item.related}
              size="small"
              variant="outlined"
              sx={{
                height: 22,
                fontSize: '0.65rem',
                fontWeight: 600,
                borderColor: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.1)',
              }}
            />
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
