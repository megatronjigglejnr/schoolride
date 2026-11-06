/**
 * Liquid glass, chosen per platform (docs/rn-port-plan.md):
 * - iOS 26+ with Liquid Glass: the system GlassView, tinted with the variant's colour;
 * - web: the prototype's own backdrop-filter (same blur radius and saturation), under its translucent fill;
 * - iOS before 26: a system blur under the same fill;
 * - Android: the translucent fill alone (the prototype's no-blur look), since real blur there is experimental and slow;
 * - Reduce Transparency on: a solid fill, whatever the platform.
 * Glass only goes on what floats above content: the nav pill, the scrolled header, sheets.
 */
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { alpha, color, glass, rgb } from '@/theme/tokens';

/**
 * dark: an aubergine pill; light: the frosted header; sheet: sheets and the nav pill;
 * scrim: the ice veil behind the FAB; veil: the aubergine dimming behind a sheet.
 */
type Variant = 'dark' | 'light' | 'sheet' | 'scrim' | 'veil';

const fill: Record<Variant, readonly [string, string]> = {
  dark: glass.dark,
  light: [glass.light, glass.light],
  sheet: glass.sheet,
  scrim: [alpha(rgb.canvas, 0.45), alpha(rgb.canvas, 0.45)],
  veil: [alpha(rgb.ink, 0.28), alpha(rgb.ink, 0.28)],
};
const solid: Record<Variant, string> = { dark: color.ink, light: color.canvas, sheet: color.card, scrim: alpha(rgb.canvas, 0.9), veil: alpha(rgb.ink, 0.45) };
const blurTint = { dark: 'dark', light: 'light', sheet: 'light', scrim: 'light', veil: 'dark' } as const;
const liquidTint: Record<Variant, string> = {
  dark: alpha(rgb.ink, 0.72),
  light: alpha(rgb.canvas, 0.5),
  sheet: alpha(rgb.glint, 0.6),
  scrim: alpha(rgb.canvas, 0.3),
  veil: alpha(rgb.ink, 0.28),
};

export function useReduceTransparency() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceTransparencyEnabled?.().then((v) => alive && setOn(v)).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setOn);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return on;
}

const liquid = Platform.OS === 'ios' && isLiquidGlassAvailable();

type Props = {
  variant: Variant;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  /** Blur radius in px and saturation in %, as the prototype's backdrop-filter. */
  blur?: number;
  saturate?: number;
};

export function Glass({ variant, style, children, blur = 24, saturate = 180 }: Props) {
  const reduce = useReduceTransparency();

  if (reduce) return <View style={[style, { backgroundColor: solid[variant] }]}>{children}</View>;

  if (liquid) {
    return (
      <GlassView style={style} glassEffectStyle="regular" tintColor={liquidTint[variant]}>
        {children}
      </GlassView>
    );
  }

  const [from, to] = fill[variant];
  // On web, expo-blur would add its own tint layer (grey or near-black) under ours; the CSS filter adds none.
  const webBlur = { backdropFilter: `blur(${blur}px) saturate(${saturate}%)`, WebkitBackdropFilter: `blur(${blur}px) saturate(${saturate}%)` };
  return (
    <View style={[style, styles.clip, Platform.OS === 'web' && (webBlur as ViewStyle)]}>
      {Platform.OS === 'ios' && (
        <BlurView style={StyleSheet.absoluteFill} intensity={Math.min(100, blur * 3)} tint={blurTint[variant]} />
      )}
      <LinearGradient style={StyleSheet.absoluteFill} colors={[from, to]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({ clip: { overflow: 'hidden' } });
