// Share live ETA (the share sheet in the prototype): the co-guardian the school linked, then the parent's own
// trusted family friends, and today only. Privacy: never anyone else on the route.
import { StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Press } from '@/components/Press';
import { Sheet } from '@/components/Sheet';
import { coGuardian } from '@/data/account';
import { children } from '@/data/children';
import { initialsOf } from '@/lib/account';
import { useAccount } from '@/state/AccountContext';
import { useChild } from '@/state/ChildContext';
import { useShell } from '@/state/ShellContext';
import { text } from '@/theme/text';
import { color } from '@/theme/tokens';
import { font } from '@/theme/type';

export function ShareSheet() {
  const { sheet, closeSheet, showToast } = useShell();
  const { activeChild } = useChild();
  const name = children[activeChild].firstName;

  const { friends } = useAccount();
  const people = [
    { name: coGuardian.name, role: `Also linked to ${name}` },
    ...friends.map((f) => ({ name: f.name, role: `Trusted friend · ${f.relation}` })),
  ];

  const share = (who: string) => {
    closeSheet();
    setTimeout(() => showToast('ETA shared with ' + who), 200);
  };

  return (
    <Sheet open={sheet === 'share'} title="Share live ETA" onClose={closeSheet}>
      {people.map((p) => (
        <View key={p.name} style={styles.row}>
          <View style={styles.left}>
            <Avatar initials={initialsOf(p.name)} tone="muted" />
            <View style={styles.who}>
              <Text style={text.itemTitle}>{p.name}</Text>
              <Text style={text.caption}>{p.role}</Text>
            </View>
          </View>
          <Press
            accessibilityRole="button"
            accessibilityLabel={`Share with ${p.name}`}
            onPress={() => share(p.name)}
            style={styles.btn}>
            <Text style={styles.btnText}>Share</Text>
          </Press>
        </View>
      ))}
      <Text style={styles.hint}>
        {`They'll see today's live tracking for ${name} — nothing is shared beyond today.`}
      </Text>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 2,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 11, flexShrink: 1 },
  who: { flexShrink: 1 },
  btn: {
    minHeight: 44,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: color.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { ...font(800), fontSize: 12, color: color.onInk },
  hint: { ...text.caption, marginTop: 12 },
});
