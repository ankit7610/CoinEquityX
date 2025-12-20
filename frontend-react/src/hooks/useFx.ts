import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getFx } from '../api';
import { usePortfolio } from '../state/PortfolioContext';

export function useFx() {
  const { fxRates, setFxRates } = usePortfolio();
  const fxQuery = useQuery({
    queryKey: ['fx'],
    queryFn: getFx,
    staleTime: 60 * 60 * 1000
  });

  useEffect(() => {
    if (fxQuery.data?.data) {
      setFxRates(fxQuery.data.data);
    }
  }, [fxQuery.data, setFxRates]);

  return fxRates;
}
