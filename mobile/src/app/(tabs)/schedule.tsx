// Schedule: the month calendar with the active child's exam days, and the selected day's pickup.
// It follows the active child; a notification can open it on a given date (/schedule?date=2026-09-10).
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { PageTitle } from '@/components/Card';
import { Enter } from '@/components/Enter';
import { Calendar } from '@/components/schedule/Calendar';
import { DayDetail } from '@/components/schedule/DayDetail';
import { Screen } from '@/components/shell/Screen';
import { examDaysByChild, TODAY } from '@/data/schedule';
import { dateKey, parseKey, shiftMonth } from '@/lib/calendar';
import { useChild } from '@/state/ChildContext';

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export default function ScheduleTab() {
  const { activeChild } = useChild();
  const exams = examDaysByChild[activeChild];
  const { date } = useLocalSearchParams<{ date?: string }>();

  const [selected, setSelected] = useState(TODAY);
  const [view, setView] = useState(() => {
    const { year, month } = parseKey(TODAY);
    return { year, month };
  });

  // Opening Schedule with a date (from a notification) selects it and shows its month.
  const [seen, setSeen] = useState<string | undefined>(undefined);
  if (date && ISO.test(date) && date !== seen) {
    setSeen(date);
    setSelected(date);
    const { year, month } = parseKey(date);
    setView({ year, month });
  }

  const onShift = (delta: number) => {
    const next = shiftMonth(view.year, view.month, delta);
    setView(next);
    setSelected(dateKey(next.year, next.month, 1)); // as the prototype: a new month opens on its 1st
  };

  return (
    <Screen>
      <Enter index={0}>
        <PageTitle>Schedule</PageTitle>
      </Enter>
      <Enter index={1}>
        <Calendar
          year={view.year}
          month={view.month}
          selected={selected}
          today={TODAY}
          exams={exams}
          onSelect={setSelected}
          onShift={onShift}
        />
      </Enter>
      <Enter index={2}>
        <DayDetail date={selected} exam={exams[selected]} child={activeChild} />
      </Enter>
    </Screen>
  );
}
