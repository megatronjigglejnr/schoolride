// Schedule: calendar maths, and the exam-day "Running late?" rule as the parent sees it.
import { render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { DayDetail } from '@/components/schedule/DayDetail';
import { examDaysByChild } from '@/data/schedule';
import type { CallPrefs, ChildKey } from '@/data/types';
import { dateKey, dayLabel, groupNote, monthGrid, shiftMonth } from '@/lib/calendar';
import { ChildProvider } from '@/state/ChildContext';
import { ShellProvider } from '@/state/ShellContext';

test('calendar maths', () => {
  expect(dateKey(2026, 8, 6)).toBe('2026-09-06');
  expect(dayLabel('2026-09-10')).toBe('Thursday, 10 September');
  expect(monthGrid(2026, 8)).toEqual({ leading: 2, days: 30 }); // September 2026 starts on a Tuesday
  expect(shiftMonth(2026, 11, 1)).toEqual({ year: 2027, month: 0 });
  expect(shiftMonth(2026, 0, -1)).toEqual({ year: 2025, month: 11 });
  expect(groupNote(2)).toBe('Grouped with 2 other children finishing nearby.');
  expect(groupNote(1)).toBe('Grouped with 1 other child finishing nearby.');
  expect(groupNote(0)).toBe('Solo pickup — no other exam finishes were close enough to group.');
});

const day = async (date: string, child: ChildKey, prefs?: CallPrefs) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <ChildProvider initial={{ activeChild: child, callPrefs: prefs ? { [child]: prefs } : undefined }}>
      <ShellProvider>{children}</ShellProvider>
    </ChildProvider>
  );
  await render(<DayDetail date={date} exam={examDaysByChild[child][date]} child={child} />, { wrapper: Wrapper });
};

test('exam day: pickup, why, and the register teacher first', async () => {
  await day('2026-09-10', 'jane');
  expect(screen.getByText('Exam day — pickup adjusted')).toBeOnTheScreen();
  expect(screen.getByLabelText('Pickup at 11:30')).toBeOnTheScreen();
  expect(screen.getByText(/Jane's maths exam\. Grouped with 2 other children/)).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Running late? Call Mr. Coetzee, Register teacher' })).toBeOnTheScreen();
});

test('register teacher hidden: falls back to the grade head', async () => {
  await day('2026-09-10', 'jane', { register: false, gradeHead: true });
  expect(screen.getByRole('button', { name: 'Running late? Call Ms. Patel, Grade 4 head' })).toBeOnTheScreen();
});

test('both hidden: no "Running late?" at all', async () => {
  await day('2026-09-10', 'jane', { register: false, gradeHead: false });
  expect(screen.queryByText('Running late?')).toBeNull();
});

test("a regular day, and the other child's contacts", async () => {
  await day('2026-09-11', 'jane');
  expect(screen.getByText('Regular day')).toBeOnTheScreen();
  expect(screen.queryByText('Running late?')).toBeNull();
  await day('2026-09-14', 'liam');
  expect(screen.getByRole('button', { name: 'Running late? Call Ms. Williams, Register teacher' })).toBeOnTheScreen();
});
