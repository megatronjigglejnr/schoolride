/**
 * A page block's entrance (the prototype's .entering): each time its tab comes into view, it rises 10px and
 * fades in over 300ms, 40ms after the block before it (capped at 120ms). Tab changes happen many times a day, so
 * it stays quiet: ease-out, no bounce, transform and opacity only. Off-screen, the block resets, so the next
 * visit plays it again. It waits for the start-up animation, so the first screen enters as the intro hands off.
 * Reduce Motion: it is decorative, so blocks just appear.
 */
import { useIsFocused } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { useIntro } from '@/state/IntroContext';

const arrive = Easing.bezier(0.16, 1, 0.3, 1);

type Props = {
  index?: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** How far it rises, in pt. The Track sheet slides up further over the hero. */
  distance?: number;
  /** False for blocks that should only slide (the white sheet over the marigold hero). */
  fade?: boolean;
  duration?: number;
  delay?: number;
};

export function Enter({ index = 0, children, style, distance = 10, fade = true, duration = 300, delay = 0 }: Props) {
  const focused = useIsFocused();
  const { introDone } = useIntro();
  const reduce = useReducedMotion();
  const p = useSharedValue(reduce ? 1 : 0);

  useEffect(() => {
    if (reduce) {
      p.value = 1;
      return;
    }
    if (!focused) {
      p.value = 0; // hidden while away, so the next visit enters again
      return;
    }
    if (introDone) p.value = withDelay(delay + Math.min(index, 3) * 40, withTiming(1, { duration, easing: arrive }));
  }, [focused, introDone, reduce, index, delay, duration, p]);

  const anim = useAnimatedStyle(() => ({
    opacity: fade ? p.value : 1,
    transform: [{ translateY: (1 - p.value) * distance }],
  }));

  return <Animated.View style={[style, anim]}>{children}</Animated.View>;
}
