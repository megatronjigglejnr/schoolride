// Notifications soft-ask (#ob-permission): why, then "Enable" or "Not now". Either way the app opens.
// The system prompt itself comes with push notifications (not installed yet); for now this confirms with a toast.
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Step, stepText } from '@/components/onboarding/Step';
import { Press } from '@/components/Press';
import { useOnboarding } from '@/state/OnboardingContext';
import { useShell } from '@/state/ShellContext';
import { color } from '@/theme/tokens';
import { font } from '@/theme/type';

export default function Permission() {
  const { finish } = useOnboarding();
  const { showToast } = useShell();

  const enable = () => {
    showToast('Notifications enabled');
    setTimeout(finish, 500);
  };

  return (
    <Step
      actions={
        <>
          <Button label="Enable notifications" onPress={enable} />
          <Press
            accessibilityRole="button"
            accessibilityLabel="Not now"
            onPress={finish}
            pressScale={0}
            style={styles.later}>
            <Text style={styles.laterText}>Not now</Text>
          </Press>
        </>
      }>
      <View style={styles.center}>
        <View style={styles.mark}>
          <Icon name="bell" size={26} />
        </View>
        <Text accessibilityRole="header" style={styles.title}>
          Stay ahead of pickup time
        </Text>
        <Text style={[stepText.sub, styles.sub]}>
          Get notified when the ride is close, when your child is dropped off, and if an exam day changes the schedule.
        </Text>
      </View>
    </Step>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  mark: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: color.surfaceFlat,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: { ...font(900), fontSize: 20, color: color.ink, textAlign: 'center' },
  sub: { textAlign: 'center', maxWidth: 260 },
  later: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  laterText: { ...font(400), fontSize: 12, color: color.muted, textDecorationLine: 'underline' },
});
