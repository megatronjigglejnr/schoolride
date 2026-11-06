/**
 * The full map (the prototype's #routeOverlay), opened from the Track mini-map or the FAB's "Full route".
 * It rises over the tabs like Notifications. The active child's hand-drawn route fills the screen, with zoom
 * buttons, and a card per linked child sits at the bottom: swiping (or tapping) a card switches the active child
 * through setActiveChild, so the map, the title and every tab behind it follow.
 * The bus's live position is the only marigold here (CLAUDE.md); its ring pulses unless Reduce Motion is on.
 */
import { router } from 'expo-router';
import { useEffect, useRef, type ComponentRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';

import { Avatar } from '@/components/Avatar';
import { Glass } from '@/components/Glass';
import { Icon } from '@/components/Icon';
import { Press } from '@/components/Press';
import { children } from '@/data/children';
import { routeMaps } from '@/data/maps';
import { trackData } from '@/data/track';
import { CHILD_KEYS, type ChildKey, type Point } from '@/data/types';
import { useAccount } from '@/state/AccountContext';
import { useChild } from '@/state/ChildContext';
import { alpha, color, glass, rgb, shadow } from '@/theme/tokens';
import { font } from '@/theme/type';

const CARD_W = 260;
const GAP = 12;
const ZOOM_MIN = 0.85;
const ZOOM_MAX = 1.6;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function close() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

export default function RouteMapScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { activeChild, setActiveChild } = useChild();
  const zoom = useSharedValue(1);
  const carousel = useRef<ComponentRef<typeof ScrollView>>(null);
  const settle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const side = Math.max(16, (width - CARD_W) / 2);

  // Each child's map opens at its own scale.
  useEffect(() => {
    zoom.value = 1;
  }, [activeChild, zoom]);
  useEffect(() => () => clearTimeout(settle.current), []);
  // Open on the active child's card. (contentOffset alone is ignored on web.)
  const placeCarousel = () =>
    carousel.current?.scrollTo({ x: CHILD_KEYS.indexOf(activeChild) * (CARD_W + GAP), animated: false });

  const zoomBy = (f: number) => {
    zoom.set(withTiming(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom.get() * f)), { duration: 200 }));
  };
  const mapStyle = useAnimatedStyle(() => ({ transform: [{ scale: zoom.value }] }));

  const show = (key: ChildKey) => {
    if (key !== activeChild) setActiveChild(key);
  };
  const scrollTo = (key: ChildKey) => {
    carousel.current?.scrollTo({ x: CHILD_KEYS.indexOf(key) * (CARD_W + GAP), animated: true });
    show(key);
  };
  // Where the carousel comes to rest decides the child (the prototype waits 80ms after scrolling stops too;
  // react-native-web has no momentum-end event, so this covers web as well).
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      const i = Math.max(0, Math.min(CHILD_KEYS.length - 1, Math.round(x / (CARD_W + GAP))));
      show(CHILD_KEYS[i]);
    }, 80);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.map} accessible accessibilityLabel={mapLabel(activeChild)} accessibilityRole="image">
        <Animated.View style={[StyleSheet.absoluteFill, mapStyle]}>
          <RouteSvg child={activeChild} />
        </Animated.View>
        <LinearGradient
          pointerEvents="none"
          style={[styles.fade, { top: 0, height: 150 }]}
          colors={[color.mapGround, alpha(rgb.mapGround, 0)]}
          locations={[0.15, 1]}
        />
        <LinearGradient
          pointerEvents="none"
          style={[styles.fade, { bottom: 0, height: 190 }]}
          colors={[alpha(rgb.mapGround, 0), color.mapGround]}
          locations={[0, 0.85]}
        />
      </View>

      <View style={[styles.bar, { paddingTop: Math.max(16, insets.top) }]}>
        <Press
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={close}
          containerStyle={[styles.backWrap, { top: Math.max(16, insets.top) - 5 }]}
          style={styles.back}>
          <Icon name="chevronLeft" size={18} strokeWidth={2.2} />
        </Press>
        <Text accessibilityRole="header" style={styles.title}>
          {routeMaps[activeChild].title}
        </Text>
      </View>

      <View style={[styles.zoom, { top: Math.max(16, insets.top) + 54 }]}>
        <Press
          accessibilityRole="button"
          accessibilityLabel="Zoom in"
          onPress={() => zoomBy(1.15)}
          style={styles.zoomBtn}>
          <Icon name="plus" size={16} strokeWidth={2.4} />
        </Press>
        <Press
          accessibilityRole="button"
          accessibilityLabel="Zoom out"
          onPress={() => zoomBy(0.87)}
          style={styles.zoomBtn}>
          <View style={styles.minus} />
        </Press>
      </View>

      <View style={[styles.carouselWrap, { bottom: 26 + insets.bottom }]}>
        <ScrollView
          ref={carousel}
          testID="route-carousel"
          onContentSizeChange={placeCarousel}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_W + GAP}
          decelerationRate="fast"
          disableIntervalMomentum
          contentOffset={{ x: CHILD_KEYS.indexOf(activeChild) * (CARD_W + GAP), y: 0 }}
          onScroll={onScroll}
          scrollEventThrottle={32}
          contentContainerStyle={{ paddingHorizontal: side, gap: GAP }}>
          {CHILD_KEYS.map((k) => (
            <ChildCard key={k} child={k} on={k === activeChild} onPress={() => scrollTo(k)} />
          ))}
        </ScrollView>
        <View style={styles.dots} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          {CHILD_KEYS.map((k) => (
            <View key={k} style={[styles.dot, k === activeChild && styles.dotOn]} />
          ))}
        </View>
      </View>
    </View>
  );
}

function mapLabel(key: ChildKey) {
  const m = routeMaps[key];
  return `Map of ${m.title}: from ${m.home.label} past ${m.stop.label} to ${m.school.label}. The bus is between home and ${m.stop.label}.`;
}

/** One linked child: their name, school, live status and how far along the route the bus is. */
function ChildCard({ child, on, onPress }: { child: ChildKey; on: boolean; onPress: () => void }) {
  const c = children[child];
  const t = trackData[child];
  const { photos } = useAccount();
  const { signals } = useChild();
  const lost = signals[child].lost;
  const status = lost
    ? `Signal lost · last seen ${signals[child].lostMinutes} min ago`
    : `On the way · ${t.etaMin} min`;

  return (
    <Press
      accessibilityRole="button"
      accessibilityLabel={`${c.fullName}, ${c.school}, ${status}`}
      accessibilityHint={on ? undefined : `Shows ${c.firstName}'s route`}
      accessibilityState={{ selected: on }}
      onPress={onPress}
      pressScale={0.98}
      containerStyle={styles.cardShadow}>
      <Glass variant="sheet" blur={20} saturate={180} style={styles.card}>
        <View style={styles.cardTop}>
          <Avatar initials={c.firstName[0]} uri={photos[child]} tone={c.avatar === 'muted' ? 'muted' : 'ink'} />
          <View style={styles.cardWho}>
            <Text style={styles.cardName}>{c.fullName}</Text>
            <Text style={styles.cardSchool}>{c.school}</Text>
          </View>
        </View>
        <Text style={styles.cardStatus}>{status}</Text>
        <View style={styles.track}>
          <View style={[styles.trackFill, { width: `${t.fillPct}%` }]} />
        </View>
      </Glass>
    </Press>
  );
}

/** The hand-drawn route: roads, the route line, home, the child's stop, school, and the live bus. */
function RouteSvg({ child }: { child: ChildKey }) {
  const m = routeMaps[child];
  return (
    <Svg width="100%" height="100%" viewBox="0 -125 320 570" preserveAspectRatio="xMidYMid slice">
      <Rect x={-10} y={-135} width={340} height={590} fill={color.mapGround} />
      <G stroke={color.card} strokeWidth={9} fill="none">
        {m.roads.map((d) => (
          <Path key={d} d={d} />
        ))}
      </G>
      <Path d={m.route} fill="none" stroke={color.ink} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={m.home.at[0]} cy={m.home.at[1]} r={6} fill={color.ink} />
      <Label at={m.home.labelAt}>{m.home.label}</Label>
      <Circle cx={m.stop.at[0]} cy={m.stop.at[1]} r={9} fill={color.card} stroke={color.ink} strokeWidth={3.5} />
      <Label at={m.stop.labelAt}>{m.stop.label}</Label>
      <Rect x={m.school.at[0]} y={m.school.at[1]} width={24} height={20} rx={5} fill={color.ink} />
      <SvgText
        x={m.school.at[0] + 12}
        y={m.school.at[1] + 14}
        textAnchor="middle"
        fontSize={11}
        fill={color.onInk}
        fontFamily={font(800).fontFamily}>
        {m.school.letter}
      </SvgText>
      <Label at={m.school.labelAt}>{m.school.label}</Label>
      <LiveBus at={m.live} />
    </Svg>
  );
}

function Label({ at, children: label }: { at: Point; children: string }) {
  return (
    <SvgText x={at[0]} y={at[1]} fontSize={11} fill={color.ink} fontFamily={font(400).fontFamily}>
      {label}
    </SvgText>
  );
}

/** The bus's live position: a marigold dot with a ring that swells and fades every 2s. */
function LiveBus({ at }: { at: Point }) {
  const reduce = useReducedMotion();
  const p = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    p.value = withRepeat(withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }), -1, false);
  }, [reduce, p]);
  // 9 -> 20 -> 9, fading out at the widest, like the prototype's SMIL ring.
  const ring = useAnimatedProps(() => {
    const k = Math.sin(p.value * Math.PI);
    return { r: 9 + 11 * k, opacity: 0.6 * (1 - k) };
  });
  return (
    <>
      {!reduce && (
        <AnimatedCircle cx={at[0]} cy={at[1]} fill="none" stroke={color.accent} strokeWidth={2} animatedProps={ring} />
      )}
      <Circle cx={at[0]} cy={at[1]} r={9} fill={color.accent} stroke={color.ink} strokeWidth={3} />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.mapGround },
  map: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' },
  fade: { position: 'absolute', left: 0, right: 0 },
  bar: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', paddingBottom: 10 },
  backWrap: { position: 'absolute', left: 8, zIndex: 1 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { ...font(800), fontSize: 15, color: color.ink, lineHeight: 34 },
  // Top right, under the title: empty map on every route, so the buttons never cover home, the stop or school.
  zoom: { position: 'absolute', right: 16, gap: 6 },
  zoomBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: color.card,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: shadow.float,
  },
  minus: { width: 12, height: 2.4, borderRadius: 1.2, backgroundColor: color.ink },
  carouselWrap: { position: 'absolute', left: 0, right: 0 },
  cardShadow: {
    width: CARD_W,
    borderRadius: 18,
    boxShadow: `0 1px 2px ${alpha(rgb.ink, 0.08)}, 0 14px 30px -10px ${alpha(rgb.ink, 0.3)}`,
  },
  card: { borderRadius: 18, borderWidth: 1, borderColor: glass.border, paddingVertical: 14, paddingHorizontal: 16 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  cardWho: { flex: 1, minWidth: 0 },
  cardName: { ...font(700), fontSize: 13.5, color: color.ink },
  cardSchool: { ...font(400), fontSize: 12, color: color.muted },
  cardStatus: { ...font(800), fontSize: 12, color: color.ink, marginBottom: 8 },
  track: { height: 5, borderRadius: 4, backgroundColor: color.line, overflow: 'hidden' },
  trackFill: { height: '100%', borderRadius: 4, backgroundColor: color.ink },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: color.mapRoadEdge },
  dotOn: { width: 16, borderRadius: 4, backgroundColor: color.ink },
});
