// Whether the start-up animation has finished. Pages wait for it before their entrance, so the first screen's
// blocks rise in as the intro hands off instead of animating unseen underneath it.
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type Intro = { introDone: boolean; finishIntro: () => void };

const Ctx = createContext<Intro>({ introDone: true, finishIntro: () => {} });

export function IntroProvider({ children }: { children: ReactNode }) {
  const [introDone, setDone] = useState(false);
  const value = useMemo(() => ({ introDone, finishIntro: () => setDone(true) }), [introDone]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Outside an IntroProvider (tests, previews) the intro counts as done. */
export const useIntro = () => useContext(Ctx);
