// The start-up: the bus shivers, rocks back nose-up, then speeds off; the first screen takes over at 1850ms and
// the intro is gone at 2150ms. Read on a fake clock, frame by frame.
import { act, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { getAnimatedStyle as getStyle } from 'react-native-reanimated';

import { Intro } from '@/components/Intro';
import { IntroProvider, useIntro } from '@/state/IntroContext';

function Done() {
  return <Text testID="done">{String(useIntro().introDone)}</Text>;
}

type Transform = Record<string, number | string>[];
// Reanimated's test helper; its published type takes no arguments, so it is typed here.
const getAnimatedStyle = getStyle as unknown as (node: unknown) => { transform?: Transform };
const tf = (id: string) =>
  (getAnimatedStyle(screen.getByTestId(id, { includeHiddenElements: true })).transform ?? []) as Transform;
const pick = (t: Transform, key: string) => t.find((o) => key in o)?.[key];

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

async function at(ms: number, from: number) {
  await act(() => jest.advanceTimersByTime(ms - from));
}

test('starts up, rocks back, speeds off, then hands over', async () => {
  await render(
    <IntroProvider>
      <Intro />
      <Done />
    </IntroProvider>,
  );
  await at(700, 0); // engine running: a shiver, nothing has moved off yet
  expect(Math.abs(pick(tf('intro-car'), 'translateX') as number)).toBeLessThan(1);

  await at(1200, 700); // gathering itself: back a touch, nose up
  expect(pick(tf('intro-car'), 'translateX') as number).toBeLessThan(-5);
  expect(parseFloat(pick(tf('intro-bus'), 'rotate') as string)).toBeLessThan(-2);
  expect(screen.getByTestId('done')).toHaveTextContent('false');

  await at(1600, 1200); // away, accelerating
  const mid = pick(tf('intro-car'), 'translateX') as number;
  expect(mid).toBeGreaterThan(0);
  await at(1800, 1600);
  expect(pick(tf('intro-car'), 'translateX') as number).toBeGreaterThan(mid * 2);

  await at(1900, 1800); // the first screen's entrances start as the field fades
  expect(screen.getByTestId('done')).toHaveTextContent('true');
  await at(2200, 1900);
  expect(screen.queryByTestId('intro-car', { includeHiddenElements: true })).toBeNull();
});
