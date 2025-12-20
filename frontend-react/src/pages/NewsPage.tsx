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
import { NewsItem } from '../types';

export default function NewsPage({ items, isLoading }: { items: NewsItem[]; isLoading: boolean }) {
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
              Latest Crypto News
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Stay updated with real-time cryptocurrency market news and insights
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {isLoading && <LinearProgress sx={{ mb: 3, borderRadius: 2 }} />}
      <Grid container spacing={3}>
        {items.map((item, idx) => (
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

function NewsCard({ item }: { item: NewsItem }) {
  const timeAgo = getTimeAgo(item.published_at || item.published);
  const hasImage = item.image_url || (item as any).image;
  const imageUrl = hasImage ? (item.image_url || (item as any).image) : null;
  
  return (
    <Card
      component="a"
      href={item.url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        textDecoration: 'none',
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'linear-gradient(145deg, rgba(18, 18, 26, 0.95) 0%, rgba(30, 30, 45, 0.95) 100%)'
            : 'linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)',
        border: (theme) => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(109, 40, 217, 0.08)'}`,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, #f472b6 0%, #8b5cf6 100%)',
        },
        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow: (theme) => theme.palette.mode === 'dark'
            ? '0 20px 40px -10px rgba(139, 92, 246, 0.3)'
            : '0 20px 40px -10px rgba(109, 40, 217, 0.2)',
        },
      }}
    >
      {imageUrl && (
        <CardMedia
          component="img"
          height="180"
          image={imageUrl}
          alt={item.title || 'News image'}
          sx={{
            objectFit: 'cover',
            bgcolor: 'action.hover',
          }}
          onError={(e: any) => {
            e.target.style.display = 'none';
          }}
        />
      )}
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
          {item.source ? (
            <Chip
              label={item.source}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          ) : null}
          {timeAgo && (
            <Chip
              icon={<AccessTime sx={{ fontSize: 14 }} />}
              label={timeAgo}
              size="small"
              variant="outlined"
            />
          )}
        </Stack>

        <Typography
          variant="h6"
          fontWeight={700}
          gutterBottom
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            mb: 1,
          }}
        >
          {item.title || 'Untitled'}
        </Typography>

        {item.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              mb: 2,
              flexGrow: 1,
            }}
          >
            {item.description}
          </Typography>
        )}

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mt="auto">
          {(item as any).entities?.slice(0, 3).map((entity: any, i: number) => (
            <Chip
              key={i}
              label={entity.symbol || entity.name || entity}
              size="small"
              sx={{
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(79, 70, 229, 0.1)',
                color: 'primary.main',
                fontWeight: 600,
              }}
            />
          ))}
          {(item as any).sentiment && (
            <Chip
              icon={<TrendingUp sx={{ fontSize: 14 }} />}
              label={(item as any).sentiment}
              size="small"
              color={(item as any).sentiment === 'positive' ? 'success' : (item as any).sentiment === 'negative' ? 'error' : 'default'}
            />
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

function getTimeAgo(dateString?: string): string | null {
  if (!dateString) return null;
  
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}
