/**
 * Whether the parent has finished onboarding, and the number they're verifying. In memory only, like the
 * prototype: every launch starts at the welcome screen ("Skip onboarding (demo control)" jumps past it).
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type Onboarding = { onboarded: boolean; finish: () => void; phone: string; setPhone: (p: string) => void };

const Ctx = createContext<Onboarding | null>(null);

export function OnboardingProvider({ children, initial = false }: { children: ReactNode; initial?: boolean }) {
  const [onboarded, setOnboarded] = useState(initial);
  const [phone, setPhone] = useState('');
  const value = useMemo(() => ({ onboarded, finish: () => setOnboarded(true), phone, setPhone }), [onboarded, phone]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOnboarding(): Onboarding {
  const v = useContext(Ctx);
  if (!v) throw new Error('useOnboarding must be used inside <OnboardingProvider>');
  return v;
}
