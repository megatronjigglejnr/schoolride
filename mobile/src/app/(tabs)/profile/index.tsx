// Account (#sub-account): the parent's photo and name, then their sections. Opened from the header avatar.
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { RowItem, RowList, SectionLabel, Tag } from '@/components/account/Rows';
import { Avatar } from '@/components/Avatar';
import { PageTitle } from '@/components/Card';
import { Enter } from '@/components/Enter';
import { Icon } from '@/components/Icon';
import { Press } from '@/components/Press';
import { Screen } from '@/components/shell/Screen';
import { initialsOf } from '@/lib/account';
import { useAccount } from '@/state/AccountContext';
import { useShell } from '@/state/ShellContext';
import { text } from '@/theme/text';
import { alpha, color, rgb } from '@/theme/tokens';

export default function AccountScreen() {
  const { profile, photos, setPhotoTarget } = useAccount();
  const { openSheet } = useShell();

  const changePhoto = () => {
    setPhotoTarget('me');
    openSheet('photo');
  };

  return (
    <Screen compactHeader>
      <Enter index={0}>
        <PageTitle>Account</PageTitle>
      </Enter>
      <Enter index={1}>
        <View style={styles.profile}>
          <Press
            accessibilityRole="button"
            accessibilityLabel="Change profile photo"
            onPress={changePhoto}
            style={styles.avatarWrap}>
            <Avatar initials={initialsOf(profile.name)} uri={photos.me} size={54} />
            <View style={styles.edit}>
              <Icon name="camera" size={12} strokeWidth={2.4} />
            </View>
          </Press>
          <View style={styles.who}>
            <Text style={text.nameLarge}>{profile.name}</Text>
            <Text style={styles.phone}>{profile.phone}</Text>
          </View>
        </View>
      </Enter>
      <Enter index={2}>
        <SectionLabel>Your account</SectionLabel>
        <RowList>
          <RowItem icon="user" label="Personal info" chevron onPress={() => router.push('/profile/personal')} />
          <RowItem icon="users" label="Family" chevron onPress={() => router.push('/profile/family')} />
          <RowItem icon="eye" label="Privacy" chevron onPress={() => router.push('/profile/privacy')} />
          <RowItem icon="shield" label="Login & security" chevron onPress={() => router.push('/profile/security')} />
          <RowItem icon="card" label="Payment" trailing={<Tag>Soon</Tag>} last />
        </RowList>
      </Enter>
      <Enter index={3}>
        <SectionLabel>About</SectionLabel>
        <RowList>
          <RowItem icon="file" label="Terms & conditions" chevron onPress={() => router.push('/profile/terms')} last />
        </RowList>
        <Text style={styles.version}>SchoolRide · prototype</Text>
      </Enter>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingTop: 8,
    paddingHorizontal: 4,
    paddingBottom: 18,
  },
  avatarWrap: { width: 54, height: 54 },
  edit: {
    position: 'absolute',
    right: -3,
    bottom: -3,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: color.card,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `0 0 0 2px ${color.canvas}, 0 2px 6px ${alpha(rgb.ink, 0.25)}`,
  },
  who: { flex: 1, minWidth: 0 },
  phone: { ...text.caption, fontSize: 12.5, marginTop: 2 },
  version: { ...text.caption, textAlign: 'center', marginTop: 4 },
});
