/**
 * UI state of the app shell only: the toast, whether content has scrolled under the header, whether the FAB is
 * open, and which bottom sheet is showing. It holds no child data; everything about the child lives in
 * ChildContext.
 */
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo } from 'react-native';

type Shell = {
  /** The last message shown; it stays set while the toast fades out. */
  toast: string | null;
  toastVisible: boolean;
  showToast: (message: string) => void;
  scrolled: boolean;
  setScrolled: (v: boolean) => void;
  fabOpen: boolean;
  setFabOpen: (v: boolean) => void;
  sheet: SheetName | null;
  /** Opens a sheet and closes the FAB, like openSheet in the prototype. */
  openSheet: (name: SheetName) => void;
  closeSheet: () => void;
};

export type SheetName = 'call' | 'share' | 'photo' | 'friend';

const Ctx = createContext<Shell | null>(null);

const TOAST_MS = 2200;

export function ShellProvider({ children, initialSheet = null }: { children: ReactNode; initialSheet?: SheetName | null }) {
  const [toast, setToast] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [sheet, setSheet] = useState<SheetName | null>(initialSheet);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showToast = useCallback((message: string) => {
    clearTimeout(timer.current);
    setToast(message);
    setToastVisible(true);
    // The prototype's toast is role="status"; here it is announced to screen readers.
    AccessibilityInfo.announceForAccessibility(message);
    timer.current = setTimeout(() => setToastVisible(false), TOAST_MS);
  }, []);

  const openSheet = useCallback((name: SheetName) => {
    setFabOpen(false);
    setSheet(name);
  }, []);
  const closeSheet = useCallback(() => setSheet(null), []);

  const value = useMemo(
    () => ({ toast, toastVisible, showToast, scrolled, setScrolled, fabOpen, setFabOpen, sheet, openSheet, closeSheet }),
    [toast, toastVisible, showToast, scrolled, fabOpen, sheet, openSheet, closeSheet],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useShell(): Shell {
  const v = useContext(Ctx);
  if (!v) throw new Error('useShell must be used inside <ShellProvider>');
  return v;
}
