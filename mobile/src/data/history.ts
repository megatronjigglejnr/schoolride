// Ported from historyData in app/app.js.
import type { ChildKey, HistoryGroup, HistoryItem } from './types';

const day = (group: HistoryGroup, title: string, time: string): HistoryItem => ({ group, icon: 'confirm', title, time });

export const historyData: Record<ChildKey, HistoryItem[]> = {
  jane: [
    day('Yesterday', 'Dropped off at Oak Street', '3:14 PM with Mr. Naidoo'),
    day('Yesterday', 'Picked up at Riverside Primary', '2:51 PM with Mr. Naidoo'),
    day('Yesterday', 'Arrived at Riverside Primary', '7:44 AM with Mr. Naidoo'),
    day('Yesterday', 'Picked up at Oak Street', '7:12 AM with Mr. Naidoo'),
    day('Monday', 'Dropped off at Oak Street', '3:09 PM with Mr. Naidoo'),
    day('Monday', 'Picked up at Oak Street', '7:15 AM with Mr. Naidoo'),
  ],
  liam: [
    day('Yesterday', 'Dropped off at Birch Close', '2:58 PM with Ms. Dlamini'),
    day('Yesterday', 'Picked up at Northgate Academy', '2:34 PM with Ms. Dlamini'),
    day('Yesterday', 'Arrived at Northgate Academy', '7:38 AM with Ms. Dlamini'),
    day('Yesterday', 'Picked up at Birch Close', '7:20 AM with Ms. Dlamini'),
    day('Monday', 'Dropped off at Birch Close', '2:55 PM with Ms. Dlamini'),
    day('Monday', 'Picked up at Birch Close', '7:23 AM with Ms. Dlamini'),
  ],
};

/** Groups in display order; "Today" is always shown first, with an empty-state note. */
export const HISTORY_GROUPS: HistoryGroup[] = ['Yesterday', 'Monday'];
