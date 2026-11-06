// Track: where the ride is right now. The driver is always one tap from here (CLAUDE.md, "Calls").
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { Enter } from '@/components/Enter';
import { Icon } from '@/components/Icon';
import { Press } from '@/components/Press';
import { NAV_ROOM, Screen } from '@/components/shell/Screen';
import { Hero } from '@/components/track/Hero';
import { DistanceRows } from '@/components/track/DistanceRows';
import { MiniMap } from '@/components/track/MiniMap';
import { Stops } from '@/components/track/Stops';
import { callData } from '@/data/calls';
import { children } from '@/data/children';
import { trackData } from '@/data/track';
import { placeCall } from '@/lib/calls';
import { DEMO_CONTROLS } from '@/lib/demo';
import { useChild } from '@/state/ChildContext';
import { useShell } from '@/state/ShellContext';
import { text } from '@/theme/text';
import { alpha, color, rgb, shadow } from '@/theme/tokens';
import { font } from '@/theme/type';

const BUS_W = 112;

export default function TrackScreen() {
  const { activeChild, signal, toggleSignalDemo } = useChild();
  const { showToast, openSheet } = useShell();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const short = height < 700;

  const d = trackData[activeChild];
  const driver = callData[activeChild].driver;
  const name = children[activeChild].firstName;

  const [sheetW, setSheetW] = useState(0);
  const [mapW, setMapW] = useState(0);
  const mapH = short ? 150 : 172;

  return (
    <Screen>
      <Hero />

      <Enter index={1} distance={24} fade={false} duration={360} delay={20} style={styles.sheetWrap}>
        <View
          onLayout={(e) => setSheetW(e.nativeEvent.layout.width)}
          style={[styles.sheet, { marginBottom: -(NAV_ROOM + insets.bottom), paddingBottom: 150 + insets.bottom }]}>
          <RidingBus sheetWidth={sheetW} progress={d.fillPct / 100} lost={signal.lost} />

          <View style={styles.routeHead}>
            <Text accessibilityRole="header" style={text.sectionTitle}>
              {"Today's route"}
            </Text>
            <Text style={styles.progress}>{d.progress}</Text>
          </View>
          <Stops stops={d.route} initial={name.charAt(0)} calm={signal.lost} />

          <View style={styles.driverCard}>
            <Press
              accessibilityRole="button"
              accessibilityLabel={`All contacts for ${name}`}
              onPress={() => openSheet('call')}
              containerStyle={styles.driverLeftWrap}
              style={styles.driverLeft}>
              <View style={styles.driverAvatar}>
                <Text style={styles.driverInitial}>{driver.initial}</Text>
              </View>
              <View style={styles.driverText}>
                <Text style={styles.driverName} numberOfLines={1}>
                  {driver.name}
                </Text>
                <Text style={styles.driverRole} numberOfLines={1}>
                  {driver.role}
                </Text>
              </View>
              <Icon name="chevronRight" size={16} strokeWidth={2.4} color={color.muted} />
            </Press>
            <Press
              accessibilityRole="button"
              accessibilityLabel={`Call ${driver.name}`}
              onPress={() => placeCall(driver.phone, driver.name, showToast)}
              style={styles.callBtn}>
              <Icon name="phone" size={18} color={color.onInk} />
            </Press>
          </View>

          <View style={[styles.routeHead, styles.distHead]}>
            <Text accessibilityRole="header" style={text.sectionTitle}>
              Distance from home
            </Text>
            <Text style={styles.progress}>Approx.</Text>
          </View>
          <View style={styles.mapPanel}>
            <Press
              accessibilityRole="button"
              accessibilityLabel="Open the live map"
              onPress={() => router.push('/route-map')}
              pressScale={0.985}
              style={[styles.mapCard, { height: mapH }]}>
              <View style={styles.mapClip} onLayout={(e) => setMapW(e.nativeEvent.layout.width)}>
                {mapW > 0 && <MiniMap child={activeChild} lost={signal.lost} width={mapW} height={mapH} />}
              </View>
              <View style={styles.mapLive}>
                <View style={[styles.liveDot, signal.lost && styles.liveDotLost]} />
                <Text style={styles.mapLiveText}>
                  {signal.lost ? `Last seen ${signal.lostMinutes} min ago` : 'Live'}
                </Text>
              </View>
              <View style={styles.mapExpand}>
                <Icon name="expand" size={16} strokeWidth={2.4} />
              </View>
            </Press>
            <DistanceRows />
          </View>

          {DEMO_CONTROLS && (
            <Press
              accessibilityRole="button"
              accessibilityLabel={signal.lost ? 'Restore signal (demo control)' : 'Simulate signal loss (demo control)'}
              onPress={toggleSignalDemo}
              pressScale={0}
              style={styles.demo}>
              <Text style={styles.demoText}>
                {signal.lost ? 'Restore signal (demo control)' : 'Simulate signal loss (demo control)'}
              </Text>
            </Press>
          )}
        </View>
      </Enter>
    </Screen>
  );
}

/** The flat bus on the sheet's top edge, placed by route progress; it bobs while live and dims when lost. */
function RidingBus({ sheetWidth, progress, lost }: { sheetWidth: number; progress: number; lost: boolean }) {
  const reduce = useReducedMotion();
  const target = 20 + progress * Math.max(0, sheetWidth - 40 - BUS_W);
  const left = useSharedValue(target);
  const bob = useSharedValue(0);
  const placed = useSharedValue(false);

  useEffect(() => {
    if (!sheetWidth) return;
    if (!placed.value || reduce) {
      left.value = target;
      placed.value = true;
    } else left.value = withTiming(target, { duration: 900, easing: Easing.bezier(0.4, 0, 0.2, 1) });
  }, [target, sheetWidth, reduce, left, placed]);

  useEffect(() => {
    bob.value = 0;
    if (!reduce && !lost) {
      bob.value = withRepeat(
        withSequence(
          withTiming(-1.5, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
      );
    }
  }, [reduce, lost, bob]);

  const style = useAnimatedStyle(() => ({
    left: left.value,
    opacity: withTiming(lost ? 0.4 : 1, { duration: 400 }),
    transform: [{ translateY: bob.value }],
  }));

  if (!sheetWidth) return null;
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.bus, style]}>
      <Bus width={BUS_W} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheetWrap: { flexGrow: 1 },
  sheet: {
    flexGrow: 1,
    marginTop: -34,
    marginHorizontal: -18,
    paddingTop: 24,
    paddingHorizontal: 20,
    backgroundColor: color.card,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    boxShadow: `0 -1px 0 ${alpha(rgb.ink, 0.04)}, 0 -12px 32px -14px ${alpha(rgb.ink, 0.22)}`,
  },
  bus: { position: 'absolute', top: -49, width: BUS_W },
  // The map sits at the bottom of the sheet, in one raised card with each child's distance from home under it.
  mapPanel: {
    backgroundColor: color.card,
    borderRadius: 22,
    boxShadow: shadow.raised,
    overflow: 'hidden',
    marginBottom: 6,
  },
  mapCard: { backgroundColor: color.mapGround },
  mapClip: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
  distHead: { marginTop: 2 },
  mapLive: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: color.card,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    boxShadow: shadow.float,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: color.ink,
    boxShadow: `0 0 0 2px ${alpha(rgb.ink, 0.18)}`,
  },
  liveDotLost: { backgroundColor: color.strokeQuiet },
  mapLiveText: { ...font(800), fontSize: 12, color: color.ink },
  mapExpand: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: color.card,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: shadow.float,
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: color.canvas,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  driverLeftWrap: { flexShrink: 1 },
  driverLeft: { flexDirection: 'row', alignItems: 'center', gap: 11, minHeight: 44, paddingRight: 8 },
  driverAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: color.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverInitial: { ...font(900), fontSize: 14, color: color.onInk },
  driverText: { flexShrink: 1 },
  driverName: { ...font(800), fontSize: 13.5, color: color.ink },
  driverRole: { ...font(400), fontSize: 12, color: color.muted },
  callBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: color.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 },
  progress: { ...font(700), fontSize: 13, color: color.muted },
  demo: { paddingVertical: 16, alignItems: 'center' },
  demoText: { ...font(400), fontSize: 12, color: color.muted, textDecorationLine: 'underline' },
});
