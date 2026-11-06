// Calendar helpers, ported from the SCHEDULE CALENDAR block in app/app.js. Dates are ISO keys ('2026-09-10')
// in local time, as in the prototype.

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;
export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

const pad = (n: number) => (n < 10 ? '0' + n : '' + n);

/** month is 0-based, like Date. */
export const dateKey = (year: number, month: number, day: number) => `${year}-${pad(month + 1)}-${pad(day)}`;

export function parseKey(key: string) {
  const [y, m, d] = key.split('-').map(Number);
  return { year: y, month: m - 1, day: d };
}

/** "Thursday, 10 September": the detail card's date line and each day's spoken name. */
export function dayLabel(key: string) {
  const { year, month, day } = parseKey(key);
  return `${WEEKDAYS[new Date(year, month, day).getDay()]}, ${day} ${MONTHS[month]}`;
}

/** Leading empty cells (the month starts on Sunday = 0) and the number of days. */
export function monthGrid(year: number, month: number) {
  return { leading: new Date(year, month, 1).getDay(), days: new Date(year, month + 1, 0).getDate() };
}

/** Move by whole months, wrapping the year. */
export function shiftMonth(year: number, month: number, delta: number) {
  const m = month + delta;
  return { year: year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 };
}

/** The exam detail's grouping note (calSelectDate in the prototype). */
export function groupNote(grouped: number) {
  return grouped > 0
    ? `Grouped with ${grouped} other child${grouped > 1 ? 'ren' : ''} finishing nearby.`
    : 'Solo pickup — no other exam finishes were close enough to group.';
}
