import { Box } from '@mui/material';
import { ReactNode } from 'react';

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        animation: 'fadeIn 0.4s ease-in',
        '@keyframes fadeIn': {
          from: {
            opacity: 0,
            transform: 'translateY(20px)',
          },
          to: {
            opacity: 1,
            transform: 'translateY(0)',
          },
        },
      }}
    >
      {children}
    </Box>
  );
}
