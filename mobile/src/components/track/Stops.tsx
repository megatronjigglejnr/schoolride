// The route as a transit line (renderTrack's .stops): passed stops solid, the next stop ringed with the
// child's initial and a slow pulse, later stops quiet and joined by a dotted line.
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Line } from 'react-native-svg';

import type { Stop } from '@/data/types';
import { color } from '@/theme/tokens';
import { font } from '@/theme/type';

const LINE_Y = 22;

const spoken = { done: 'passed', next: 'next stop', todo: 'later' } as const;

export function Stops({ stops, initial, calm }: { stops: Stop[]; initial: string; calm: boolean }) {
  const [width, setWidth] = useState(0);
  const step = stops.length ? width / stops.length : 0;

  return (
    <View role="list" accessibilityLabel="Today's stops" style={styles.row} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width={width} height={44}>
          {stops.slice(1).map((s, i) => {
            const x1 = step * (i + 0.5);
            const x2 = step * (i + 1.5);
            const solid = s.state !== 'todo';
            return (
              <Line
                key={i}
                x1={x1}
                x2={x2}
                y1={LINE_Y}
                y2={LINE_Y}
                stroke={solid ? color.ink : color.strokeQuiet}
                strokeWidth={3.5}
                strokeLinecap="round"
                strokeDasharray={solid ? undefined : '0.1 7'}
              />
            );
          })}
        </Svg>
      )}
      {stops.map((s) => (
        <View key={s.name} role="listitem" accessible accessibilityLabel={`${s.name}, ${spoken[s.state]}`} style={styles.stop}>
          <View style={styles.nodeWrap}>
            {s.state === 'next' ? <NextNode initial={initial} calm={calm} /> : <View style={[styles.node, s.state === 'done' && styles.nodeDone]} />}
          </View>
          <Text numberOfLines={2} style={[styles.label, s.state === 'done' && styles.labelDone, s.state === 'next' && styles.labelNext]}>
            {s.name}
          </Text>
        </View>
      ))}
    </View>
  );
}

function NextNode({ initial, calm }: { initial: string; calm: boolean }) {
  const reduce = useReducedMotion();
  const t = useSharedValue(0);
  const pulse = !reduce && !calm;
  useEffect(() => {
    t.value = 0;
    if (pulse) t.value = withRepeat(withTiming(1, { duration: 2000, easing: Easing.out(Easing.quad) }), -1);
  }, [pulse, t]);
  // ringPulse in the prototype grows to 1.7x and sweeps across the stop's name; 1.3x keeps the pulse clear of
  // the label so it stays readable. Transform and opacity only.
  const ring = useAnimatedStyle(() => ({ opacity: pulse ? 0.75 * (1 - t.value) : 0, transform: [{ scale: 1 + 0.3 * t.value }] }));
  return (
    <View style={styles.next}>
      <Animated.View pointerEvents="none" style={[styles.ring, ring]} />
      <Text style={styles.nextText}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginBottom: 20 },
  stop: { flex: 1, minWidth: 0, alignItems: 'center' },
  nodeWrap: { height: 44, alignItems: 'center', justifyContent: 'center' },
  node: { width: 14, height: 14, borderRadius: 7, backgroundColor: color.card, borderWidth: 3, borderColor: color.strokeQuiet },
  nodeDone: { backgroundColor: color.ink, borderColor: color.ink },
  next: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: color.card,
    borderWidth: 4,
    borderColor: color.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: { position: 'absolute', top: -8, left: -8, right: -8, bottom: -8, borderRadius: 24, borderWidth: 3, borderColor: color.ink },
  nextText: { ...font(900), fontSize: 16, color: color.ink },
  label: { ...font(600), fontSize: 12, lineHeight: 14, color: color.muted, textAlign: 'center', marginTop: 6, paddingHorizontal: 2 },
  labelDone: { ...font(700), color: color.ink },
  labelNext: { ...font(900), color: color.ink },
});
