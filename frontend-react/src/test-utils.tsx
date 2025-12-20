import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PortfolioProvider } from './state/PortfolioContext';

const queryClient = new QueryClient();

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <PortfolioProvider>{children}</PortfolioProvider>
    </QueryClientProvider>
  );
}
