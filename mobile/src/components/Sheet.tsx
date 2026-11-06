/**
 * The bottom sheet (.bottom-sheet + .sheet-scrim in the prototype): frosted white glass over a dimmed, blurred
 * scrim. It rises on the prototype's curve and leaves faster than it came. While open it is modal for screen
 * readers; closed, nothing of it is mounted, so it is never a stop for touch, screen readers or the keyboard.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Glass } from '@/components/Glass';
import { Icon } from '@/components/Icon';
import { Press } from '@/components/Press';
import { text } from '@/theme/text';
import { alpha, color, glass, rgb } from '@/theme/tokens';

const ENTER_MS = 380;
const EXIT_MS = 260;
const rise = Easing.bezier(0.32, 0.72, 0, 1);

type Props = { open: boolean; title: string; onClose: () => void; children: ReactNode };

export function Sheet({ open, title, onClose, children }: Props) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(open);
  const p = useSharedValue(0);

  // Mount on open, animate in; on close, animate out and then unmount.
  if (open && !mounted) setMounted(true);
  useEffect(() => {
    if (open) {
      p.value = reduce ? 1 : withTiming(1, { duration: ENTER_MS, easing: rise });
      return;
    }
    p.value = reduce ? 0 : withTiming(0, { duration: EXIT_MS, easing: Easing.in(Easing.quad) });
    const t = setTimeout(() => setMounted(false), reduce ? 0 : EXIT_MS);
    return () => clearTimeout(t);
  }, [open, reduce, p]);

  const scrim = useAnimatedStyle(() => ({ opacity: p.value }));
  const panel = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - p.value) * height * 0.9 }] }));

  if (!mounted) return null;

  return (
    <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, styles.layer]}>
      <Animated.View style={[StyleSheet.absoluteFill, scrim]}>
        <Glass variant="veil" blur={5} saturate={100} style={StyleSheet.absoluteFill} />
        {open && (
          <Press
            accessibilityRole="button"
            accessibilityLabel={`Close ${title.toLowerCase()}`}
            pressScale={0}
            onPress={onClose}
            containerStyle={StyleSheet.absoluteFill}
            style={StyleSheet.absoluteFill}
          />
        )}
      </Animated.View>

      <Animated.View
        accessibilityViewIsModal
        aria-modal
        role="dialog"
        aria-label={title}
        style={[styles.panelShadow, { maxHeight: height * 0.88 }, panel]}>
        <Glass variant="sheet" blur={28} saturate={180} style={styles.panel}>
          <ScrollView
            bounces={false}
            contentContainerStyle={{ paddingTop: 10, paddingHorizontal: 18, paddingBottom: 24 + insets.bottom }}>
            <View style={styles.handle} />
            <View style={styles.header}>
              <Text accessibilityRole="header" style={text.sheetTitle}>
                {title}
              </Text>
              <Press
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={onClose}
                size={{ width: 28, height: 28 }}
                style={styles.close}>
                <Icon name="close" size={14} strokeWidth={2.4} />
              </Press>
            </View>
            {children}
          </ScrollView>
        </Glass>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { zIndex: 45 },
  panelShadow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    boxShadow: `0 -24px 60px -24px ${alpha(rgb.ink, 0.4)}`,
  },
  panel: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: glass.border,
    boxShadow: `inset 0 1px 0 ${alpha(rgb.glint, 0.9)}`,
  },
  handle: { width: 34, height: 4, borderRadius: 3, backgroundColor: color.mapRoadEdge, alignSelf: 'center', marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  close: { width: 28, height: 28, borderRadius: 14, backgroundColor: color.surfaceFlat, alignItems: 'center', justifyContent: 'center' },
});
