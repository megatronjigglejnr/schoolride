// Phase 9: the prototype's cross-screen rules (tests/navigation.test.js, tests/call-sheet.test.js), and a walk of
// every screen that fails on any control a screen reader can't name.
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { Pressable, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HistoryTab from '@/app/(tabs)/history';
import TrackTab from '@/app/(tabs)/index';
import AccountScreen from '@/app/(tabs)/profile';
import Family from '@/app/(tabs)/profile/family';
import PersonalInfo from '@/app/(tabs)/profile/personal';
import Privacy from '@/app/(tabs)/profile/privacy';
import Security from '@/app/(tabs)/profile/security';
import Terms from '@/app/(tabs)/profile/terms';
import ScheduleTab from '@/app/(tabs)/schedule';
import NotificationsScreen from '@/app/notifications';
import Welcome from '@/app/onboarding';
import Code from '@/app/onboarding/code';
import Confirm from '@/app/onboarding/confirm';
import Permission from '@/app/onboarding/permission';
import Phone from '@/app/onboarding/phone';
import OnboardingTerms from '@/app/onboarding/terms';
import RouteMapScreen from '@/app/route-map';
import { Header } from '@/components/shell/Header';
import { NavBar } from '@/components/shell/NavBar';
import { CallSheet } from '@/components/sheets/CallSheet';
import { FriendSheet } from '@/components/sheets/FriendSheet';
import { PhotoSheet } from '@/components/sheets/PhotoSheet';
import { ShareSheet } from '@/components/sheets/ShareSheet';
import { AccountProvider } from '@/state/AccountContext';
import { ChildProvider, useChild, type Signal } from '@/state/ChildContext';
import { OnboardingProvider } from '@/state/OnboardingContext';
import { ShellProvider, useShell, type SheetName } from '@/state/ShellContext';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn(), navigate: jest.fn(), replace: jest.fn(), canGoBack: jest.fn(() => true) },
  useIsFocused: () => true,
  useLocalSearchParams: () => ({}),
}));
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
  CameraType: { front: 'front' },
}));

const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } };

function Probe() {
  const { setActiveChild } = useChild();
  const { toast } = useShell();
  return (
    <>
      <Text testID="toast">{toast ?? ''}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="test: Liam" onPress={() => setActiveChild('liam')} />
    </>
  );
}

const providers = ({ signal, sheet }: { signal?: Partial<Record<'jane' | 'liam', Signal>>; sheet?: SheetName } = {}) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <SafeAreaProvider initialMetrics={metrics}>
        <ChildProvider initial={signal ? { signal } : undefined}>
          <AccountProvider>
            <OnboardingProvider>
              <ShellProvider initialSheet={sheet ?? null}>
                {children}
                <Probe />
              </ShellProvider>
            </OnboardingProvider>
          </AccountProvider>
        </ChildProvider>
      </SafeAreaProvider>
    );
  };

// Toasts and entrances run on timers; let them land before each test ends.
afterEach(async () => {
  await act(() => new Promise((r) => setTimeout(r, 250)));
});

describe('one active child', () => {
  test('one switch re-renders Track, Schedule and History for that child', async () => {
    await render(
      <>
        <TrackTab />
        <ScheduleTab />
        <HistoryTab />
      </>,
      { wrapper: providers() },
    );
    expect(screen.getByRole('button', { name: 'Call Mr. Naidoo' })).toBeOnTheScreen();
    expect(screen.getAllByText('Picked up at Riverside Primary').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /^Thursday, 10 September, exam day/ })).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'test: Liam' }));

    expect(screen.getByRole('button', { name: 'Call Ms. Dlamini' })).toBeOnTheScreen(); // Track
    expect(screen.queryByRole('button', { name: 'Call Mr. Naidoo' })).toBeNull();
    expect(screen.getAllByText('Picked up at Northgate Academy').length).toBeGreaterThan(0); // History
    expect(screen.queryByText('Picked up at Riverside Primary')).toBeNull();
    expect(screen.getByRole('button', { name: /^Monday, 14 September, exam day/ })).toBeOnTheScreen(); // Schedule
    expect(screen.queryByRole('button', { name: /^Thursday, 10 September, exam day/ })).toBeNull();
  });
});

describe('calls from Track', () => {
  test('the driver is one tap from Track, as a direct call', async () => {
    await render(<TrackTab />, { wrapper: providers() });
    await fireEvent.press(screen.getByRole('button', { name: 'Call Mr. Naidoo' }));
    expect(screen.getByTestId('toast')).toHaveTextContent('Calling Mr. Naidoo…'); // DEMO_CALLS; real builds dial tel:
  });

  test('signal lost: calm under 5 min; at 5+ a direct "Call [driver] to check in"', async () => {
    const { unmount } = await render(<TrackTab />, {
      wrapper: providers({ signal: { jane: { lost: true, lostMinutes: 3 } } }),
    });
    expect(screen.getByText(/Last seen 3 min ago/)).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Call Mr. Naidoo to check in' })).toBeNull();
    await unmount();

    await render(<TrackTab />, { wrapper: providers({ signal: { jane: { lost: true, lostMinutes: 7 } } }) });
    await fireEvent.press(screen.getByRole('button', { name: 'Call Mr. Naidoo to check in' }));
    expect(screen.getByTestId('toast')).toHaveTextContent('Calling Mr. Naidoo…');
  });
});

/**
 * Every control a person can press must say what it is (a role) and what it does (a name), or a screen reader
 * announces "button" and nothing else. Host nodes that handle presses are found in the rendered tree; their name
 * is their label, or the text inside them.
 */
type Node = { type: string; props: Record<string, unknown>; children: (Node | string)[] | null };
const ROLES = new Set(['button', 'link', 'switch', 'radio', 'tab', 'checkbox', 'togglebutton', 'menuitem']);

function textOf(n: Node | string): string {
  if (typeof n === 'string') return n;
  return (n.children ?? []).map(textOf).join('');
}
function unnamedControls(tree: Node | Node[] | null): string[] {
  const out: string[] = [];
  const visit = (n: Node | string) => {
    if (typeof n === 'string') return;
    const p = n.props;
    const pressable =
      typeof p.onClick === 'function' || typeof p.onResponderRelease === 'function' || typeof p.onPress === 'function';
    if (pressable && n.type !== 'TextInput') {
      const role = (p.accessibilityRole ?? p.role) as string | undefined;
      const name = ((p.accessibilityLabel ?? p['aria-label'] ?? textOf(n)) as string).trim();
      const test = typeof name === 'string' && name.startsWith('test:');
      if (!test && (!role || !ROLES.has(role) || !name)) out.push(`${role ?? 'no role'} "${name}"`);
    }
    (n.children ?? []).forEach(visit);
  };
  (Array.isArray(tree) ? tree : tree ? [tree] : []).forEach(visit);
  return out;
}

const SCREENS: [string, () => ReactNode, Parameters<typeof providers>[0]?][] = [
  ['Header (Track)', () => <Header tab="index" onAccount={() => {}} />],
  ['Header (Account sub-screen)', () => <Header tab="profile" subTitle="Family" onAccount={() => {}} />],
  ['Nav bar', () => <NavBar tab="index" onTab={() => {}} />],
  ['Track', () => <TrackTab />],
  ['Track, signal lost', () => <TrackTab />, { signal: { jane: { lost: true, lostMinutes: 7 } } }],
  ['Schedule', () => <ScheduleTab />],
  ['History', () => <HistoryTab />],
  ['Account', () => <AccountScreen />],
  ['Personal info', () => <PersonalInfo />],
  ['Family', () => <Family />],
  ['Privacy', () => <Privacy />],
  ['Login & security', () => <Security />],
  ['Terms', () => <Terms />],
  ['Notifications', () => <NotificationsScreen />],
  ['Full map', () => <RouteMapScreen />],
  ['Welcome', () => <Welcome />],
  ['Phone', () => <Phone />],
  ['Code', () => <Code />],
  ['Confirm', () => <Confirm />],
  ['Notifications ask', () => <Permission />],
  ['Onboarding terms', () => <OnboardingTerms />],
  ['Call sheet', () => <CallSheet />, { sheet: 'call' }],
  ['Share sheet', () => <ShareSheet />, { sheet: 'share' }],
  ['Photo sheet', () => <PhotoSheet />, { sheet: 'photo' }],
  ['Friend sheet', () => <FriendSheet />, { sheet: 'friend' }],
];

describe('every control has a role and a name', () => {
  // Object rows: with array rows of two, Jest would take a third parameter for a done() callback.
  test.each(SCREENS.map(([name, ui, opts]) => ({ name, ui, opts })))('$name', async ({ ui, opts }) => {
    await render(<>{ui()}</>, { wrapper: providers(opts) });
    expect(unnamedControls(screen.toJSON() as Node | Node[] | null)).toEqual([]);
  });

  test('the walk does catch an unnamed control', async () => {
    await render(<Pressable onPress={() => {}} />);
    expect(unnamedControls(screen.toJSON() as Node)).toEqual(['no role ""']);
  });
});
