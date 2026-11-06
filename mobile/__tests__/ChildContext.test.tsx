// ChildContext: one active child, changed only through setActiveChild; per-child state follows it.
import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { SIGNAL_TICK_MS } from '@/lib/demo';
import { ChildProvider, useChild } from '@/state/ChildContext';

const wrap = (initial?: Parameters<typeof ChildProvider>[0]['initial']) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return <ChildProvider initial={initial}>{children}</ChildProvider>;
  };

test('starts on Jane; setActiveChild is the only way to change the child', async () => {
  const { result } = await renderHook(useChild, { wrapper: wrap() });
  expect(result.current.activeChild).toBe('jane');
  await act(() => result.current.setActiveChild('liam'));
  expect(result.current.activeChild).toBe('liam');
  // Nothing else in the context can write the active child.
  const writers = Object.keys(result.current).filter((k) => /active/i.test(k));
  expect(writers.sort()).toEqual(['activeChild', 'setActiveChild']);
});

test('Edit choices are remembered per child and reversible', async () => {
  const { result } = await renderHook(useChild, { wrapper: wrap() });
  await act(() => result.current.toggleCallPref('gradeHead'));
  expect(result.current.callPrefs).toEqual({ gradeHead: false, register: true });

  await act(() => result.current.setActiveChild('liam'));
  expect(result.current.callPrefs).toEqual({ gradeHead: true, register: true });

  await act(() => result.current.setActiveChild('jane'));
  expect(result.current.callPrefs).toEqual({ gradeHead: false, register: true });
  await act(() => result.current.toggleCallPref('gradeHead'));
  expect(result.current.callPrefs).toEqual({ gradeHead: true, register: true });
});

test('signal-loss demo: counts minutes per child, and restoring resets it', async () => {
  jest.useFakeTimers();
  const { result, unmount } = await renderHook(useChild, { wrapper: wrap() });
  await act(() => result.current.toggleSignalDemo());
  expect(result.current.signal).toEqual({ lost: true, lostMinutes: 0 });
  await act(() => jest.advanceTimersByTime(SIGNAL_TICK_MS * 5));
  expect(result.current.signal).toEqual({ lost: true, lostMinutes: 5 });

  await act(() => result.current.setActiveChild('liam'));
  expect(result.current.signal).toEqual({ lost: false, lostMinutes: 0 });
  await act(() => jest.advanceTimersByTime(SIGNAL_TICK_MS * 2));
  await act(() => result.current.setActiveChild('jane'));
  expect(result.current.signal.lostMinutes).toBe(7); // Jane's clock kept running while Liam was shown

  await act(() => result.current.toggleSignalDemo());
  expect(result.current.signal).toEqual({ lost: false, lostMinutes: 0 });
  await act(() => jest.advanceTimersByTime(SIGNAL_TICK_MS * 3));
  expect(result.current.signal).toEqual({ lost: false, lostMinutes: 0 });
  await unmount();
  jest.useRealTimers();
});

test('initial state can be seeded (tests and previews)', async () => {
  const { result } = await renderHook(useChild, {
    wrapper: wrap({ activeChild: 'liam', signal: { liam: { lost: true, lostMinutes: 7 } } }),
  });
  expect(result.current.activeChild).toBe('liam');
  expect(result.current.signal).toEqual({ lost: true, lostMinutes: 7 });
});

test('unread notifications: mark one, then all', async () => {
  const { result } = await renderHook(useChild, { wrapper: wrap() });
  expect([...result.current.unread].sort()).toEqual([1, 4, 5]);
  await act(() => result.current.markRead(4));
  expect([...result.current.unread].sort()).toEqual([1, 5]);
  await act(() => result.current.markAllRead());
  expect(result.current.unread.size).toBe(0);
});

test('useChild outside the provider fails loudly', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  await expect(renderHook(useChild)).rejects.toThrow('useChild must be used inside <ChildProvider>');
});
