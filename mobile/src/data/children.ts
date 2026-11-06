// Linked children and the guardian, from the static markup in app/index.html
// (onboarding confirm, Personal details, full-map cards). Privacy rule: only the parent's own children live here.
import type { Child, ChildKey, Guardian } from './types';

export const children: Record<ChildKey, Child> = {
  jane: {
    key: 'jane',
    firstName: 'Jane',
    fullName: 'Jane Doe',
    school: 'Riverside Primary',
    grade: 'Grade 4',
    avatar: 'ink',
    routeName: 'Route 4 · Mr. Naidoo',
    pickupArea: 'Oak Street',
  },
  liam: {
    key: 'liam',
    firstName: 'Liam',
    fullName: 'Liam Doe',
    school: 'Northgate Academy',
    grade: 'Grade 2',
    avatar: 'muted',
    routeName: 'Route 1 · Ms. Dlamini',
    pickupArea: 'Birch Close',
  },
};

export const guardian: Guardian = {
  name: 'Sarah Doe',
  initials: 'SD',
  phone: '+27 82 555 0142',
  email: 'sarah.doe@email.com',
};
