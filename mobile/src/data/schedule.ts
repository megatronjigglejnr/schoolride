// Ported from examDaysByChild and the calendar constants in app/app.js.
import type { ChildKey, ExamDays } from './types';

export const examDaysByChild: Record<ChildKey, ExamDays> = {
  jane: {
    '2026-09-10': { pickup: '11:30', grouped: 2, subject: "Jane's maths exam" },
    '2026-09-17': { pickup: '10:15', grouped: 0, subject: "Jane's reading assessment" },
  },
  liam: {
    '2026-09-14': { pickup: '12:00', grouped: 1, subject: "Liam's spelling test" },
    '2026-09-21': { pickup: '09:30', grouped: 0, subject: "Liam's number skills check" },
  },
};

/** The prototype's fixed "today", so the mock exam days stay in view. */
export const TODAY = '2026-09-06';
