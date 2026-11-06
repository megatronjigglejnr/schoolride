// Welcome (#ob-welcome): the bus and the wordmark on marigold, the same frame the start-up animation fades into.
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Bus } from '@/components/Bus';
import { Button } from '@/components/Button';
import { Enter } from '@/components/Enter';
import { Press } from '@/components/Press';
import { DEMO_CONTROLS } from '@/lib/demo';
import { useOnboarding } from '@/state/OnboardingContext';
import { color } from '@/theme/tokens';
import { font, tracking } from '@/theme/type';

export default function Welcome() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { finish } = useOnboarding();
  const reduce = useReducedMotion();
  const bob = useSharedValue(0);
  const word = Math.min(58, Math.max(36, width * 0.125));

  useEffect(() => {
    if (reduce) return;
    bob.value = withRepeat(
      withSequence(
        withTiming(-1.5, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
  }, [reduce, bob]);
  const bobStyle = useAnimatedStyle(() => ({ transform: [{ translateY: bob.value }] }));

  return (
    <View style={styles.root}>
      <LinearGradient
        style={StyleSheet.absoluteFill}
        colors={[color.accentLight, color.accent, color.accentDeep]}
        locations={[0, 0.55, 1]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <View
        style={[styles.content, { paddingTop: Math.max(28, insets.top), paddingBottom: Math.max(24, insets.bottom) }]}>
        <Enter index={0} style={styles.center}>
          <Animated.View
            style={[styles.bus, bobStyle]}
            accessible={false}
            importantForAccessibility="no-hide-descendants">
            <Bus width={width < 340 ? 140 : 176} windows={color.canvas} />
          </Animated.View>
          <Text
            accessibilityRole="header"
            style={[styles.word, { fontSize: word, lineHeight: word * 0.95 }, tracking(-0.05, word)]}>
            SchoolRide
          </Text>
          <Text style={styles.sub}>{"See your child's ride, live — the moment it matters."}</Text>
        </Enter>
        <Enter index={1}>
          <Button label="Get started" tone="dark" onPress={() => router.push('/onboarding/phone')} />
          {DEMO_CONTROLS && (
            <Press
              accessibilityRole="button"
              accessibilityLabel="Skip onboarding (demo control)"
              onPress={finish}
              pressScale={0}
              style={styles.skip}>
              <Text style={styles.skipText}>Skip onboarding (demo)</Text>
            </Press>
          )}
        </Enter>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.accent },
  content: { flex: 1, paddingHorizontal: 26 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'flex-start', gap: 10 },
  bus: { marginBottom: 14 },
  word: { ...font(900), color: color.ink },
  sub: { ...font(600), fontSize: 17, lineHeight: 25, color: color.ink, maxWidth: 270 },
  skip: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  skipText: { ...font(400), fontSize: 12, color: color.ink, textDecorationLine: 'underline' },
});
