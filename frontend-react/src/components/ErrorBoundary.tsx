import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button } from '@mui/material';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
            textAlign: 'center'
          }}
        >
          <Typography variant="h4" gutterBottom color="error">
            Something went wrong
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600 }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </Typography>
          <Button
            variant="contained"
            onClick={() => window.location.reload()}
            sx={{ bgcolor: '#00D09C', '&:hover': { bgcolor: '#00B881' } }}
          >
            Reload Page
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}
