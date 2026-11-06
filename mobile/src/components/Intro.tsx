/**
 * Start-up (the prototype's .intro): it begins on the native splash's frame, the bus on marigold, so nothing
 * jumps when JavaScript takes over. Then the bus starts up and speeds off, and the field fades into the first
 * screen: the marigold welcome, or Track (also marigold).
 *
 * One timeline (ms), the same as app/styles.css:
 * - wordmark rises in 120–500;
 * - engine start 450–1050: a shiver that settles to an idle, with three exhaust puffs;
 * - it rocks back on the rear wheel, nose up, 1050–1250;
 * - it speeds off 1250–1850 with a big puff and speed lines; the wordmark lifts out 1150–1410;
 * - the field fades 1850–2150, and the first screen's entrances start as it does.
 * It runs once per launch, so it may be expressive, but it stays near 2s: the parent came for the ETA.
 * Reduce Motion: it is decorative, so it is skipped and the app shows at once.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { Bus } from '@/components/Bus';
import { useIntro } from '@/state/IntroContext';
import { alpha, color, rgb } from '@/theme/tokens';
import { font, tracking } from '@/theme/type';

const arrive = Easing.bezierFn(0.16, 1, 0.3, 1);
const depart = Easing.bezierFn(0.55, 0, 1, 0.45);
const leave = Easing.bezierFn(0.4, 0, 1, 1);
const settle = Easing.bezierFn(0.4, 0, 0.2, 1);

const RUMBLE = 450;
const BACK = 1050;
const GO = 1250;
const FADE = 1850;
const END = 2150;

const BUS_W = 176;
const BUS_H = 80;
/** The tailpipe, at the bus's rear bumper. */
const PIPE = { x: -6, y: 52 };

function seg(t: number, start: number, dur: number) {
  'worklet';
  return Math.min(1, Math.max(0, (t - start) / dur));
}

export function Intro() {
  const { introDone, finishIntro } = useIntro();
  const reduce = useReducedMotion();
  const { width } = useWindowDimensions();
  const [gone, setGone] = useState(false);
  const t = useSharedValue(0);

  useEffect(() => {
    if (reduce) {
      finishIntro();
      return;
    }
    t.value = withTiming(END, { duration: END, easing: Easing.linear });
    // The pages' entrances start as the field begins to fade, so the hand-off overlaps.
    const handOff = setTimeout(finishIntro, FADE);
    const end = setTimeout(() => setGone(true), END);
    return () => {
      clearTimeout(handOff);
      clearTimeout(end);
    };
    // Runs once per launch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  const wordStyle = useAnimatedStyle(() => {
    const inP = arrive(seg(t.value, 120, 380));
    const outP = leave(seg(t.value, 1150, 260));
    return { opacity: inP * (1 - outP), transform: [{ translateY: (1 - inP) * 10 - outP * 6 }] };
  });
  // The car moves: back a touch as it gathers itself, then away, accelerating.
  const carStyle = useAnimatedStyle(() => {
    const back = arrive(seg(t.value, BACK, GO - BACK));
    const go = depart(seg(t.value, GO, FADE - GO));
    return { transform: [{ translateX: -10 * back + go * (width / 2 + BUS_W + 60) }] };
  });
  // The bus inside it shivers as the engine starts, then lifts its nose as it pulls away.
  const busStyle = useAnimatedStyle(() => {
    const r = seg(t.value, RUMBLE, BACK - RUMBLE);
    const shiver = r > 0 && r < 1 ? Math.sin(r * Math.PI * 2 * 9) * 1.5 * (1 - r * 0.6) : 0;
    const lift = arrive(seg(t.value, BACK, 200)) * (1 - settle(seg(t.value, GO, 250)));
    return { transform: [{ translateY: shiver }, { rotate: `${-3 * lift}deg` }] };
  });
  const linesStyle = useAnimatedStyle(() => {
    const grow = seg(t.value, GO, 150);
    return { opacity: grow * (1 - seg(t.value, GO + 420, 180)), transform: [{ scaleX: grow }] };
  });
  const fieldStyle = useAnimatedStyle(() => ({ opacity: 1 - leave(seg(t.value, FADE, END - FADE)) }));

  if (gone || (introDone && reduce)) return null;

  return (
    <Animated.View
      pointerEvents={introDone ? 'none' : 'auto'}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[StyleSheet.absoluteFill, styles.layer, fieldStyle]}>
      <LinearGradient
        style={StyleSheet.absoluteFill}
        colors={[color.accentLight, color.accent, color.accentDeep]}
        locations={[0, 0.55, 1]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <View style={styles.busBox}>
        {/* Puffs stay where they were blown out; the car drives away from them. */}
        <Puff t={t} start={520} size={16} />
        <Puff t={t} start={760} size={16} />
        <Puff t={t} start={980} size={16} />
        <Puff t={t} start={GO} size={24} big />
        <Animated.View testID="intro-car" style={[StyleSheet.absoluteFill, carStyle]}>
          <Animated.View style={[styles.lines, linesStyle]}>
            <View style={[styles.line, { width: 46 }]} />
            <View style={[styles.line, { width: 70 }]} />
            <View style={[styles.line, { width: 38 }]} />
          </Animated.View>
          {/* Rocks on the rear wheel. */}
          <Animated.View testID="intro-bus" style={[{ transformOrigin: '23% 83%' }, busStyle]}>
            <Bus width={BUS_W} />
          </Animated.View>
        </Animated.View>
      </View>
      <Animated.Text style={[styles.word, wordStyle]}>SchoolRide</Animated.Text>
    </Animated.View>
  );
}

/** A puff of exhaust: it grows, drifts back and up, and fades. */
function Puff({ t, start, size, big }: { t: SharedValue<number>; start: number; size: number; big?: boolean }) {
  const style = useAnimatedStyle(() => {
    const p = arrive(seg(t.value, start, big ? 700 : 560));
    const shown = t.value >= start && p < 1;
    return {
      opacity: shown ? (big ? 0.85 : 0.75) * (1 - p) : 0,
      transform: [
        { translateX: -(big ? 46 : 28) * p },
        { translateY: -(big ? 10 : 8) * p },
        { scale: big ? 0.5 + 1.7 * p : 0.4 + 0.9 * p },
      ],
    };
  });
  const offset = big ? 6 : 0;
  return (
    <Animated.View
      style={[
        styles.puff,
        { width: size, height: size, borderRadius: size / 2, left: PIPE.x - offset, top: PIPE.y - offset },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  layer: { zIndex: 200, alignItems: 'center', justifyContent: 'center', gap: 14, overflow: 'hidden' },
  busBox: { width: BUS_W, height: BUS_H },
  puff: { position: 'absolute', backgroundColor: alpha(rgb.canvas, 0.85) },
  lines: {
    position: 'absolute',
    right: BUS_W + 10,
    top: 14,
    alignItems: 'flex-end',
    gap: 14,
    transformOrigin: 'right',
  },
  line: { height: 3, borderRadius: 2, backgroundColor: alpha(rgb.ink, 0.45) },
  word: { ...font(900), fontSize: 50, lineHeight: 50, color: color.ink, ...tracking(-0.05, 50) },
});
