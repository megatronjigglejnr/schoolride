/**
 * Notifications, opened from the header bell (CLAUDE.md: notifications live in the bell, not the FAB).
 * Each item is tagged with a child. Tapping one marks it read; if it points somewhere, the app switches to that
 * child through setActiveChild, closes this screen and opens the place it refers to.
 */
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, GroupLabel } from '@/components/Card';
import { Icon, type IconName } from '@/components/Icon';
import { Press } from '@/components/Press';
import { SwitchTrack } from '@/components/Switch';
import { children } from '@/data/children';
import { NOTIFICATION_GROUPS, notificationPrefs, notifications } from '@/data/notifications';
import type { IconKind, Notification } from '@/data/types';
import { useChild } from '@/state/ChildContext';
import { text } from '@/theme/text';
import { color } from '@/theme/tokens';
import { font } from '@/theme/type';

const icons: Record<IconKind, IconName> = { move: 'pin', confirm: 'checkSquare', info: 'info' };

function close() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { unread, markRead, markAllRead, setActiveChild, notifPrefs, toggleNotifPref } = useChild();

  const open = (n: Notification) => {
    markRead(n.id);
    if (!n.goto) return;
    const target = n.goto;
    setActiveChild(n.child);
    close();
    // After this screen has left, open the place the notification is about (the prototype waits 150ms too).
    setTimeout(() => {
      if (target.tab === 'schedule') router.navigate({ pathname: '/schedule', params: { date: target.date } });
      else router.navigate(target.tab === 'track' ? '/' : '/history');
    }, 150);
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.bar, { paddingTop: Math.max(16, insets.top) }]}>
        <Press
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={close}
          containerStyle={[styles.backWrap, { top: Math.max(16, insets.top) - 6 }]}
          style={styles.back}>
          <Icon name="chevronLeft" size={18} strokeWidth={2.2} />
        </Press>
        <Text accessibilityRole="header" style={styles.title}>
          Notifications
        </Text>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 18 + insets.bottom }]}>
        <View style={styles.toprow}>
          <Press
            accessibilityRole="button"
            accessibilityLabel="Mark all read"
            onPress={markAllRead}
            pressScale={0}
            style={styles.markReadBtn}>
            <Text style={styles.markRead}>Mark all read</Text>
          </Press>
        </View>

        {NOTIFICATION_GROUPS.filter((g) => notifications.some((n) => n.group === g)).map((g, gi) => {
          const items = notifications.filter((n) => n.group === g);
          return (
            <View key={g} style={gi > 0 && styles.group}>
              <GroupLabel>{g}</GroupLabel>
              {items.map((n, i) => {
                const isUnread = unread.has(n.id);
                const who = children[n.child].firstName;
                return (
                  <Press
                    key={n.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${isUnread ? 'Unread: ' : ''}${n.title}, ${n.time}, ${who}`}
                    onPress={() => open(n)}
                    pressScale={0.99}
                    style={[styles.item, i < items.length - 1 && styles.itemRule]}>
                    <View style={styles.icon}>
                      <Icon name={icons[n.icon]} size={15} color={n.icon === 'info' ? color.muted : color.ink} />
                    </View>
                    <View style={styles.body}>
                      <Text style={[styles.itemTitle, !isUnread && styles.itemTitleRead]}>{n.title}</Text>
                      <View style={styles.meta}>
                        <Text style={text.caption}>{n.time}</Text>
                        <View style={styles.who}>
                          <Text style={styles.whoText}>{who}</Text>
                        </View>
                      </View>
                    </View>
                    {isUnread && <View style={styles.dot} />}
                  </Press>
                );
              })}
            </View>
          );
        })}

        <Card style={styles.prefs}>
          <Text accessibilityRole="header" style={[text.cardTitle, styles.prefsTitle]}>
            Notification preferences
          </Text>
          {notificationPrefs.map((p) => {
            const on = notifPrefs[p.id];
            return (
              <Press
                key={p.id}
                accessibilityRole="switch"
                accessibilityLabel={p.label}
                accessibilityState={{ checked: on }}
                onPress={() => toggleNotifPref(p.id)}
                pressScale={0}
                style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>{p.label}</Text>
                <SwitchTrack on={on} />
              </Press>
            );
          })}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.canvas },
  bar: { paddingBottom: 10, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  backWrap: { position: 'absolute', left: 8 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { ...font(800), fontSize: 15, color: color.ink, lineHeight: 34 },
  content: { paddingTop: 8, paddingHorizontal: 18 },
  group: { marginTop: 14 },
  toprow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 2, marginTop: -8 },
  // A real 44pt box: a hitSlop guessed around the text came to 42.
  markReadBtn: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8, marginRight: -8 },
  markRead: { ...font(800), fontSize: 12, color: color.ink, textDecorationLine: 'underline' },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    paddingVertical: 10,
    paddingHorizontal: 4,
    minHeight: 54,
  },
  itemRule: { borderBottomWidth: 1, borderBottomColor: color.line },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: color.surfaceFlat,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  itemTitle: { ...font(700), fontSize: 13, lineHeight: 16, color: color.ink },
  itemTitleRead: { ...font(500), color: color.muted },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  who: {
    marginLeft: 8,
    backgroundColor: color.surfaceFlat,
    borderRadius: 999,
    paddingVertical: 1,
    paddingHorizontal: 9,
  },
  whoText: { ...font(800), fontSize: 12, color: color.ink },
  dot: { width: 7, height: 7, borderRadius: 4, marginTop: 5, backgroundColor: color.ink },
  prefs: { marginTop: 16, padding: 16 },
  prefsTitle: { marginBottom: 3 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48 },
  toggleLabel: { ...font(600), fontSize: 13, color: color.ink, flexShrink: 1, paddingRight: 12 },
});
