// Phase 7: onboarding (tests/otp.test.js in the prototype). The phone is checked before a code is sent; the code
// boxes advance, take a pasted code, say when a code is wrong and stay usable; a right code moves on.
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import Code from '@/app/onboarding/code';
import Phone from '@/app/onboarding/phone';
import Welcome from '@/app/onboarding';
import { OTP_TIMELINE } from '@/components/onboarding/OtpBoxes';
import { OnboardingProvider, useOnboarding } from '@/state/OnboardingContext';
import { ShellProvider } from '@/state/ShellContext';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn(), replace: jest.fn() },
  useIsFocused: () => true,
}));

const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } };

function Probe() {
  const { onboarded, phone } = useOnboarding();
  return <Text testID="state">{`${onboarded}|${phone}`}</Text>;
}

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <SafeAreaProvider initialMetrics={metrics}>
      <OnboardingProvider>
        <ShellProvider>
          {children}
          <Probe />
        </ShellProvider>
      </OnboardingProvider>
    </SafeAreaProvider>
  );
}

beforeEach(() => jest.clearAllMocks());

/** The six boxes need the row's width before they render. */
async function layoutBoxes() {
  await fireEvent(screen.getByTestId('otp-stage'), 'layout', { nativeEvent: { layout: { width: 338, height: 64 } } });
}

test('welcome: Get started goes to the phone step; Skip (demo control) finishes onboarding', async () => {
  await render(<Welcome />, { wrapper: Wrapper });
  await fireEvent.press(screen.getByRole('button', { name: 'Get started' }));
  expect(router.push).toHaveBeenCalledWith('/onboarding/phone');
  await fireEvent.press(screen.getByRole('button', { name: 'Skip onboarding (demo control)' }));
  expect(screen.getByTestId('state')).toHaveTextContent('true|');
});

test('phone: a short number gets a visible message and no code is sent; the terms are one tap away', async () => {
  await render(<Phone />, { wrapper: Wrapper });
  const field = screen.getByLabelText('Phone number');
  expect(field).toHaveProp('keyboardType', 'phone-pad');
  expect(field).toHaveProp('autoComplete', 'tel');
  await fireEvent.changeText(field, '082');
  await fireEvent.press(screen.getByRole('button', { name: 'Send code' }));
  expect(screen.getByText('Enter the number you gave the school, like +27 82 555 0142.')).toBeOnTheScreen();
  expect(router.push).not.toHaveBeenCalledWith('/onboarding/code');

  await fireEvent.changeText(field, '+27 82 555 0142');
  await fireEvent.press(screen.getByRole('button', { name: 'Send code' }));
  expect(router.push).toHaveBeenCalledWith('/onboarding/code');
  expect(screen.getByTestId('state')).toHaveTextContent('false|+27 82 555 0142');

  await fireEvent.press(screen.getByRole('link', { name: 'Terms & conditions' }));
  expect(router.push).toHaveBeenCalledWith('/onboarding/terms');
});

describe('code', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('a wrong code says so, clears, and the boxes stay usable; typing clears the message', async () => {
    await render(<Code />, { wrapper: Wrapper });
    await layoutBoxes();
    for (const [i, d] of [...'000000'].entries())
      await fireEvent.changeText(screen.getByLabelText(`Digit ${i + 1}`), d);
    expect(screen.getByText("That code didn't match. Check the text and try again.")).toBeOnTheScreen();
    await act(() => jest.advanceTimersByTime(500));
    expect(screen.getByLabelText('Digit 1')).toHaveProp('value', '');
    expect(screen.getByLabelText('Digit 1')).toHaveProp('editable', true);
    await fireEvent.changeText(screen.getByLabelText('Digit 1'), '1');
    expect(screen.queryByText("That code didn't match. Check the text and try again.")).toBeNull();
  });

  test('a pasted code fills all six boxes; a right one plays through, then shows the linked children', async () => {
    await render(<Code />, { wrapper: Wrapper });
    await layoutBoxes();
    await fireEvent.changeText(screen.getByLabelText('Digit 1'), '12 34 56');
    expect([1, 2, 3, 4, 5, 6].map((n) => screen.getByLabelText(`Digit ${n}`).props.value).join('')).toBe('123456');
    expect(screen.queryByRole('button', { name: 'Resend code' })).toBeNull();
    expect(router.replace).not.toHaveBeenCalled();
    // Merged into one box, the digits are gone, so only the check shows.
    await act(() => jest.advanceTimersByTime(OTP_TIMELINE.MERGE + 10));
    expect([1, 2, 3, 4, 5, 6].map((n) => screen.getByLabelText(`Digit ${n}`).props.value).join('')).toBe('');
    await act(() => jest.advanceTimersByTime(OTP_TIMELINE.DONE - OTP_TIMELINE.MERGE + 50));
    expect(router.replace).toHaveBeenCalledWith('/onboarding/confirm');
  });

  test('Change number goes back to the phone step', async () => {
    await render(<Code />, { wrapper: Wrapper });
    await fireEvent.press(screen.getByRole('button', { name: 'Change number' }));
    expect(router.back).toHaveBeenCalled();
  });
});
