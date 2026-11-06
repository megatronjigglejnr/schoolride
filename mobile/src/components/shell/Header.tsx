/**
 * The header (.topnav.glass in the prototype), two rows:
 * - row 1: the parent's avatar (it opens Account), a greeting by the phone's local time, and the bell;
 * - row 2, on Track, Schedule and History: the child switcher, left-aligned.
 * On Account's sub-screens, the back button takes the avatar's place and the screen's title the greeting's.
 * A frosted background fades in only once content scrolls under it.
 */
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { Glass } from '@/components/Glass';
import { Icon } from '@/components/Icon';
import { Press } from '@/components/Press';
import { children as childData } from '@/data/children';
import { CHILD_KEYS } from '@/data/types';
import { initialsOf } from '@/lib/account';
import { useGreeting } from '@/lib/greeting';
import { useAccount } from '@/state/AccountContext';
import { useChild } from '@/state/ChildContext';
import { useShell } from '@/state/ShellContext';
import { alpha, color, glass, rgb } from '@/theme/tokens';
import { font, tracking } from '@/theme/type';

export type TabName = 'index' | 'schedule' | 'history' | 'profile';

/** Tabs that pick a child carry the switcher row, so their content starts lower. */
export const hasSwitcher = (tab: TabName) => tab !== 'profile';

type Props = {
  tab: TabName;
  onAccount: () => void;
  /** An Account sub-screen's title; shows the back button. */ subTitle?: string;
};

export function Header({ tab, onAccount, subTitle }: Props) {
  const insets = useSafeAreaInsets();
  const { activeChild, setActiveChild, unread } = useChild();
  const { profile, photos } = useAccount();
  const { scrolled } = useShell();
  const greeting = useGreeting();
  const firstName = profile.name.split(' ')[0];

  const frost = useAnimatedStyle(() => ({ opacity: withTiming(scrolled ? 1 : 0, { duration: 300 }) }), [scrolled]);

  return (
    <View style={[styles.bar, { paddingTop: Math.max(16, insets.top) }]}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.frost, frost]}>
        <Glass variant="light" blur={18} saturate={170} style={StyleSheet.absoluteFill} />
      </Animated.View>

      <View style={styles.row}>
        {subTitle ? (
          <>
            <Press
              accessibilityRole="button"
              accessibilityLabel="Back"
              onPress={() => router.back()}
              size={{ width: 32, height: 32 }}
              containerStyle={styles.backWrap}
              style={styles.back}>
              <Icon name="chevronLeft" size={18} strokeWidth={2.2} />
            </Press>
            <Text accessibilityRole="header" numberOfLines={1} style={styles.subTitle}>
              {subTitle}
            </Text>
          </>
        ) : (
          <>
            <Press
              accessibilityRole="button"
              accessibilityLabel={`Account, ${profile.name}`}
              accessibilityState={{ selected: tab === 'profile' }}
              onPress={onAccount}
              size={{ width: 32, height: 32 }}
              style={[styles.avatar, tab === 'profile' && styles.avatarOn]}>
              <Avatar initials={initialsOf(profile.name)} uri={photos.me} size={32} />
            </Press>

            <View
              style={styles.greeting}
              accessible
              accessibilityRole="text"
              accessibilityLabel={`${greeting}, ${firstName}`}>
              <Text style={styles.greetLine} numberOfLines={1}>
                {greeting},
              </Text>
              <Text style={styles.greetName} numberOfLines={1}>
                {firstName}
              </Text>
            </View>
          </>
        )}

        <Press
          accessibilityRole="button"
          accessibilityLabel={unread.size ? `Notifications, ${unread.size} unread` : 'Notifications'}
          onPress={() => router.push('/notifications')}
          size={{ width: 32, height: 32 }}
          containerStyle={styles.bellWrap}
          style={styles.bell}>
          <Icon name="bell" size={15} color={color.onInk} />
          {unread.size > 0 && <View style={styles.badge} />}
        </Press>
      </View>

      {hasSwitcher(tab) && !subTitle && (
        <View style={styles.switch} accessibilityRole="radiogroup" accessibilityLabel="Choose child">
          {CHILD_KEYS.map((key) => {
            const on = key === activeChild;
            return (
              <Press
                key={key}
                accessibilityRole="radio"
                accessibilityLabel={childData[key].firstName}
                accessibilityState={{ checked: on }}
                onPress={() => setActiveChild(key)}
                size={{ width: 72, height: 32 }}
                style={[styles.pill, on && styles.pillOn]}>
                <Text style={[styles.pillText, on && styles.pillTextOn]}>{childData[key].firstName}</Text>
              </Press>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 12, paddingHorizontal: 18, paddingBottom: 10 },
  frost: {
    borderBottomWidth: 1,
    borderBottomColor: glass.border,
    boxShadow: `0 10px 28px -16px ${alpha(rgb.ink, 0.32)}`,
  },
  row: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: color.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // While Account is shown, the avatar is the current place: ringed, since no tab is marked.
  avatarOn: { boxShadow: `0 0 0 2px ${color.canvas}, 0 0 0 4px ${color.ink}` },
  backWrap: { marginLeft: -6 },
  back: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  // Centred on the bar, like the prototype's sub-screen h1.
  subTitle: {
    ...font(800),
    fontSize: 15,
    color: color.ink,
    position: 'absolute',
    left: 56,
    right: 56,
    textAlign: 'center',
  },
  greeting: { flex: 1, minWidth: 0 },
  greetLine: { ...font(600), fontSize: 12, lineHeight: 14, color: color.ink },
  greetName: { ...font(900), fontSize: 15, lineHeight: 18, color: color.ink, ...tracking(-0.01, 15) },
  // Pinned right, also on sub-screens, where no greeting fills the row.
  bellWrap: { marginLeft: 'auto' },
  bell: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: color.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: color.alert,
    borderWidth: 2,
    borderColor: color.ink,
  },
  switch: { flexDirection: 'row', gap: 6, marginTop: 10 },
  // Exactly the 32pt its hitSlop is worked out from (padding alone rendered 30, so the touch area was 42).
  pill: {
    height: 32,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: color.ink,
  },
  pillOn: { backgroundColor: color.ink },
  pillText: { ...font(800), fontSize: 13, color: color.ink },
  pillTextOn: { color: color.onInk },
});
