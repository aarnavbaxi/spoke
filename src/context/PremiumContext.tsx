import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';

interface PremiumContextType {
  isPremium: boolean;
  showPaywall: (feature: string, onUpgrade?: () => void) => void;
}

const PremiumContext = createContext<PremiumContextType | null>(null);

// Stub: In production, wire this up to RevenueCat
export function PremiumProvider({
  children,
  onShowPaywall,
}: {
  children: React.ReactNode;
  onShowPaywall: (feature: string, onUpgrade?: () => void) => void;
}) {
  const { user } = useAuth();
  const isPremium = user?.subscription_tier === 'premium';

  function showPaywall(feature: string, onUpgrade?: () => void) {
    onShowPaywall(feature, onUpgrade);
  }

  return (
    <PremiumContext.Provider value={{ isPremium, showPaywall }}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  const context = useContext(PremiumContext);
  if (!context) throw new Error('usePremium must be used within PremiumProvider');
  return context;
}
