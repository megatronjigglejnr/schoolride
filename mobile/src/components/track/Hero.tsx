/**
 * Track's hero (renderTrack's status card in the prototype). It answers the screen's one question, "how long
 * until the ride reaches my child?", so the ETA is the largest thing in the app.
 *
 * Signal loss stays calm (CLAUDE.md): the hero turns grey with "Last seen X min ago". From 5 minutes the chip
 * turns red and a direct "Call [driver] to check in" button appears.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Enter } from '@/components/Enter';
import { Press } from '@/components/Press';
import { HEADER_ROOM } from '@/components/shell/Screen';
import { callData } from '@/data/calls';
import { LOST_ALERT_MIN, trackData } from '@/data/track';
import { placeCall } from '@/lib/calls';
import { useChild } from '@/state/ChildContext';
import { useShell } from '@/state/ShellContext';
import { color } from '@/theme/tokens';
import { font, tracking } from '@/theme/type';

export function Hero() {
  const { activeChild, signal } = useChild();
  const { showToast } = useShell();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const reduce = useReducedMotion();
  const short = height < 700;

  const d = trackData[activeChild];
  const driver = callData[activeChild].driver;
  const { lost, lostMinutes } = signal;
  const alertTier = lost && lostMinutes >= LOST_ALERT_MIN;

  // .eta-num: clamp(112px, 38vw, 160px), or clamp(88px, 30vw, 120px) on short screens.
  const numSize = short ? Math.min(120, Math.max(88, width * 0.3)) : Math.min(160, Math.max(112, width * 0.38));
  const unitSize = short ? 24 : 30;

  // The grey of a lost signal fades over the marigold rather than snapping.
  const grey = useSharedValue(lost ? 1 : 0);
  useEffect(() => {
    grey.value = withTiming(lost ? 1 : 0, { duration: reduce ? 0 : 400 });
  }, [lost, reduce, grey]);
  const greyStyle = useAnimatedStyle(() => ({ opacity: grey.value }));

  // The live dot pulses while tracking; it rests when the signal is lost.
  const dot = useSharedValue(1);
  useEffect(() => {
    dot.value = !lost && !reduce ? withRepeat(withTiming(0.4, { duration: 800 }), -1, true) : 1;
  }, [lost, reduce, dot]);
  const dotStyle = useAnimatedStyle(() => ({
    opacity: lost ? 0.6 : dot.value,
  }));

  const value = lost ? lostMinutes : d.etaMin;
  const unit = lost ? 'min ago' : 'min';
  const summary = lost
    ? `Signal lost. Last seen ${lostMinutes} minutes ago near ${d.dest}${alertTier ? '' : ', still tracking'}.`
    : `On the way. ${d.etaMin} minutes away. Next stop: ${d.dest}.`;

  return (
    <View
      style={[
        styles.hero,
        {
          marginTop: -(Math.max(16, insets.top) + HEADER_ROOM),
          paddingTop: Math.max(16, insets.top) + HEADER_ROOM - 2,
          paddingBottom: short ? 98 : 112,
        },
      ]}>
      <LinearGradient
        style={StyleSheet.absoluteFill}
        colors={[color.accentLight, color.accent, color.accentDeep]}
        locations={[0, 0.55, 1]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.lost, greyStyle]} />

      {/* Switching child cross-fades the reading, so the new ETA is clearly a different ride. */}
      <Enter index={0}>
        <Animated.View key={activeChild} entering={FadeIn.duration(220)}>
          <View accessible accessibilityRole="text" accessibilityLabel={summary} accessibilityLiveRegion="polite">
            <View style={[styles.chip, alertTier && styles.chipAlert]}>
              <Animated.View style={[styles.chipDot, dotStyle]} />
              <Text style={styles.chipText}>{lost ? 'Signal lost' : 'On the way'}</Text>
            </View>

            <View style={[styles.etaRow, short && styles.etaRowShort]}>
              <Text
                style={[styles.etaNum, { fontSize: numSize, lineHeight: numSize * 0.8 }, tracking(-0.055, numSize)]}>
                {value}
              </Text>
              <Text style={[styles.etaUnit, { fontSize: unitSize }, tracking(-0.02, unitSize)]}>{unit}</Text>
            </View>

            <Text style={styles.next}>
              {lost ? 'Last seen near ' : 'Next stop: '}
              <Text style={styles.nextStrong}>{d.dest}</Text>
              {lost && !alertTier ? ', still tracking' : ''}
            </Text>
          </View>

          {alertTier && (
            <Press
              accessibilityRole="button"
              accessibilityLabel={`Call ${driver.name} to check in`}
              onPress={() => placeCall(driver.phone, driver.name, showToast)}
              style={styles.lostAction}>
              <Text style={styles.lostActionText}>Call {driver.name} to check in</Text>
            </Press>
          )}
        </Animated.View>
      </Enter>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { marginHorizontal: -18, paddingHorizontal: 20, overflow: 'hidden' },
  lost: { backgroundColor: color.heroLost },
  chip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: color.ink,
    borderRadius: 999,
    paddingVertical: 7,
    paddingLeft: 12,
    paddingRight: 14,
  },
  chipAlert: { backgroundColor: color.alert },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: color.onInk,
  },
  chipText: {
    ...font(800),
    fontSize: 13,
    color: color.onInk,
    letterSpacing: 0.13,
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginTop: 16,
    marginBottom: 8,
  },
  etaRowShort: { marginTop: 12, marginBottom: 6 },
  etaNum: {
    ...font(900),
    color: color.ink,
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
  },
  etaUnit: { ...font(800), color: color.ink },
  next: { ...font(600), fontSize: 18, color: color.ink },
  nextStrong: { ...font(900) },
  lostAction: {
    marginTop: 18,
    minHeight: 48,
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 14,
    backgroundColor: color.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lostActionText: { ...font(800), fontSize: 15, color: color.onInk },
});
