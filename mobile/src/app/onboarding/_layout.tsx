// Onboarding: welcome, phone, code, confirm, notifications, and the terms. A stack, so system back works between
// steps; the toast is drawn here too ("Code resent").
import { Stack } from 'expo-router';
import { View } from 'react-native';

import { Toast } from '@/components/shell/Toast';
import { color } from '@/theme/tokens';

export default function OnboardingLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: color.canvas }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.canvas } }}>
        <Stack.Screen name="index" options={{ contentStyle: { backgroundColor: color.accent } }} />
      </Stack>
      <Toast />
    </View>
  );
}
