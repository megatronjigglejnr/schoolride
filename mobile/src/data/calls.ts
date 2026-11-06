// Ported from callData and callPrefs in app/app.js.
import type { CallInfo, CallPrefs, ChildKey, Contact } from './types';

export const callData: Record<ChildKey, CallInfo> = {
  jane: {
    driver: { initial: 'N', name: 'Mr. Naidoo', role: 'Driving Route 4', phone: '+27825550104' },
    contacts: [
      { id: 'gradeHead', initial: 'P', name: 'Ms. Patel', role: 'Grade 4 head', phone: '+27115550142' },
      { id: 'register', initial: 'C', name: 'Mr. Coetzee', role: 'Register teacher', phone: '+27115550143' },
    ],
  },
  liam: {
    driver: { initial: 'D', name: 'Ms. Dlamini', role: 'Driving Route 1', phone: '+27825550111' },
    contacts: [
      { id: 'gradeHead', initial: 'K', name: 'Mr. Khumalo', role: 'Grade 2 head', phone: '+27125550171' },
      { id: 'register', initial: 'W', name: 'Ms. Williams', role: 'Register teacher', phone: '+27125550172' },
    ],
  },
};

/** Every school contact listed by default, for each child. */
export const defaultCallPrefs: Record<ChildKey, CallPrefs> = {
  jane: { gradeHead: true, register: true },
  liam: { gradeHead: true, register: true },
};

/**
 * "Running late?" on an exam day: the register teacher first, the grade head as fallback,
 * nobody if the parent hid both (CLAUDE.md, "Calls").
 */
export function lateContact(contacts: Contact[], prefs: CallPrefs): Contact | null {
  return (
    contacts.find((c) => c.id === 'register' && prefs.register) ??
    contacts.find((c) => c.id === 'gradeHead' && prefs.gradeHead) ??
    null
  );
}
