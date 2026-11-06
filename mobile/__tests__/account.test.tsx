// Phase 6: Account. Personal info checks before saving; trusted friends reach Share ETA; privacy defaults are
// off; a photo replaces initials; Memoji is offered only on Apple devices. (tests/account.test.js in the prototype.)
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { Platform, Pressable, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import Family from '@/app/(tabs)/profile/family';
import PersonalInfo from '@/app/(tabs)/profile/personal';
import Privacy from '@/app/(tabs)/profile/privacy';
import Security from '@/app/(tabs)/profile/security';
import { FriendSheet } from '@/components/sheets/FriendSheet';
import { PhotoSheet } from '@/components/sheets/PhotoSheet';
import { ShareSheet } from '@/components/sheets/ShareSheet';
import { emailOk, initialsOf, isAppleDevice, phoneOk } from '@/lib/account';
import { AccountProvider, useAccount } from '@/state/AccountContext';
import { ChildProvider } from '@/state/ChildContext';
import { ShellProvider, useShell } from '@/state/ShellContext';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn(), navigate: jest.fn() },
  useIsFocused: () => true,
}));
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: false, assets: [{ uri: 'file:///me.jpg' }] })),
  launchCameraAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(async () => ({ granted: false })),
  CameraType: { front: 'front' },
}));

// Toasts after a sheet closes arrive 200ms later; let them land before the test ends.
afterEach(async () => {
  await act(() => new Promise((r) => setTimeout(r, 300)));
});

const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } };

/** Test-only: what the account holds, and a way to open a sheet. */
function Probe() {
  const { profile, photos, friends } = useAccount();
  const { openSheet, toast } = useShell();
  return (
    <>
      <Text testID="profile">{`${profile.name}|${profile.phone}|${profile.email}`}</Text>
      <Text testID="photo">{photos.me ?? 'none'}</Text>
      <Text testID="friends">{friends.map((f) => f.name).join(',')}</Text>
      <Text testID="toast">{toast ?? ''}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="test: share" onPress={() => openSheet('share')} />
      <Pressable accessibilityRole="button" accessibilityLabel="test: photo" onPress={() => openSheet('photo')} />
    </>
  );
}

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <SafeAreaProvider initialMetrics={metrics}>
      <ChildProvider>
        <AccountProvider>
          <ShellProvider>
            {children}
            <ShareSheet />
            <FriendSheet />
            <PhotoSheet />
            <Probe />
          </ShellProvider>
        </AccountProvider>
      </ChildProvider>
    </SafeAreaProvider>
  );
}

test('account rules', () => {
  expect(initialsOf('Sarah Doe')).toBe('SD');
  expect(initialsOf('Naledi van der Merwe')).toBe('NM');
  expect(initialsOf('Gogo')).toBe('G');
  expect(phoneOk('+27 82 555 0142')).toBe(true);
  expect(phoneOk('0825')).toBe(false);
  expect(phoneOk('call me')).toBe(false);
  expect(emailOk('you@example.com')).toBe(true);
  expect(emailOk('you@example')).toBe(false);
});

test('Personal info: bad values get a message and nothing saves; good ones save, and a new number is confirmed', async () => {
  await render(<PersonalInfo />, { wrapper: Wrapper });
  await fireEvent.changeText(screen.getByLabelText('Full name'), '');
  await fireEvent.changeText(screen.getByLabelText('Email'), 'nope');
  await fireEvent.press(screen.getByRole('button', { name: 'Save changes' }));
  expect(screen.getByText('Enter your name.')).toBeOnTheScreen();
  expect(screen.getByText('Enter an email address, like you@example.com.')).toBeOnTheScreen();
  expect(screen.getByTestId('profile')).toHaveTextContent('Sarah Doe|+27 82 555 0142|sarah.doe@email.com');

  await fireEvent.changeText(screen.getByLabelText('Full name'), 'Sarah Mokoena');
  await fireEvent.changeText(screen.getByLabelText('Phone'), '+27 82 555 0199');
  await fireEvent.changeText(screen.getByLabelText('Email'), 'sarah@example.com');
  await fireEvent.press(screen.getByRole('button', { name: 'Save changes' }));
  expect(screen.getByTestId('profile')).toHaveTextContent('Sarah Mokoena|+27 82 555 0199|sarah@example.com');
  expect(screen.getByText('Saved. We texted a code to +27 82 555 0199 to confirm it.')).toBeOnTheScreen();
  expect(screen.queryByText('Enter your name.')).toBeNull();
});

test('Family: no self-service linking; a trusted friend is added, appears in Share ETA, and can be removed', async () => {
  await render(<Family />, { wrapper: Wrapper });
  await fireEvent.press(screen.getByRole('button', { name: 'Add a child' }));
  expect(screen.getByTestId('toast')).toHaveTextContent('Contact your school to link an additional child');

  const jane = screen.getByRole('button', { name: 'Jane Doe, Riverside Primary, Grade 4' });
  expect(jane).not.toBeExpanded();
  await fireEvent.press(jane);
  expect(screen.getByText('Route 4 · Mr. Naidoo')).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: "Change Jane's photo" })).toBeOnTheScreen();

  await fireEvent.press(screen.getByRole('button', { name: 'Add a trusted friend' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Add friend' }));
  expect(screen.getByText('Enter their name.')).toBeOnTheScreen();
  await fireEvent.changeText(screen.getByLabelText('Name'), 'Gogo Dlamini');
  await fireEvent.changeText(screen.getByLabelText('Phone'), '+27 72 555 0110');
  await fireEvent.press(screen.getByRole('radio', { name: 'Relative' }));
  expect(screen.getByRole('radio', { name: 'Relative' })).toBeChecked();
  await fireEvent.press(screen.getByRole('button', { name: 'Add friend' }));
  expect(screen.getByTestId('friends')).toHaveTextContent('Naledi Mokoena,Gogo Dlamini');

  await fireEvent.press(screen.getByRole('button', { name: 'test: share' }));
  expect(screen.getByRole('button', { name: 'Share with Thabo Doe' })).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Share with Naledi Mokoena' })).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Share with Gogo Dlamini' })).toBeOnTheScreen();
  expect(screen.getByText('Trusted friend · Relative')).toBeOnTheScreen();

  await fireEvent.press(screen.getByRole('button', { name: 'Remove Naledi Mokoena' }));
  expect(screen.getByTestId('friends')).toHaveTextContent('Gogo Dlamini');
  expect(screen.queryByRole('button', { name: 'Share with Naledi Mokoena' })).toBeNull();
});

test('Privacy: analytics and crash reports are off by default; data can be requested once', async () => {
  await render(<Privacy />, { wrapper: Wrapper });
  const analytics = screen.getByRole('switch', { name: 'Usage analytics' });
  expect(analytics).not.toBeChecked();
  expect(screen.getByRole('switch', { name: 'Crash reports' })).not.toBeChecked();
  await fireEvent.press(analytics);
  expect(screen.getByRole('switch', { name: 'Usage analytics' })).toBeChecked();
  expect(screen.getByLabelText(/Your phone's location: Not used/)).toBeOnTheScreen();

  await fireEvent.press(screen.getByRole('button', { name: 'Request my data' }));
  expect(screen.getByText("We'll email a copy to sarah.doe@email.com within 30 days.")).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Requested' })).toBeDisabled();
});

test('Login & security: the recovery email is off by default and its field appears only when on', async () => {
  await render(<Security />, { wrapper: Wrapper });
  const sw = screen.getByRole('switch', { name: 'Recovery email' });
  expect(sw).not.toBeChecked();
  expect(screen.queryByRole('button', { name: 'Save recovery email' })).toBeNull();
  await fireEvent.press(sw);
  expect(screen.getByRole('button', { name: 'Save recovery email' })).toBeOnTheScreen();
});

test('a chosen photo replaces the initials; Memoji is offered only on Apple devices', async () => {
  await render(<PersonalInfo />, { wrapper: Wrapper });
  await fireEvent.press(screen.getByRole('button', { name: 'test: photo' }));
  expect(screen.getByRole('button', { name: 'Choose from library' })).toBeOnTheScreen();
  expect(!!screen.queryByRole('button', { name: /Use a Memoji/ })).toBe(isAppleDevice());
  expect(screen.queryByRole('button', { name: 'Remove photo, use initials' })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Choose from library' }));
  expect(screen.getByTestId('photo')).toHaveTextContent('file:///me.jpg');

  // The camera asks first; refused, it says how to turn it on and changes nothing.
  await fireEvent.press(screen.getByRole('button', { name: 'test: photo' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Take a photo' }));
  expect(screen.getByTestId('toast')).toHaveTextContent('Camera access is off. You can turn it on in Settings.');
  await fireEvent.press(screen.getByRole('button', { name: 'Remove photo, use initials' }));
  expect(screen.getByTestId('photo')).toHaveTextContent('none');
});

test('Memoji is an Apple-only option', () => {
  const os = Platform.OS;
  Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
  expect(isAppleDevice()).toBe(true);
  Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
  expect(isAppleDevice()).toBe(false);
  Object.defineProperty(Platform, 'OS', { value: os, configurable: true });
});
