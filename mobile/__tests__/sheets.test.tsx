// Phase 5: the call sheet's decided rules (ported from tests/call-sheet.test.js) and the Notifications screen.
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import NotificationsScreen from '@/app/notifications';
import { CallSheetBody } from '@/components/sheets/CallSheet';
import { ChildProvider, useChild, type Signal } from '@/state/ChildContext';
import { ShellProvider } from '@/state/ShellContext';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), canGoBack: jest.fn(() => true), navigate: jest.fn(), replace: jest.fn() },
}));

/** Test-only controls: switch child, and show which child is active. */
function Probe() {
  const { activeChild, setActiveChild } = useChild();
  return (
    <>
      <Text testID="active">{activeChild}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="test: Liam" onPress={() => setActiveChild('liam')} />
      <Pressable accessibilityRole="button" accessibilityLabel="test: Jane" onPress={() => setActiveChild('jane')} />
    </>
  );
}

function CallHarness({ toast }: { toast: (m: string) => void }) {
  const [edit, setEdit] = useState(false);
  return <CallSheetBody edit={edit} onToggleEdit={() => setEdit((e) => !e)} showToast={toast} />;
}

const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } };

const providers = (signal?: Signal) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <SafeAreaProvider initialMetrics={metrics}>
        <ChildProvider initial={signal ? { signal: { jane: signal } } : undefined}>
          <ShellProvider>
            {children}
            <Probe />
          </ShellProvider>
        </ChildProvider>
      </SafeAreaProvider>
    );
  };

describe('call sheet', () => {
  test('the driver comes first, as one direct call', async () => {
    const toast = jest.fn();
    await render(<CallHarness toast={toast} />, { wrapper: providers() });
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveAccessibleName('Call Mr. Naidoo, driving route 4');
    await fireEvent.press(buttons[0]);
    expect(toast).toHaveBeenCalledWith('Calling Mr. Naidoo…'); // DEMO_CALLS; real builds dial tel:
  });

  test('school contacts are listed and callable, with no switches in the calling view', async () => {
    const toast = jest.fn();
    await render(<CallHarness toast={toast} />, { wrapper: providers() });
    expect(screen.queryAllByRole('switch')).toHaveLength(0);
    await fireEvent.press(screen.getByRole('button', { name: 'Call Mr. Coetzee, Register teacher' }));
    expect(toast).toHaveBeenCalledWith('Calling Mr. Coetzee…');
    expect(screen.getByRole('button', { name: 'Call Ms. Patel, Grade 4 head' })).toBeOnTheScreen();
  });

  test('Edit hides a contact; the choice is remembered per child and reversible', async () => {
    await render(<CallHarness toast={jest.fn()} />, { wrapper: providers() });
    await fireEvent.press(screen.getByRole('button', { name: 'Edit' }));
    const patel = screen.getByRole('switch', { name: 'Show Ms. Patel in this list' });
    expect(patel).toBeChecked();
    await fireEvent.press(patel);
    expect(screen.getByRole('switch', { name: 'Show Ms. Patel in this list' })).not.toBeChecked();
    await fireEvent.press(screen.getByRole('button', { name: 'Done' }));
    expect(screen.queryByRole('button', { name: 'Call Ms. Patel, Grade 4 head' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Call Mr. Coetzee, Register teacher' })).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'test: Liam' }));
    expect(screen.getByRole('button', { name: 'Call Mr. Khumalo, Grade 2 head' })).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'test: Jane' }));
    expect(screen.queryByRole('button', { name: 'Call Ms. Patel, Grade 4 head' })).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: 'Edit' }));
    await fireEvent.press(screen.getByRole('switch', { name: 'Show Ms. Patel in this list' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Done' }));
    expect(screen.getByRole('button', { name: 'Call Ms. Patel, Grade 4 head' })).toBeOnTheScreen();
  });

  test('both hidden: an empty note that points back to Edit', async () => {
    await render(<CallHarness toast={jest.fn()} />, { wrapper: providers() });
    await fireEvent.press(screen.getByRole('button', { name: 'Edit' }));
    await fireEvent.press(screen.getByRole('switch', { name: 'Show Ms. Patel in this list' }));
    await fireEvent.press(screen.getByRole('switch', { name: 'Show Mr. Coetzee in this list' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Done' }));
    expect(screen.getByText('No school contacts in this list. Tap Edit to add them back.')).toBeOnTheScreen();
    expect(screen.getAllByRole('button')[0]).toHaveAccessibleName('Call Mr. Naidoo, driving route 4');
  });

  test('signal lost: the sheet leads with why, above the driver', async () => {
    await render(<CallHarness toast={jest.fn()} />, { wrapper: providers({ lost: true, lostMinutes: 7 }) });
    expect(
      screen.getByText('Signal lost 7 min ago. Calling the driver is the fastest way to check in.'),
    ).toBeOnTheScreen();
  });
});

describe('notifications', () => {
  beforeEach(() => jest.clearAllMocks());

  test('tapping one marks it read, switches child, closes, then opens what it refers to', async () => {
    jest.useFakeTimers();
    await render(<NotificationsScreen />, { wrapper: providers() });
    expect(screen.getByTestId('active')).toHaveTextContent('jane');
    await fireEvent.press(screen.getByRole('button', { name: "Unread: Liam's spelling test pickup set for 12:00, For Sep 14, Liam" }));
    expect(screen.getByTestId('active')).toHaveTextContent('liam');
    expect(router.back).toHaveBeenCalled();
    await act(() => jest.advanceTimersByTime(200));
    expect(router.navigate).toHaveBeenCalledWith({ pathname: '/schedule', params: { date: '2026-09-14' } });
    expect(screen.getByRole('button', { name: "Liam's spelling test pickup set for 12:00, For Sep 14, Liam" })).toBeOnTheScreen();
    jest.useRealTimers();
  });

  test('an item with nowhere to go is only marked read; Mark all read clears the rest', async () => {
    await render(<NotificationsScreen />, { wrapper: providers() });
    await fireEvent.press(screen.getByRole('button', { name: "Liam's route now driven by Ms. Dlamini, Sep 8, Liam" }));
    expect(router.back).not.toHaveBeenCalled();
    expect(screen.getByTestId('active')).toHaveTextContent('jane');
    expect(screen.getAllByRole('button', { name: /^Unread:/ })).toHaveLength(3);
    await fireEvent.press(screen.getByRole('button', { name: 'Mark all read' }));
    expect(screen.queryAllByRole('button', { name: /^Unread:/ })).toHaveLength(0);
  });

  test('preferences start at the decided defaults and toggle', async () => {
    await render(<NotificationsScreen />, { wrapper: providers() });
    expect(screen.getByRole('switch', { name: 'Pickup & drop-off updates' })).toBeChecked();
    expect(screen.getByRole('switch', { name: 'Exam-day changes' })).toBeChecked();
    expect(screen.getByRole('switch', { name: 'Route or driver changes' })).toBeChecked();
    const share = screen.getByRole('switch', { name: 'Shared ETA activity' });
    expect(share).not.toBeChecked();
    await fireEvent.press(share);
    expect(screen.getByRole('switch', { name: 'Shared ETA activity' })).toBeChecked();
  });
});
