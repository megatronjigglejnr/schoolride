// Types for the mock data ported from app/app.js (and the static markup in app/index.html).

export type ChildKey = 'jane' | 'liam';
export const CHILD_KEYS: readonly ChildKey[] = ['jane', 'liam'];

export type StopState = 'done' | 'next' | 'todo';
export type Stop = { name: string; state: StopState };

export type Person = { initial: string; name: string; role: string };

export type Child = {
  key: ChildKey;
  firstName: string;
  fullName: string;
  school: string;
  grade: string;
  /** Avatar style: the first child gets the ink avatar, others the muted one (as in the prototype). */
  avatar: 'ink' | 'muted';
  routeName: string;
  pickupArea: string;
};

export type Track = {
  /** Header title on Track, e.g. "Jane's ride". */
  title: string;
  etaMin: number;
  /** Next stop, written out in full. */
  dest: string;
  /** e.g. "Stop 3 of 5". */
  progress: string;
  /** Route progress 0–100: places the bus on the sheet edge and fills the full-map card's bar. */
  fillPct: number;
  /** Approximate distance from the bus to the child's home, in km. Measured from home, not from the parent. */
  homeKm: number;
  driver: Person;
  route: Stop[];
};

export type ContactId = 'gradeHead' | 'register';
export type Contact = Person & { id: ContactId; phone: string };
export type CallInfo = { driver: Person & { phone: string }; contacts: Contact[] };
/** Which school contacts the parent chose to list. Never a barrier to calling. */
export type CallPrefs = Record<ContactId, boolean>;

export type ExamDay = { pickup: string; grouped: number; subject: string };
/** Keyed by ISO date, e.g. '2026-09-10'. */
export type ExamDays = Record<string, ExamDay>;

export type IconKind = 'move' | 'confirm' | 'info';
export type HistoryGroup = 'Yesterday' | 'Monday';
export type HistoryItem = { group: HistoryGroup; icon: IconKind; title: string; time: string };

/** Where a notification tap goes. The prototype stored this as a function; here it's data. */
export type NotificationTarget =
  | { tab: 'track' }
  | { tab: 'history' }
  | { tab: 'schedule'; date: string };

export type NotificationGroup = 'Today' | 'Yesterday' | 'Earlier';
export type Notification = {
  id: number;
  group: NotificationGroup;
  icon: IconKind;
  child: ChildKey;
  title: string;
  time: string;
  unread: boolean;
  goto: NotificationTarget | null;
};

export type Point = readonly [number, number];
export type MiniMapSpec = {
  /** One point per route stop, in the 350x196 view box. */
  pts: Point[];
  /** The bus sits on segment busSeg, at fraction busT along it. */
  busSeg: number;
  busT: number;
  roads: string[];
  /** [x, y, width, height] */
  blocks: (readonly [number, number, number, number])[];
};

/** Full-map overlay (320x570 view box starting at y = -125). */
export type RouteMap = {
  title: string;
  roads: string[];
  route: string;
  home: { at: Point; label: string; labelAt: Point };
  stop: { at: Point; label: string; labelAt: Point };
  school: { at: Point; letter: string; label: string; labelAt: Point };
  /** The bus's live position: the only marigold on the full map. */
  live: Point;
};

export type Guardian = { name: string; initials: string; phone: string; email: string };
