// Family (#sub-family): the children the schools linked (with their photos), the guardians, and the parent's
// trusted family friends. No self-service linking: "Add a child" says to contact the school. Friends get nothing
// unless the parent shares a day's ETA with them, and collecting a child still needs the school's approval.
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { RowItem, RowList, SectionHint, SectionLabel, rowStyles } from '@/components/account/Rows';
import { Avatar } from '@/components/Avatar';
import { Card } from '@/components/Card';
import { Enter } from '@/components/Enter';
import { Icon } from '@/components/Icon';
import { Press } from '@/components/Press';
import { Screen } from '@/components/shell/Screen';
import { coGuardian } from '@/data/account';
import { children } from '@/data/children';
import { CHILD_KEYS, type ChildKey } from '@/data/types';
import { initialsOf } from '@/lib/account';
import { useAccount } from '@/state/AccountContext';
import { useShell } from '@/state/ShellContext';
import { text } from '@/theme/text';
import { color } from '@/theme/tokens';
import { font } from '@/theme/type';

function ChildCard({ id }: { id: ChildKey }) {
  const c = children[id];
  const { photos, setPhotoTarget } = useAccount();
  const { openSheet } = useShell();
  const [open, setOpen] = useState(false);

  return (
    <Card style={styles.child}>
      <Press
        accessibilityRole="button"
        accessibilityLabel={`${c.fullName}, ${c.school}, ${c.grade}`}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(!open)}
        pressScale={0}
        style={styles.childHead}>
        <Avatar initials={c.firstName[0]} uri={photos[id]} tone={c.avatar === 'muted' ? 'muted' : 'ink'} />
        <View style={styles.info}>
          <Text style={text.itemTitle}>{c.fullName}</Text>
          <Text style={text.caption}>{`${c.school} · ${c.grade}`}</Text>
        </View>
        <View style={open && styles.chevOpen}>
          <Icon name="chevronRight" size={15} color={color.muted} />
        </View>
      </Press>
      {open && (
        <View style={styles.childBody}>
          <View style={[styles.detail, styles.detailFirst]}>
            <Text style={styles.detailKey}>Route</Text>
            <Text style={styles.detailVal}>{c.routeName}</Text>
          </View>
          <View style={styles.detail}>
            <Text style={styles.detailKey}>Pickup area</Text>
            <Text style={styles.detailVal}>{c.pickupArea}</Text>
          </View>
          <Press
            accessibilityRole="button"
            accessibilityLabel={`Change ${c.firstName}'s photo`}
            onPress={() => {
              setPhotoTarget(id);
              openSheet('photo');
            }}
            style={styles.link}>
            <Text style={styles.linkText}>{`Change ${c.firstName}'s photo`}</Text>
          </Press>
          <Text
            style={text.caption}>{`Linked by ${c.school}. Contact the school to update route or pickup details.`}</Text>
        </View>
      )}
    </Card>
  );
}

export default function Family() {
  const { profile, photos, friends, removeFriend } = useAccount();
  const { openSheet, showToast } = useShell();

  return (
    <Screen compactHeader>
      <Enter index={0}>
        <SectionLabel>Children · linked by their schools</SectionLabel>
        {CHILD_KEYS.map((k) => (
          <ChildCard key={k} id={k} />
        ))}
        <RowList>
          <RowItem
            icon="plus"
            label="Add a child"
            onPress={() => showToast('Contact your school to link an additional child')}
            last
          />
        </RowList>
      </Enter>

      <Enter index={1}>
        <SectionLabel>Guardians</SectionLabel>
        <RowList>
          <View accessible accessibilityLabel={`${profile.name}, you`} style={[styles.person, rowStyles.rule]}>
            <Avatar initials={initialsOf(profile.name)} uri={photos.me} />
            <View style={styles.info}>
              <Text style={text.itemTitle}>{profile.name}</Text>
              <Text style={text.caption}>You</Text>
            </View>
          </View>
          <View
            accessible
            accessibilityLabel={`${coGuardian.name}, co-guardian, linked by the school`}
            style={styles.person}>
            <Avatar initials={initialsOf(coGuardian.name)} tone="muted" />
            <View style={styles.info}>
              <Text style={text.itemTitle}>{coGuardian.name}</Text>
              <Text style={text.caption}>Co-guardian · linked by the school</Text>
            </View>
          </View>
        </RowList>
      </Enter>

      <Enter index={2}>
        <SectionLabel>Trusted family friends</SectionLabel>
        <SectionHint>
          {
            "People you can share a ride's live ETA with in one tap. They see nothing unless you share, and only for that day. To collect a child, they also need the school's approval."
          }
        </SectionHint>
        {friends.length > 0 && (
          <RowList>
            {friends.map((f, i) => (
              <View key={f.id} style={[styles.person, styles.friend, i < friends.length - 1 && rowStyles.rule]}>
                <Avatar initials={initialsOf(f.name)} tone="muted" />
                <View style={styles.info} accessible accessibilityLabel={`${f.name}, ${f.relation}, ${f.phone}`}>
                  <Text style={text.itemTitle}>{f.name}</Text>
                  <Text style={text.caption}>{`${f.relation} · ${f.phone}`}</Text>
                </View>
                <Press
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${f.name}`}
                  onPress={() => {
                    removeFriend(f.id);
                    showToast(`${f.name} removed`);
                  }}
                  style={styles.remove}>
                  <Icon name="close" size={15} strokeWidth={2.2} color={color.muted} />
                </Press>
              </View>
            ))}
          </RowList>
        )}
        <RowList>
          <RowItem icon="plus" label="Add a trusted friend" onPress={() => openSheet('friend')} last />
        </RowList>
      </Enter>
    </Screen>
  );
}

const styles = StyleSheet.create({
  child: { marginBottom: 10, overflow: 'hidden' },
  childHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minHeight: 60,
  },
  info: { flex: 1, minWidth: 0 },
  chevOpen: { transform: [{ rotate: '90deg' }] },
  childBody: { paddingHorizontal: 14, paddingBottom: 14 },
  detail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderTopWidth: 1,
    borderTopColor: color.line,
  },
  detailFirst: {},
  detailKey: { ...font(400), fontSize: 13, color: color.muted },
  detailVal: { ...font(600), fontSize: 13, color: color.ink },
  link: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  linkText: { ...font(800), fontSize: 14, color: color.ink, textDecorationLine: 'underline' },
  person: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 10,
    paddingLeft: 14,
    paddingRight: 14,
    minHeight: 60,
  },
  friend: { paddingRight: 6 },
  remove: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
