// Type scale: the text styles the prototype repeats across screens (app/styles.css).
// One-off display sizes (the hero ETA numeral, the welcome wordmark, the exam pickup time) stay with their screens.
import type { TextStyle } from 'react-native';

import { color } from './tokens';
import { font, tracking } from './type';

const style = (s: TextStyle) => s;

export const text = {
  /** .page-title: Schedule, History, Account */
  pageTitle: style({ ...font(900), fontSize: 34, lineHeight: 36, color: color.ink, ...tracking(-0.03, 34) }),
  /** .sheet-header h3 */
  sheetTitle: style({ ...font(900), fontSize: 22, color: color.ink, ...tracking(-0.02, 22) }),
  /** .route-head h3, .onboard-title */
  sectionTitle: style({ ...font(900), fontSize: 20, color: color.ink, ...tracking(-0.02, 20) }),
  /** .profile-name */
  nameLarge: style({ ...font(900), fontSize: 18, color: color.ink }),
  /** .cal-month-label */
  monthLabel: style({ ...font(900), fontSize: 17, color: color.ink }),
  /** .panel h2 */
  cardTitle: style({ ...font(900), fontSize: 16, color: color.ink }),
  /** .btn-primary */
  button: style({ ...font(900), fontSize: 15, color: color.ink }),
  /** .cr-name */
  rowTitle: style({ ...font(800), fontSize: 15, color: color.ink }),
  /** .row-label */
  rowLabel: style({ ...font(700), fontSize: 13.5, color: color.ink }),
  /** .contact-name, .notif-title */
  itemTitle: style({ ...font(700), fontSize: 13, color: color.ink }),
  /** .onboard-sub, .cr-role */
  body: style({ ...font(600), fontSize: 13, lineHeight: 19.5, color: color.muted }),
  /** .contact-role, .notif-time, .sheet-hint, .panel .hint: the 12px floor for informational text */
  caption: style({ ...font(400), fontSize: 12, lineHeight: 18, color: color.muted }),
  /** .field label, .section-label */
  label: style({ ...font(700), fontSize: 12, color: color.muted }),
} as const;
