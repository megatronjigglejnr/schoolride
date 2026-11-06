// History: the active child's pickups and drop-offs, by day (renderHistory in the prototype).
import { StyleSheet, Text, View } from 'react-native';

import { Card, GroupLabel, PageTitle } from '@/components/Card';
import { Enter } from '@/components/Enter';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/shell/Screen';
import { children } from '@/data/children';
import { HISTORY_GROUPS, historyData } from '@/data/history';
import { useChild } from '@/state/ChildContext';
import { color } from '@/theme/tokens';
import { text } from '@/theme/text';

export default function HistoryTab() {
  const { activeChild } = useChild();
  const items = historyData[activeChild];
  const name = children[activeChild].firstName;

  return (
    <Screen>
      <Enter index={0}>
        <PageTitle>History</PageTitle>
      </Enter>
      <Enter index={1}>
        <GroupLabel>Today</GroupLabel>
        <Card style={styles.card}>
          <Text style={styles.empty}>{`Nothing logged yet today. ${name}'s ride is on its way.`}</Text>
        </Card>

        {HISTORY_GROUPS.map((g) => {
          const rows = items.filter((r) => r.group === g);
          if (!rows.length) return null;
          return (
            <View key={g}>
              <GroupLabel>{g}</GroupLabel>
              <Card style={styles.card}>
                {rows.map((r, i) => (
                  <View
                    key={r.title + r.time}
                    accessible
                    accessibilityLabel={`${r.title}, ${r.time}`}
                    style={[styles.row, i < rows.length - 1 && styles.rowRule]}>
                    <View style={styles.icon}>
                      <Icon name="checkSquare" size={15} />
                    </View>
                    <View style={styles.body}>
                      <Text style={text.itemTitle}>{r.title}</Text>
                      <Text style={[text.caption, styles.time]}>{r.time}</Text>
                    </View>
                  </View>
                ))}
              </Card>
            </View>
          );
        })}
      </Enter>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { paddingVertical: 4, paddingHorizontal: 16, marginBottom: 14 },
  empty: { ...text.body, fontSize: 14, color: color.muted, paddingVertical: 16, lineHeight: 21 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, paddingVertical: 12 },
  rowRule: { borderBottomWidth: 1, borderBottomColor: color.line },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: color.surfaceFlat,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  time: { marginTop: 2 },
});
