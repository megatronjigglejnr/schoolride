// Ported from trackData in app/app.js. The live signal state (lost, lostMinutes) is runtime state
// in ChildContext, not data. The prototype's unused fields (stops, activeStopIdx, gradeHead*, register*) are left out.
import type { ChildKey, Track } from './types';

export const trackData: Record<ChildKey, Track> = {
  jane: {
    title: "Jane's ride",
    etaMin: 12,
    dest: 'Oak Street',
    progress: 'Stop 3 of 5',
    fillPct: 52,
    homeKm: 4.1,
    driver: { initial: 'N', name: 'Mr. Naidoo', role: 'Driving Route 4' },
    route: [
      { name: 'Depot', state: 'done' },
      { name: 'Fern Ave', state: 'done' },
      { name: 'Oak St', state: 'next' },
      { name: 'Birch Cl', state: 'todo' },
      { name: 'School', state: 'todo' },
    ],
  },
  liam: {
    title: "Liam's ride",
    etaMin: 6,
    dest: 'Birch Close',
    progress: 'Stop 2 of 4',
    fillPct: 78,
    homeKm: 1.8,
    driver: { initial: 'D', name: 'Ms. Dlamini', role: 'Driving Route 1' },
    route: [
      { name: 'Depot', state: 'done' },
      { name: 'Birch Cl', state: 'next' },
      { name: 'Elm Rd', state: 'todo' },
      { name: 'Northgate', state: 'todo' },
    ],
  },
};

/** Signal loss reaches the alert tier (red chip, direct "Call [driver] to check in") at this many minutes. */
export const LOST_ALERT_MIN = 5;
