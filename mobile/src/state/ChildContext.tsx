/**
 * The one shared state in the app (CLAUDE.md, "One active child").
 *
 * activeChild changes only through setActiveChild. Every screen that depends on the child reads it from
 * here, so React re-renders Track, the call sheet, Schedule, History and the share sheet together:
 * the prototype had to list those re-renders by hand inside setActiveChild.
 *
 * The other state here is shared between screens and mostly per child:
 * - call preferences (call sheet and the exam-day "Running late?" button), remembered per child;
 * - simulated signal loss (Track, mini-map, call sheet), per child;
 * - which notifications are unread (bell badge and the Notifications screen), and the notification preferences.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { defaultCallPrefs } from '@/data/calls';
import { notificationPrefs, notifications as notificationData } from '@/data/notifications';
import { CHILD_KEYS, type CallPrefs, type ChildKey, type ContactId } from '@/data/types';
import { SIGNAL_TICK_MS } from '@/lib/demo';

export type Signal = { lost: boolean; lostMinutes: number };

type ChildState = {
  activeChild: ChildKey;
  setActiveChild: (key: ChildKey) => void;

  callPrefs: CallPrefs;
  toggleCallPref: (id: ContactId) => void;

  signal: Signal;
  /** Every child's signal, for views that show all linked children at once. */
  signals: Record<ChildKey, Signal>;
  toggleSignalDemo: () => void;

  unread: ReadonlySet<number>;
  markRead: (id: number) => void;
  markAllRead: () => void;

  notifPrefs: Record<NotifPrefId, boolean>;
  toggleNotifPref: (id: NotifPrefId) => void;
};

export type NotifPrefId = (typeof notificationPrefs)[number]['id'];

const Ctx = createContext<ChildState | null>(null);

const allPerChild = <T,>(make: (key: ChildKey) => T) =>
  Object.fromEntries(CHILD_KEYS.map((k) => [k, make(k)])) as Record<ChildKey, T>;

type Props = {
  children: ReactNode;
  /** For tests and previews: start somewhere other than the prototype's defaults. */
  initial?: {
    activeChild?: ChildKey;
    signal?: Partial<Record<ChildKey, Signal>>;
    callPrefs?: Partial<Record<ChildKey, CallPrefs>>;
  };
};

export function ChildProvider({ children, initial }: Props) {
  const [activeChild, setActive] = useState<ChildKey>(initial?.activeChild ?? 'jane');
  const [prefs, setPrefs] = useState(() => allPerChild((k) => ({ ...defaultCallPrefs[k], ...initial?.callPrefs?.[k] })));
  const [signals, setSignals] = useState(() =>
    allPerChild((k) => initial?.signal?.[k] ?? { lost: false, lostMinutes: 0 }),
  );
  const [unread, setUnread] = useState<ReadonlySet<number>>(
    () => new Set(notificationData.filter((n) => n.unread).map((n) => n.id)),
  );

  const [notifPrefs, setNotifPrefs] = useState(
    () => Object.fromEntries(notificationPrefs.map((p) => [p.id, p.on])) as Record<NotifPrefId, boolean>,
  );
  const toggleNotifPref = useCallback((id: NotifPrefId) => setNotifPrefs((p) => ({ ...p, [id]: !p[id] })), []);

  const setActiveChild = useCallback((key: ChildKey) => setActive(key), []);

  const toggleCallPref = useCallback(
    (id: ContactId) => setPrefs((p) => ({ ...p, [activeChild]: { ...p[activeChild], [id]: !p[activeChild][id] } })),
    [activeChild],
  );

  // Signal-loss demo: one simulated minute per tick, per child, until the signal is restored.
  const timers = useRef<Partial<Record<ChildKey, ReturnType<typeof setInterval>>>>({});
  const toggleSignalDemo = useCallback(() => {
    const key = activeChild;
    clearInterval(timers.current[key]);
    delete timers.current[key];
    const restore = signals[key].lost;
    if (!restore) {
      timers.current[key] = setInterval(
        () => setSignals((cur) => ({ ...cur, [key]: { ...cur[key], lostMinutes: cur[key].lostMinutes + 1 } })),
        SIGNAL_TICK_MS,
      );
    }
    setSignals((s) => ({ ...s, [key]: { lost: !restore, lostMinutes: 0 } }));
  }, [activeChild, signals]);
  useEffect(() => {
    const running = timers.current;
    return () => Object.values(running).forEach((t) => clearInterval(t));
  }, []);

  const markRead = useCallback(
    (id: number) =>
      setUnread((u) => {
        if (!u.has(id)) return u;
        const next = new Set(u);
        next.delete(id);
        return next;
      }),
    [],
  );
  const markAllRead = useCallback(() => setUnread(new Set()), []);

  const value = useMemo<ChildState>(
    () => ({
      activeChild,
      setActiveChild,
      callPrefs: prefs[activeChild],
      toggleCallPref,
      signal: signals[activeChild],
      signals,
      toggleSignalDemo,
      unread,
      markRead,
      markAllRead,
      notifPrefs,
      toggleNotifPref,
    }),
    [activeChild, setActiveChild, prefs, toggleCallPref, signals, toggleSignalDemo, unread, markRead, markAllRead, notifPrefs, toggleNotifPref],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useChild(): ChildState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useChild must be used inside <ChildProvider>');
  return v;
}
