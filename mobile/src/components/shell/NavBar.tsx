/**
 * The bottom of the shell (.navwrap in the prototype): a light frosted pill with the three child tabs, the
 * raised marigold FAB docked at its right end, the FAB's quick actions and the frosted scrim behind them.
 * Account is not a tab: the header avatar opens it.
 *
 * The active tab is marked twice, so it never rests on colour alone: its label is ink and heavier, and a short
 * ink bar under it glides to each new tab on a critically damped spring (no overshoot; a new tap retargets it).
 * Marigold can't mark it on a light pill (about 2:1 on white). With Reduce Motion everything moves at once.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Glass } from '@/components/Glass';
import { Icon, type IconName } from '@/components/Icon';
import { Press } from '@/components/Press';
import { useShell } from '@/state/ShellContext';
import { alpha, color, glass, rgb, shadow } from '@/theme/tokens';
import { font } from '@/theme/type';

import type { TabName } from './Header';

const tabs: { name: TabName; label: string; icon: IconName }[] = [
  { name: 'index', label: 'Track', icon: 'pin' },
  { name: 'schedule', label: 'Schedule', icon: 'calendar' },
  { name: 'history', label: 'History', icon: 'clock' },
];

const BAR_W = 20;
const PILL_H = 68;
const FAB = 58;
const ICON = 46;
const arrive = Easing.bezier(0.16, 1, 0.3, 1);

type Shortcut = { label: string; icon: IconName; run: () => void };

type Props = { tab: TabName; onTab: (name: TabName) => void };

export function NavBar({ tab, onTab }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const reduce = useReducedMotion();
  const { fabOpen, setFabOpen, openSheet } = useShell();
  const edge = width < 340 ? 8 : 12;
  const pillBottom = 14 + insets.bottom;
  const fabBottom = pillBottom + (PILL_H - FAB) / 2;

  // --- Active tab bar ---
  const frames = useRef<Partial<Record<TabName, { x: number; w: number }>>>({});
  const [measured, setMeasured] = useState(0);
  const barX = useSharedValue(0);
  const placed = useRef(false);
  const onTabLayout = (name: TabName) => (e: LayoutChangeEvent) => {
    frames.current[name] = { x: e.nativeEvent.layout.x, w: e.nativeEvent.layout.width };
    setMeasured((n) => n + 1);
  };
  useEffect(() => {
    const f = frames.current[tab];
    if (!f) return; // Account: no tab is active
    const x = f.x + f.w / 2 - BAR_W / 2;
    if (!placed.current || reduce) {
      barX.value = x;
      placed.current = true;
      return;
    }
    barX.value = withSpring(x, { duration: 250, dampingRatio: 1 });
  }, [tab, measured, reduce, barX]);
  const onTabBar = tabs.some((t) => t.name === tab);
  const bar = useAnimatedStyle(
    () => ({ opacity: withTiming(onTabBar ? 1 : 0, { duration: 150 }), transform: [{ translateX: barX.value }] }),
    [onTabBar],
  );

  // --- FAB and quick actions ---
  const open = useSharedValue(0);
  useEffect(() => {
    open.value = reduce ? (fabOpen ? 1 : 0) : withTiming(fabOpen ? 1 : 0, { duration: fabOpen ? 220 : 140 });
  }, [fabOpen, reduce, open]);
  const close = () => setFabOpen(false);
  // Listed nearest the FAB first: Call is under the thumb (CLAUDE.md keeps the FAB's call shortcut on purpose).
  const shortcuts: Shortcut[] = [
    { label: 'Call', icon: 'phone', run: () => openSheet('call') },
    {
      label: 'Full route',
      icon: 'map',
      run: () => {
        close();
        router.push('/route-map');
      },
    },
    {
      label: 'Exam day',
      icon: 'calendar',
      run: () => {
        close();
        onTab('schedule');
      },
    },
    { label: 'Share ETA', icon: 'share', run: () => openSheet('share') },
  ];
  const fabTurn = useAnimatedStyle(() => ({ transform: [{ rotate: `${open.value * 45}deg` }] }));
  const scrim = useAnimatedStyle(() => ({ opacity: open.value }));

  return (
    <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, styles.layer]}>
      <Animated.View
        pointerEvents={fabOpen ? 'auto' : 'none'}
        style={[StyleSheet.absoluteFill, styles.scrimLayer, scrim]}>
        <Glass variant="scrim" blur={9} saturate={140} style={StyleSheet.absoluteFill} />
        {/* Only exists while open, so a closed scrim is never a stop for screen readers or the keyboard. */}
        {fabOpen && (
          <Press
            accessibilityRole="button"
            accessibilityLabel="Close quick actions"
            pressScale={0}
            onPress={close}
            containerStyle={StyleSheet.absoluteFill}
            style={StyleSheet.absoluteFill}
          />
        )}
      </Animated.View>

      <View style={[styles.pillShadow, { left: edge, right: edge + FAB + 10, bottom: pillBottom }]}>
        <Glass variant="sheet" blur={24} saturate={190} style={styles.pill}>
          <LinearGradient
            pointerEvents="none"
            style={styles.pillGlint}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            colors={['transparent', alpha(rgb.glint, 0.9), 'transparent']}
          />
          <View style={[styles.row, { paddingHorizontal: width < 340 ? 6 : 12 }]} accessibilityRole="tablist">
            <Animated.View pointerEvents="none" style={[styles.indicator, bar]} />
            {tabs.map((t) => (
              <Tab
                key={t.name}
                {...t}
                on={tab === t.name}
                onLayout={onTabLayout(t.name)}
                onPress={() => onTab(t.name)}
              />
            ))}
          </View>
        </Glass>
      </View>

      <View
        pointerEvents="box-none"
        style={[styles.stack, { right: edge + (FAB - ICON) / 2, bottom: fabBottom + FAB + 14 }]}>
        {shortcuts.map((s, i) => (
          <QuickAction key={s.label} shortcut={s} index={i} open={fabOpen} reduce={reduce} />
        ))}
      </View>

      <Press
        accessibilityRole="button"
        accessibilityLabel="Quick actions"
        accessibilityState={{ expanded: fabOpen }}
        onPress={() => setFabOpen(!fabOpen)}
        containerStyle={[styles.fabWrap, { right: edge, bottom: fabBottom }]}
        style={styles.fab}>
        <View style={styles.fabClip}>
          <LinearGradient
            style={StyleSheet.absoluteFill}
            colors={[color.accentLight, color.accent, color.accentDeep]}
            locations={[0, 0.55, 1]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
          <LinearGradient style={styles.fabShine} colors={[alpha(rgb.glint, 0.5), alpha(rgb.glint, 0)]} />
          <Animated.View style={fabTurn}>
            <Icon name="plus" size={22} strokeWidth={2.5} />
          </Animated.View>
        </View>
      </Press>
    </View>
  );
}

function Tab({
  label,
  icon,
  on,
  onPress,
  onLayout,
}: {
  label: string;
  icon: IconName;
  on: boolean;
  onPress: () => void;
  onLayout: (e: LayoutChangeEvent) => void;
}) {
  const reduce = useReducedMotion();
  // Muted underneath, ink fading in over it: a 150ms crossfade between the two states, opacity only.
  const lit = useAnimatedStyle(
    () => ({ opacity: reduce ? (on ? 1 : 0) : withTiming(on ? 1 : 0, { duration: 150 }) }),
    [on, reduce],
  );
  return (
    <View onLayout={onLayout}>
      <Press
        accessibilityRole="tab"
        accessibilityLabel={label}
        accessibilityState={{ selected: on }}
        onPress={onPress}
        pressScale={0.94}
        style={styles.tab}>
        <View style={styles.tabInner}>
          <Icon name={icon} size={18} color={color.muted} />
          <Text style={[styles.tabLabel, styles.tabLabelMuted]}>{label}</Text>
        </View>
        <Animated.View style={[styles.tabInner, styles.tabLit, lit]}>
          <Icon name={icon} size={18} color={color.ink} />
          <Text style={[styles.tabLabel, styles.tabLabelOn]}>{label}</Text>
        </Animated.View>
      </Press>
    </View>
  );
}

function QuickAction({
  shortcut,
  index,
  open,
  reduce,
}: {
  shortcut: Shortcut;
  index: number;
  open: boolean;
  reduce: boolean;
}) {
  const p = useSharedValue(0);
  useEffect(() => {
    if (reduce) p.value = open ? 1 : 0;
    // Rising from the FAB outward, 30ms apart; closing is quicker and all at once.
    else if (open) p.value = withDelay(index * 30, withTiming(1, { duration: 220, easing: arrive }));
    else p.value = withTiming(0, { duration: 140 });
  }, [open, reduce, index, p]);
  const anim = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ translateY: (1 - p.value) * 12 }, { scale: 0.92 + 0.08 * p.value }],
  }));

  return (
    <Animated.View pointerEvents={open ? 'auto' : 'none'} aria-hidden={!open} style={[styles.actionWrap, anim]}>
      <Press
        accessibilityRole="button"
        accessibilityLabel={shortcut.label}
        disabled={!open}
        focusable={open}
        onPress={shortcut.run}
        style={styles.action}>
        <View style={styles.actionLabel}>
          <Text style={styles.actionText}>{shortcut.label}</Text>
        </View>
        <View style={styles.actionIcon}>
          <Icon name={shortcut.icon} size={17} color={color.onInk} />
        </View>
      </Press>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Above the header (z 12), so the open FAB's scrim veils the header too, as in the prototype.
  layer: { zIndex: 14 },
  scrimLayer: { zIndex: 14 },
  pillShadow: {
    position: 'absolute',
    height: PILL_H,
    zIndex: 15,
    borderRadius: 26,
    boxShadow: `${shadow.float}, 0 16px 36px -12px ${alpha(rgb.ink, 0.26)}`,
  },
  pill: { flex: 1, borderRadius: 26, borderWidth: 1, borderColor: glass.border, boxShadow: glass.highlight },
  pillGlint: { position: 'absolute', left: 20, right: 20, top: 1, height: 1 },
  row: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  indicator: {
    position: 'absolute',
    left: 0,
    bottom: 8,
    width: BAR_W,
    height: 3,
    borderRadius: 2,
    backgroundColor: color.ink,
  },
  tab: { minWidth: 64, minHeight: 50, alignItems: 'center', justifyContent: 'center' },
  tabInner: { alignItems: 'center', gap: 4 },
  tabLit: { ...StyleSheet.absoluteFill, justifyContent: 'center' },
  tabLabel: { fontSize: 12 },
  tabLabelMuted: { ...font(700), color: color.muted },
  tabLabelOn: { ...font(800), color: color.ink },
  stack: { position: 'absolute', zIndex: 20, flexDirection: 'column-reverse', alignItems: 'flex-end', gap: 10 },
  actionWrap: { transformOrigin: 'right center' },
  action: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: ICON },
  actionLabel: {
    backgroundColor: color.card,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    boxShadow: shadow.float,
  },
  actionText: { ...font(800), fontSize: 13, color: color.ink },
  actionIcon: {
    width: ICON,
    height: ICON,
    borderRadius: ICON / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(rgb.ink, 0.94),
    borderWidth: 1,
    borderColor: alpha(rgb.silver, 0.22),
    boxShadow: `0 2px 4px ${alpha(rgb.ink, 0.2)}, 0 10px 22px -10px ${alpha(rgb.ink, 0.6)}, inset 0 1px 0 ${alpha(rgb.glint, 0.18)}`,
  },
  fabWrap: { position: 'absolute', zIndex: 25 },
  fab: {
    width: FAB,
    height: FAB,
    borderRadius: FAB / 2,
    boxShadow: `0 2px 4px ${alpha(rgb.ink, 0.14)}, 0 14px 28px -10px ${alpha(rgb.ink, 0.38)}, inset 0 1px 1px ${alpha(rgb.glint, 0.7)}`,
  },
  fabClip: { flex: 1, borderRadius: FAB / 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  fabShine: { position: 'absolute', top: 4, left: 8, width: 22, height: 14, borderRadius: 11 },
});
