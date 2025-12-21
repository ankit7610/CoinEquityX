import { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { PortfolioEntry, CurrencyCode } from '../types';
import { getPortfolio, savePortfolio } from '../api';
import { useAuth } from '../context/AuthContext';

type PortfolioContextValue = {
  entries: PortfolioEntry[];
  currency: CurrencyCode;
  fxRates: Record<string, number>;
  setCurrency: (c: CurrencyCode) => void;
  setFxRates: (fx: Record<string, number>) => void;
  upsertEntry: (entry: PortfolioEntry) => Promise<void>;
  removeEntry: (id: string | number) => Promise<void>;
  refresh: () => Promise<void>;
};

const PortfolioContext = createContext<PortfolioContextValue | undefined>(undefined);

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [entries, setEntries] = useState<PortfolioEntry[]>([]);
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    const saved = localStorage.getItem('currency');
    return (saved as CurrencyCode) || 'INR';
  });
  const [fxRates, setFxRates] = useState<Record<string, number>>({ USD: 1 });

  useEffect(() => {
    if (loading) return;
    refresh();
  }, [user, loading]);

  useEffect(() => {
    localStorage.setItem('currency', currency);
  }, [currency]);

  const setCurrency = (c: CurrencyCode) => setCurrencyState(c);

  const refresh = async () => {
    const res = await getPortfolio(user?.uid);
    if (res.data) setEntries(res.data);
  };

  const upsertEntry = async (entry: PortfolioEntry) => {
    const merged = (() => {
      const existing = entries.find((e) => String(e.id) === String(entry.id));
      if (existing) {
        return entries.map((e) => (String(e.id) === String(entry.id) ? { ...e, ...entry } : e));
      }
      return [...entries, entry];
    })();
    setEntries(merged);
    await savePortfolio(merged, user?.uid);
  };

  const removeEntry = async (id: string | number) => {
    const filtered = entries.filter((e) => String(e.id) !== String(id));
    setEntries(filtered);
    await savePortfolio(filtered, user?.uid);
  };

  const value = useMemo(
    () => ({ entries, currency, fxRates, setCurrency, setFxRates, upsertEntry, removeEntry, refresh }),
    [entries, currency, fxRates]
  );

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}

export function usePortfolio() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error('usePortfolio must be used within PortfolioProvider');
  return ctx;
}
