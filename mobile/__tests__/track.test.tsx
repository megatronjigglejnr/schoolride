// Track's new pieces: the time-of-day greeting and each child's distance from home.
import { render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { DistanceRows } from '@/components/track/DistanceRows';
import { greetingFor } from '@/lib/greeting';
import { ChildProvider } from '@/state/ChildContext';

import proto from './fixtures/prototype-data.json';

test('greeting by local hour: morning 05–11, afternoon 12–16, evening otherwise (same as the prototype)', () => {
  const hours = [0, 4, 5, 11, 12, 16, 17, 23];
  expect(hours.map(greetingFor)).toEqual([
    'Good evening', 'Good evening', 'Good morning', 'Good morning',
    'Good afternoon', 'Good afternoon', 'Good evening', 'Good evening',
  ]);
});

test('every linked child shows their distance from home, and a lost signal says "last seen"', async () => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <ChildProvider initial={{ signal: { liam: { lost: true, lostMinutes: 3 } } }}>{children}</ChildProvider>
  );
  await render(<DistanceRows />, { wrapper: Wrapper });
  expect(screen.getByLabelText('Jane: about 4.1 kilometres from home. Bus near Oak Street.')).toBeOnTheScreen();
  expect(screen.getByLabelText('Liam: about 1.8 kilometres from home. Last seen near Birch Close.')).toBeOnTheScreen();
  // The distances are the prototype's own numbers.
  expect([proto.trackData.jane.homeKm, proto.trackData.liam.homeKm]).toEqual([4.1, 1.8]);
});
