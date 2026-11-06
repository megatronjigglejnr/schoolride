// The toast: an ink pill above the nav, rising in and fading out (.toast in the prototype).
import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useShell } from '@/state/ShellContext';
import { alpha, color, glass, rgb, shadow } from '@/theme/tokens';
import { font } from '@/theme/type';

export function Toast() {
  const { toast, toastVisible } = useShell();
  const insets = useSafeAreaInsets();
  const reduce = useReducedMotion();
  const shown = useSharedValue(0);
  useEffect(() => {
    shown.value = withTiming(toastVisible ? 1 : 0, { duration: toastVisible ? 250 : 180 });
  }, [toastVisible, shown]);

  const anim = useAnimatedStyle(() => ({
    opacity: shown.value,
    transform: [{ translateY: reduce ? 0 : (1 - shown.value) * 10 }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
      style={[styles.wrap, { bottom: 112 + insets.bottom }, anim]}>
      <Text style={styles.text} numberOfLines={2}>
        {toast}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    alignSelf: 'center',
    maxWidth: '86%',
    zIndex: 60,
    backgroundColor: alpha(rgb.ink, 0.92),
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 16,
    boxShadow: `${shadow.float}, ${glass.highlight}`,
  },
  text: { ...font(700), fontSize: 12, color: color.onInk, textAlign: 'center' },
});
