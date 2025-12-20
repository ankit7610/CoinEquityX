import { createContext, useContext, useState, ReactNode } from 'react';

type MarketMode = 'crypto' | 'stock';

interface MarketModeContextType {
  mode: MarketMode;
  setMode: (mode: MarketMode) => void;
  toggleMode: () => void;
}

const MarketModeContext = createContext<MarketModeContextType | undefined>(undefined);

export function MarketModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<MarketMode>(() => {
    const saved = localStorage.getItem('marketMode');
    return (saved as MarketMode) || 'crypto';
  });

  const handleSetMode = (newMode: MarketMode) => {
    setMode(newMode);
    localStorage.setItem('marketMode', newMode);
  };

  const toggleMode = () => {
    const newMode = mode === 'crypto' ? 'stock' : 'crypto';
    handleSetMode(newMode);
  };

  return (
    <MarketModeContext.Provider value={{ mode, setMode: handleSetMode, toggleMode }}>
      {children}
    </MarketModeContext.Provider>
  );
}

export function useMarketMode() {
  const context = useContext(MarketModeContext);
  if (!context) {
    throw new Error('useMarketMode must be used within MarketModeProvider');
  }
  return context;
}
