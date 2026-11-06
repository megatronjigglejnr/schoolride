// The parent's account (Account in app/index.html): their profile, the co-guardian the school linked, trusted
// family friends, and the terms. Privacy rule: friends are the parent's own contacts, never linked to a child.
import { guardian } from './children';

export type Profile = { name: string; phone: string; email: string };
export const initialProfile: Profile = { name: guardian.name, phone: guardian.phone, email: guardian.email };

/** The other guardian the school linked to both children; they set their own photo. */
export const coGuardian = { name: 'Thabo Doe' };

export const RELATIONS = ['Grandparent', 'Relative', 'Neighbour', 'Friend'] as const;
export type Relation = (typeof RELATIONS)[number];
export type Friend = { id: string; name: string; phone: string; relation: Relation };
export const initialFriends: Friend[] = [
  { id: '1', name: 'Naledi Mokoena', phone: '+27 83 555 0198', relation: 'Neighbour' },
];

export const TERMS_UPDATED = 'Last updated 3 November 2026';
export const TERMS_DRAFT =
  "Draft for the prototype. The final text comes from the school network's legal team before release.";
export const terms: { title: string; body: string }[] = [
  {
    title: '1. Who provides SchoolRide',
    body: "Your child's school licenses SchoolRide and runs its transport. We provide the app that shows you that transport.",
  },
  {
    title: '2. Who can use it',
    body: "Guardians the school has verified. The school links each guardian to their children; you can't link a child yourself.",
  },
  {
    title: '3. What you see',
    body: "Only your own children's rides: the bus's position, ETAs, pickups and drop-offs, and exam-day changes. Other children on a route appear only as a number of stops.",
  },
  {
    title: '4. Sharing',
    body: "You can share a ride's live ETA with your co-guardian or a trusted family friend. A share lasts for that day only. Collecting a child still needs the school's approval.",
  },
  {
    title: '5. Your data',
    body: "We keep your name, phone number, email, linked children, ride history and settings to run the service. We don't use your phone's location. You can request a copy of your data at any time under Account, Privacy.",
  },
  {
    title: '6. Times are estimates',
    body: "ETAs depend on traffic and the bus's signal. Always follow the school's instructions on the day.",
  },
  { title: '7. Changes', body: "If these terms change, we'll tell you in the app before the change takes effect." },
];

/** Account's sub-screens (the routes under /profile), by path segment, with the title the header shows. */
export const SUB_TITLES: Record<string, string> = {
  personal: 'Personal info',
  family: 'Family',
  privacy: 'Privacy',
  security: 'Login & security',
  terms: 'Terms & conditions',
};
