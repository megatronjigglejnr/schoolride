// The switch's look (.switch in the prototype): a 42x24 track, ink when on, with a sliding knob.
// It is only the visual; the control around it carries role="switch", its label and its state.
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { alpha, color, rgb } from '@/theme/tokens';

export function SwitchTrack({ on }: { on: boolean }) {
  const reduce = useReducedMotion();
  const x = useSharedValue(on ? 18 : 0);
  useEffect(() => {
    x.value = reduce ? (on ? 18 : 0) : withTiming(on ? 18 : 0, { duration: 200 });
  }, [on, reduce, x]);
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <View style={[styles.track, on && styles.trackOn]}>
      <Animated.View style={[styles.knob, on && styles.knobOn, knob]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: 42, height: 24, borderRadius: 20, borderWidth: 1.5, borderColor: color.fieldLine, backgroundColor: color.line },
  trackOn: { backgroundColor: color.ink, borderColor: color.ink },
  knob: {
    position: 'absolute',
    top: 1.5,
    left: 1.5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: color.card,
    boxShadow: `0 1px 3px ${alpha(rgb.ink, 0.3)}`,
  },
  knobOn: { backgroundColor: color.onInk },
});
