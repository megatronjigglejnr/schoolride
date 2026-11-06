// Phase 9: the system's Reduce Motion and Reduce Transparency settings are respected.
// Reduce Motion is on for this whole file; Reduce Transparency is switched on per test.
import { act, render, screen } from '@testing-library/react-native';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
import { getAnimatedStyle as getStyle } from 'react-native-reanimated';

import { Enter } from '@/components/Enter';
import { Glass } from '@/components/Glass';
import { Intro } from '@/components/Intro';
import { OtpBoxes } from '@/components/onboarding/OtpBoxes';
import { IntroProvider, useIntro } from '@/state/IntroContext';
import { color } from '@/theme/tokens';

jest.mock('react-native-reanimated', () => {
  const actual = jest.requireActual('react-native-reanimated');
  return { __esModule: true, ...actual, default: actual.default, useReducedMotion: () => true };
});
jest.mock('expo-router', () => ({ useIsFocused: () => true }));

// Reanimated's test helper; its published type takes no arguments, so it is typed here.
const getAnimatedStyle = getStyle as unknown as (node: unknown) => { opacity?: number; transform?: object[] };

function Done() {
  return <Text testID="done">{String(useIntro().introDone)}</Text>;
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test('Reduce Motion: no start-up animation; the app is there at once', async () => {
  await render(
    <IntroProvider>
      <Intro />
      <Done />
    </IntroProvider>,
  );
  expect(screen.getByTestId('done')).toHaveTextContent('true');
  expect(screen.queryByTestId('intro-car', { includeHiddenElements: true })).toBeNull();
});

test('Reduce Motion: page blocks are in place at once, no rise or fade', async () => {
  await render(
    <Enter index={2}>
      <Text>Block</Text>
    </Enter>,
  );
  const style = getAnimatedStyle(screen.getByText('Block').parent);
  expect(style.opacity).toBe(1);
  expect(style.transform).toEqual([{ translateY: 0 }]);
});

test('Reduce Motion: a right code goes straight to the check, then on', async () => {
  const onDone = jest.fn();
  await render(<OtpBoxes check={() => true} onDone={onDone} onWrong={() => {}} onType={() => {}} />);
  await act(async () => {
    screen.getByTestId('otp-stage').props.onLayout({ nativeEvent: { layout: { width: 338, height: 64 } } });
  });
  await act(async () => {
    screen.getByLabelText('Digit 1').props.onChangeText('123456');
  });
  expect(screen.getByLabelText('Code accepted')).toBeOnTheScreen(); // no rings, deck or merge first
  expect(onDone).not.toHaveBeenCalled();
  await act(() => jest.advanceTimersByTime(950));
  expect(onDone).toHaveBeenCalled();
});

test('Reduce Transparency: glass becomes a solid fill', async () => {
  jest.spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled').mockResolvedValue(true);
  await render(
    <View testID="host">
      <Glass variant="sheet" style={{ height: 10 }} />
    </View>,
  );
  await act(async () => {}); // the setting is read asynchronously
  const glass = screen.getByTestId('host').children[0] as unknown as { props: { style: object } };
  expect(StyleSheet.flatten(glass.props.style)).toMatchObject({ backgroundColor: color.card });
});
