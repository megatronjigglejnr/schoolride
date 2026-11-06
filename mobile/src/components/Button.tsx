// The full-width button (.btn-primary): marigold for the one main action on a screen, ink (.dark) for a secondary
// one, and a flat "done" look once an action can't be repeated.
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { Press } from '@/components/Press';
import { text } from '@/theme/text';
import { alpha, color, rgb } from '@/theme/tokens';

type Props = { label: string; onPress: () => void; tone?: 'primary' | 'dark' | 'done'; accessibilityLabel?: string };

export function Button({ label, onPress, tone = 'primary', accessibilityLabel }: Props) {
  const done = tone === 'done';
  return (
    <Press
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={done ? { disabled: true } : undefined}
      onPress={done ? undefined : onPress}
      pressScale={done ? 0 : 0.98}
      style={[styles.btn, tone === 'primary' && styles.primary, tone === 'dark' && styles.dark, done && styles.done]}>
      {tone === 'primary' && (
        <View style={styles.clip} pointerEvents="none">
          <LinearGradient style={StyleSheet.absoluteFill} colors={[color.accentLight, color.accent]} />
        </View>
      )}
      <Text style={[text.button, tone === 'dark' && styles.darkText]}>{label}</Text>
    </Press>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginTop: 4,
  },
  clip: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 16, overflow: 'hidden' },
  primary: {
    backgroundColor: color.accent,
    boxShadow: `0 1px 1px ${alpha(rgb.ink, 0.1)}, 0 8px 18px -10px ${alpha(rgb.ink, 0.35)}, inset 0 1px 0 ${alpha(rgb.glint, 0.5)}`,
  },
  dark: {
    backgroundColor: color.ink,
    boxShadow: `0 1px 1px ${alpha(rgb.ink, 0.2)}, 0 10px 22px -12px ${alpha(rgb.ink, 0.6)}`,
  },
  darkText: { color: color.onInk },
  done: { backgroundColor: color.surfaceFlat },
});
