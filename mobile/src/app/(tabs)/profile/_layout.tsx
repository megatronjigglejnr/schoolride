// Account and its sub-screens, a stack inside the Account tab. The shell's header shows the back button and the
// sub-screen's title over every screen here except the Account list itself.
import { Stack } from 'expo-router';

import { color } from '@/theme/tokens';

export default function AccountStack() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.canvas } }} />;
}
