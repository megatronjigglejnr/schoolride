/**
 * The 6-digit code (.otp-row in the prototype). Typing moves to the next box, Backspace on an empty box goes back,
 * and pasting or SMS autofill of the whole code into any box fills all six.
 *
 * A right code plays the prototype's sequence on one timeline (ms):
 * - 0–1300: each box's ring draws in turn (110ms apart, 750ms each);
 * - 1380: the boxes fan into a deck; 1940: they straighten and slide into one spot, digits fading;
 * - 2400: five dissolve, the last pops (green) and the check draws; 3450: done.
 * Reduce Motion: straight to the last frame, then done after a short pause.
 * A wrong code shakes, clears and says so; the boxes stay usable.
 */
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { StyleSheet, TextInput, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';

import { alpha, color, rgb } from '@/theme/tokens';
import { font } from '@/theme/type';

const N = 6;
const GAP = 10;
export const OTP_TIMELINE = { STAGGER: 110, WRAP: 750, FAN: 1380, MERGE: 1940, SOLID: 2400, DONE: 3450 };
const { STAGGER, WRAP, FAN, MERGE, SOLID, DONE } = OTP_TIMELINE;

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const wrapEase = Easing.bezierFn(0.45, 0.05, 0.25, 1);
const deckEase = Easing.bezierFn(0.32, 0.72, 0, 1);
const popEase = Easing.bezierFn(0.34, 1.56, 0.64, 1);

function seg(t: number, start: number, dur: number) {
  'worklet';
  return Math.min(1, Math.max(0, (t - start) / dur));
}

type Props = {
  /** Called with all six digits. Return true for a right code. */
  check: (code: string) => boolean;
  /** After the success sequence. */
  onDone: () => void;
  onWrong: () => void;
  /** Called on any typing, so a message about a wrong code can clear. */
  onType: () => void;
};

export function OtpBoxes({ check, onDone, onWrong, onType }: Props) {
  const reduce = useReducedMotion();
  const [digits, setDigits] = useState<string[]>(Array(N).fill(''));
  const [busy, setBusy] = useState(false);
  const [merged, setMerged] = useState(false);
  const [solid, setSolid] = useState(false);
  const [width, setWidth] = useState(0);
  const inputs = useRef<(ComponentRef<typeof TextInput> | null)[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const t = useSharedValue(0);
  const shake = useSharedValue(0);

  useEffect(() => {
    const list = timers.current;
    return () => list.forEach(clearTimeout);
  }, []);
  // Focus the first box once the step has arrived.
  useEffect(() => {
    const id = setTimeout(() => inputs.current[0]?.focus(), 350);
    return () => clearTimeout(id);
  }, []);

  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));

  const submit = (code: string) => {
    if (check(code)) {
      setBusy(true);
      inputs.current.forEach((i) => i?.blur());
      if (reduce) {
        setMerged(true);
        setSolid(true);
        t.value = DONE;
        later(onDone, 900);
        return;
      }
      t.value = withTiming(DONE, { duration: DONE, easing: Easing.linear });
      later(() => setMerged(true), MERGE);
      later(() => setSolid(true), SOLID);
      later(onDone, DONE);
      return;
    }
    setBusy(true);
    onWrong();
    if (!reduce) {
      shake.value = withSequence(
        withTiming(-8, { duration: 80 }),
        withTiming(7, { duration: 80 }),
        withTiming(-5, { duration: 80 }),
        withTiming(4, { duration: 80 }),
        withTiming(0, { duration: 80 }),
      );
    }
    later(() => {
      setDigits(Array(N).fill(''));
      setBusy(false);
      inputs.current[0]?.focus();
    }, 420);
  };

  const onChange = (i: number, raw: string) => {
    if (busy) return;
    const d = raw.replace(/\D/g, '');
    onType();
    // A pasted or autofilled code fills all six from the first box.
    if (d.length > 1) {
      const next = Array(N)
        .fill('')
        .map((_, k) => d[k] ?? '');
      setDigits(next);
      const filled = Math.min(d.length, N);
      if (filled === N) submit(next.join(''));
      else inputs.current[filled]?.focus();
      return;
    }
    const next = [...digits];
    next[i] = d;
    setDigits(next);
    if (d && i < N - 1) inputs.current[i + 1]?.focus();
    if (next.every(Boolean)) submit(next.join(''));
  };

  const onKey = (i: number, key: string) => {
    if (key === 'Backspace' && !digits[i] && i > 0) {
      const next = [...digits];
      next[i - 1] = '';
      setDigits(next);
      inputs.current[i - 1]?.focus();
    }
  };

  const box = width ? (width - GAP * (N - 1)) / N : 0;
  const rowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  return (
    <View
      testID="otp-stage"
      style={styles.stage}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
      <Animated.View style={[styles.row, rowStyle]}>
        {box > 0 &&
          digits.map((d, i) => (
            <Box key={i} index={i} size={box} t={t} solid={solid}>
              <TextInput
                ref={(r) => {
                  inputs.current[i] = r;
                }}
                // Merged, the digits go: emptied rather than coloured transparent, which phones don't all honour.
                value={merged ? '' : d}
                onChangeText={(v) => onChange(i, v)}
                onKeyPress={(e) => onKey(i, e.nativeEvent.key)}
                editable={!busy}
                keyboardType="number-pad"
                inputMode="numeric"
                textContentType={i === 0 ? 'oneTimeCode' : 'none'}
                autoComplete={i === 0 ? 'sms-otp' : 'off'}
                accessibilityLabel={`Digit ${i + 1}`}
                selectTextOnFocus
                caretHidden
                style={[
                  styles.input,
                  { borderRadius: box * 0.22, fontSize: Math.round(box * 0.42) },
                  busy && !solid && styles.inputRinged,
                  merged && styles.inputMerged,
                  solid && i === N - 1 && styles.inputSolid,
                ]}
              />
            </Box>
          ))}
      </Animated.View>
      {box > 0 && <Check t={t} shown={solid} />}
    </View>
  );
}

/** One box: its ring, and where it sits in the deck and the merge. */
function Box({
  index: i,
  size: w,
  t,
  solid,
  children,
}: {
  index: number;
  size: number;
  t: SharedValue<number>;
  solid: boolean;
  children: React.ReactNode;
}) {
  const last = i === N - 1;
  const k = (N - 1) / 2 - i; // 2.5 for the first box, -2.5 for the last: everything meets in the middle
  const ringSize = w + 4;
  const r = w * 0.22 + 2;
  const perimeter = 4 * (ringSize - 2 * r) + 2 * Math.PI * r;

  const deck = useAnimatedStyle(() => {
    const fan = deckEase(seg(t.value, FAN, 500));
    const merge = deckEase(seg(t.value, MERGE, 450));
    const spread = 1 - merge;
    return {
      opacity: last ? 1 : 1 - seg(t.value, SOLID, 180),
      transform: [
        { translateX: k * ((0.82 * w + GAP) * fan * spread + (w + GAP) * merge) },
        { rotate: `${(-14 + 5.6 * i) * fan * spread}deg` },
        { scale: 1 - 0.1 * fan * spread },
      ],
    };
  });
  const pop = useAnimatedStyle(() => ({
    transform: [{ scale: last ? 1 + 0.38 * popEase(seg(t.value, SOLID, 420)) : 1 }],
  }));
  const ring = useAnimatedProps(() => {
    const p = wrapEase(seg(t.value, i * STAGGER, WRAP));
    return { strokeDashoffset: perimeter * (1 - p), opacity: p > 0 ? 1 : 0 };
  });

  return (
    <Animated.View style={[{ width: w, height: w, zIndex: i + 1, transformOrigin: '50% 150%' }, deck]}>
      <Animated.View style={[StyleSheet.absoluteFill, pop]}>
        {children}
        <Svg pointerEvents="none" width={ringSize} height={ringSize} style={styles.ring}>
          <AnimatedRect
            x={2}
            y={2}
            width={ringSize - 4}
            height={ringSize - 4}
            rx={r - 2}
            fill="none"
            stroke={solid && last ? color.green : color.ink}
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeDasharray={perimeter}
            animatedProps={ring}
          />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

/** The green check, drawn in the merged box (which sits in the middle of the row). */
function Check({ t, shown }: { t: SharedValue<number>; shown: boolean }) {
  const LEN = 36;
  const draw = useAnimatedProps(() => ({ strokeDashoffset: LEN * (1 - seg(t.value, SOLID + 100, 350)) }));
  return (
    <View
      pointerEvents="none"
      accessible={shown}
      accessibilityLabel={shown ? 'Code accepted' : undefined}
      style={[StyleSheet.absoluteFill, styles.check, !shown && styles.hidden]}>
      <Svg width={52} height={52} viewBox="0 0 52 52">
        <AnimatedPath
          d="M14 27l7 7 16-16"
          fill="none"
          stroke={color.green}
          strokeWidth={4.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={LEN}
          animatedProps={draw}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { marginTop: 22, minHeight: 64, justifyContent: 'center' },
  row: { flexDirection: 'row', gap: GAP },
  input: {
    width: '100%',
    height: '100%',
    borderWidth: 1.5,
    borderColor: color.fieldLine,
    backgroundColor: color.card,
    color: color.ink,
    textAlign: 'center',
    padding: 0,
    ...font(800),
  },
  inputRinged: { borderColor: color.ink },
  inputMerged: { color: 'transparent', boxShadow: `0 6px 14px -8px ${alpha(rgb.ink, 0.35)}` },
  inputSolid: { backgroundColor: color.greenSoft, borderColor: color.green },
  ring: { position: 'absolute', left: -2, top: -2 },
  check: { alignItems: 'center', justifyContent: 'center' },
  hidden: { opacity: 0 },
});
