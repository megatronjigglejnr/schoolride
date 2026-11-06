// Ported from notifications in app/app.js. Each item is tagged with a child; tapping one switches to that
// child (through setActiveChild) and then opens `goto`. Items with no goto only get marked read.
import type { Notification, NotificationGroup } from './types';

export const notifications: Notification[] = [
  { id: 1, group: 'Today', icon: 'move', child: 'liam', title: "Liam's ride is 6 min away", time: '7:31 AM', unread: true, goto: { tab: 'track' } },
  { id: 2, group: 'Today', icon: 'info', child: 'jane', title: 'ETA shared with Thabo Doe', time: '6:58 AM', unread: false, goto: null },
  { id: 3, group: 'Yesterday', icon: 'confirm', child: 'jane', title: 'Jane dropped off at Oak Street', time: '3:14 PM', unread: false, goto: { tab: 'history' } },
  { id: 4, group: 'Yesterday', icon: 'info', child: 'jane', title: "Jane's exam-day pickup adjusted to 11:30", time: 'For Sep 10', unread: true, goto: { tab: 'schedule', date: '2026-09-10' } },
  { id: 5, group: 'Yesterday', icon: 'info', child: 'liam', title: "Liam's spelling test pickup set for 12:00", time: 'For Sep 14', unread: true, goto: { tab: 'schedule', date: '2026-09-14' } },
  { id: 6, group: 'Earlier', icon: 'info', child: 'liam', title: "Liam's route now driven by Ms. Dlamini", time: 'Sep 8', unread: false, goto: null },
];

export const NOTIFICATION_GROUPS: NotificationGroup[] = ['Today', 'Yesterday', 'Earlier'];

/** Preferences on the Notifications screen, with the decided defaults (docs/product-spec.md). */
export const notificationPrefs = [
  { id: 'pickup', label: 'Pickup & drop-off updates', on: true },
  { id: 'exam', label: 'Exam-day changes', on: true },
  { id: 'route', label: 'Route or driver changes', on: true },
  { id: 'share', label: 'Shared ETA activity', on: false },
] as const;
