// Phase 8: the full map. Swiping or tapping a child's card switches the active child through setActiveChild, so
// the map's title and every tab follow (tests/navigation.test.js: "swiping the full-map carousel updates the
// header switcher"). Zoom is offered both ways; the back button closes it.
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import RouteMapScreen from '@/app/route-map';
import { AccountProvider } from '@/state/AccountContext';
import { ChildProvider, useChild } from '@/state/ChildContext';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), canGoBack: jest.fn(() => true), replace: jest.fn() },
}));

const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } };

function Active() {
  return <Text testID="active">{useChild().activeChild}</Text>;
}

const wrapper = (lostLiam = false) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <SafeAreaProvider initialMetrics={metrics}>
        <ChildProvider initial={lostLiam ? { signal: { liam: { lost: true, lostMinutes: 7 } } } : undefined}>
          <AccountProvider>
            {children}
            <Active />
          </AccountProvider>
        </ChildProvider>
      </SafeAreaProvider>
    );
  };

beforeEach(() => jest.clearAllMocks());

test('opens on the active child, with a card per linked child', async () => {
  await render(<RouteMapScreen />, { wrapper: wrapper() });
  expect(screen.getByRole('header', { name: "Jane's route" })).toBeOnTheScreen();
  const jane = screen.getByRole('button', { name: /^Jane Doe, Riverside Primary, On the way · 12 min/ });
  expect(jane).toBeSelected();
  expect(screen.getByRole('button', { name: /^Liam Doe, Northgate Academy, On the way · 6 min/ })).not.toBeSelected();
  expect(screen.getByRole('button', { name: 'Zoom in' })).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Zoom out' })).toBeOnTheScreen();
});

test('tapping a card switches the active child, and the map follows', async () => {
  await render(<RouteMapScreen />, { wrapper: wrapper() });
  await fireEvent.press(screen.getByRole('button', { name: /^Liam Doe/ }));
  expect(screen.getByTestId('active')).toHaveTextContent('liam');
  expect(screen.getByRole('header', { name: "Liam's route" })).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: /^Liam Doe/ })).toBeSelected();
});

test('swiping the carousel to a card switches the child once it comes to rest', async () => {
  jest.useFakeTimers();
  try {
    await render(<RouteMapScreen />, { wrapper: wrapper() });
    const carousel = screen.getByTestId('route-carousel');
    await fireEvent.scroll(carousel, { nativeEvent: { contentOffset: { x: 272, y: 0 } } });
    expect(screen.getByTestId('active')).toHaveTextContent('jane'); // still moving
    await act(() => jest.advanceTimersByTime(100));
    expect(screen.getByTestId('active')).toHaveTextContent('liam');
    await fireEvent.scroll(carousel, { nativeEvent: { contentOffset: { x: 0, y: 0 } } });
    await act(() => jest.advanceTimersByTime(100));
    expect(screen.getByTestId('active')).toHaveTextContent('jane');
  } finally {
    jest.useRealTimers();
  }
});

test('a child with a lost signal says so on their card, calmly', async () => {
  await render(<RouteMapScreen />, { wrapper: wrapper(true) });
  expect(
    screen.getByRole('button', { name: /^Liam Doe, Northgate Academy, Signal lost · last seen 7 min ago/ }),
  ).toBeOnTheScreen();
});

test('Back closes the map', async () => {
  await render(<RouteMapScreen />, { wrapper: wrapper() });
  await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  expect(router.back).toHaveBeenCalled();
});
