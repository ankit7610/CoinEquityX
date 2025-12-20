import { Box, Stack, Typography } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

interface TickerItem {
  name: string;
  value: string;
  change: string;
  isPositive: boolean;
}

const mockData: TickerItem[] = [
  { name: 'NIFTY', value: '26,046.95', change: '+148.40 (0.57%)', isPositive: true },
  { name: 'SENSEX', value: '85,267.66', change: '+449.53 (0.53%)', isPositive: true },
  { name: 'BANKNIFTY', value: '59,389.95', change: '+180.10 (0.30%)', isPositive: true },
  { name: 'MIDCPNIFTY', value: '13,908.25', change: '+180.20 (1.31%)', isPositive: true },
  { name: 'FINNIFTY', value: '27,672.60', change: '-24.50 (0.09%)', isPositive: false },
];

export function TickerBanner() {
  return (
    <Box
      sx={{
        bgcolor: (theme) => theme.palette.mode === 'dark' ? '#1a1f26' : '#FAFAFA',
        borderBottom: (theme) => theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #EBEBEB',
        py: 1,
        overflow: 'hidden',
      }}
    >
      <Stack 
        direction="row" 
        spacing={4} 
        sx={{ 
          px: 2,
          overflowX: 'auto',
          '&::-webkit-scrollbar': { display: 'none' },
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}
      >
        {mockData.map((item, index) => (
          <Stack 
            key={index} 
            direction="row" 
            spacing={1} 
            alignItems="center"
            sx={{ minWidth: 'fit-content' }}
          >
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 500, 
                fontSize: '0.8125rem',
                color: (theme) => theme.palette.mode === 'dark' ? '#ECEFF1' : '#44475B',
              }}
            >
              {item.name}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 500, 
                fontSize: '0.8125rem',
                color: (theme) => theme.palette.mode === 'dark' ? '#ECEFF1' : '#44475B',
              }}
            >
              {item.value}
            </Typography>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              {item.isPositive ? (
                <TrendingUp sx={{ fontSize: '0.9rem', color: '#00B386' }} />
              ) : (
                <TrendingDown sx={{ fontSize: '0.9rem', color: '#EB5B3C' }} />
              )}
              <Typography 
                variant="caption" 
                sx={{ 
                  fontSize: '0.75rem',
                  color: item.isPositive ? '#00B386' : '#EB5B3C',
                  fontWeight: 400,
                }}
              >
                {item.change}
              </Typography>
            </Stack>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}
