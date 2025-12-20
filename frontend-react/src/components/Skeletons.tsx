import { Box, Card, CardContent, Skeleton, Stack, Grid } from '@mui/material';

export function CoinCardSkeleton() {
  return (
    <Card>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Skeleton variant="circular" width={40} height={40} />
            <Box>
              <Skeleton variant="text" width={60} height={24} />
              <Skeleton variant="text" width={100} height={16} />
            </Box>
          </Box>
          <Skeleton variant="rounded" width={80} height={24} />
        </Stack>
        <Skeleton variant="text" width={120} height={32} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" width="100%" height={30} sx={{ mb: 2, borderRadius: 1 }} />
        <Stack direction="row" spacing={1}>
          <Skeleton variant="rounded" width={80} height={24} />
          <Skeleton variant="rounded" width={80} height={24} />
        </Stack>
      </CardContent>
    </Card>
  );
}

export function DashboardSkeleton() {
  return (
    <Box>
      <Card sx={{ mb: 3, p: 3 }}>
        <Skeleton variant="text" width={300} height={40} sx={{ mb: 1 }} />
        <Skeleton variant="text" width={500} height={20} sx={{ mb: 3 }} />
        <Grid container spacing={2}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} sm={4} key={i}>
              <Skeleton variant="rounded" width="100%" height={80} />
            </Grid>
          ))}
        </Grid>
      </Card>
      <Grid container spacing={3}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Grid item xs={12} sm={6} lg={4} key={i}>
            <CoinCardSkeleton />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Box>
      {Array.from({ length: rows }).map((_, i) => (
        <Stack
          key={i}
          direction="row"
          spacing={2}
          alignItems="center"
          sx={{ py: 2, borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <Skeleton variant="circular" width={36} height={36} />
          <Skeleton variant="text" width="30%" height={20} />
          <Skeleton variant="text" width="15%" height={20} sx={{ ml: 'auto' }} />
          <Skeleton variant="text" width="15%" height={20} />
          <Skeleton variant="text" width="15%" height={20} />
        </Stack>
      ))}
    </Box>
  );
}
