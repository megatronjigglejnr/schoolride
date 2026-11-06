// Under the live map: every child linked to this account, with their bus's approximate distance from home.
// It is measured from the child's home, so it reads the same whether the parent is at home or away, and it
// needs no location permission. Privacy (CLAUDE.md): only the parent's own children appear here.
import { StyleSheet, Text, View } from 'react-native';

import { children } from '@/data/children';
import { trackData } from '@/data/track';
import { CHILD_KEYS } from '@/data/types';
import { useChild } from '@/state/ChildContext';
import { color } from '@/theme/tokens';
import { font } from '@/theme/type';

export function DistanceRows() {
  const { signals } = useChild();
  return (
    <View role="list" accessibilityLabel="Each child's distance from home" style={styles.list}>
      {CHILD_KEYS.map((key, i) => {
        const c = children[key];
        const d = trackData[key];
        const where = (signals[key].lost ? 'Last seen near ' : 'Bus near ') + d.dest;
        const km = d.homeKm.toFixed(1);
        return (
          <View
            key={key}
            role="listitem"
            accessible
            accessibilityLabel={`${c.firstName}: about ${km} kilometres from home. ${where}.`}
            style={[styles.row, i > 0 && styles.rowRule]}>
            <View style={[styles.avatar, c.avatar === 'muted' && styles.avatarMuted]}>
              <Text style={[styles.avatarText, c.avatar === 'muted' && styles.avatarTextMuted]}>{c.firstName.charAt(0)}</Text>
            </View>
            <View style={styles.text}>
              <Text style={styles.name}>{c.firstName}</Text>
              <Text style={styles.where} numberOfLines={1}>
                {where}
              </Text>
            </View>
            <View style={styles.km}>
              <Text style={styles.value}>{km} km</Text>
              <Text style={styles.unit}>from home</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { paddingTop: 2, paddingHorizontal: 16, paddingBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60, paddingVertical: 10 },
  rowRule: { borderTopWidth: 1, borderTopColor: color.line },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: color.ink, alignItems: 'center', justifyContent: 'center' },
  avatarMuted: { backgroundColor: color.line },
  avatarText: { ...font(900), fontSize: 13, color: color.onInk },
  avatarTextMuted: { color: color.ink },
  text: { flex: 1, minWidth: 0 },
  name: { ...font(800), fontSize: 15, color: color.ink },
  where: { ...font(600), fontSize: 13, color: color.muted },
  km: { alignItems: 'flex-end' },
  value: { ...font(800), fontSize: 15, color: color.ink, fontVariant: ['tabular-nums'] },
  unit: { ...font(600), fontSize: 12, color: color.muted },
});
