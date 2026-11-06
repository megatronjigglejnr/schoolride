// Confirm (#ob-confirm): the children the schools linked to this number, each "Verified". Nothing to set up.
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Step } from '@/components/onboarding/Step';
import { children } from '@/data/children';
import { CHILD_KEYS } from '@/data/types';
import { text } from '@/theme/text';
import { color } from '@/theme/tokens';
import { font } from '@/theme/type';

export default function Confirm() {
  return (
    <Step
      title="You're linked to"
      sub="Confirmed by each child's school — no setup needed on your end."
      actions={<Button label="Continue" onPress={() => router.push('/onboarding/permission')} />}>
      <View style={styles.list}>
        {CHILD_KEYS.map((k) => {
          const c = children[k];
          return (
            <Card key={k} style={styles.row}>
              <View style={styles.inner} accessible accessibilityLabel={`${c.fullName}, ${c.school}, verified`}>
                <Avatar initials={c.firstName[0]} tone={c.avatar === 'muted' ? 'muted' : 'ink'} />
                <View style={styles.info}>
                  <Text style={text.itemTitle}>{c.fullName}</Text>
                  <Text style={text.caption}>{c.school}</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>✓ Verified</Text>
                </View>
              </View>
            </Card>
          );
        })}
      </View>
    </Step>
  );
}

const styles = StyleSheet.create({
  list: { marginTop: 18, gap: 10 },
  row: { padding: 14 },
  inner: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  info: { flex: 1, minWidth: 0 },
  badge: { backgroundColor: color.greenSoft, borderRadius: 20, paddingVertical: 4, paddingHorizontal: 9 },
  badgeText: { ...font(700), fontSize: 12, color: color.greenInk },
});
