// Calls are real tel: links. With DEMO_CALLS on, the app shows "Calling …" instead of leaving to dial,
// like placeCall in the prototype.
import { Linking } from 'react-native';

import { DEMO_CALLS } from './demo';

export function placeCall(phone: string, name: string, showToast: (m: string) => void) {
  if (DEMO_CALLS) {
    showToast('Calling ' + name + '…');
    return;
  }
  Linking.openURL('tel:' + phone).catch(() => showToast("Couldn't start the call. Dial " + phone + '.'));
}
