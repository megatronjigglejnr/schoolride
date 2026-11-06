// Privacy (#sub-privacy): what SchoolRide tracks (the bus, by the school; never the parent's phone), the two
// optional data switches (off by default), a copy of the parent's data, and the terms.
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Panel, RowItem, RowList, Tag } from '@/components/account/Rows';
import { Button } from '@/components/Button';
import { Enter } from '@/components/Enter';
import { Press } from '@/components/Press';
import { Screen } from '@/components/shell/Screen';
import { SwitchTrack } from '@/components/Switch';
import { useAccount, type PrivacyKey } from '@/state/AccountContext';
import { text } from '@/theme/text';
import { color } from '@/theme/tokens';
import { font } from '@/theme/type';

const statuses = [
  {
    label: 'Bus location',
    hint: 'Shared by your school during rides. It tracks the bus, never you.',
    tag: 'On',
    on: true,
  },
  {
    label: "Your phone's location",
    hint: 'Not used. Distances are measured from your home address.',
    tag: 'Not used',
    on: false,
  },
];
const switches: { key: PrivacyKey; label: string; hint: string }[] = [
  { key: 'analytics', label: 'Usage analytics', hint: 'Anonymous counts of which screens are used.' },
  { key: 'crash', label: 'Crash reports', hint: 'Technical details sent when the app crashes.' },
];

export default function Privacy() {
  const { privacy, togglePrivacy, dataRequested, requestData, profile } = useAccount();

  return (
    <Screen compactHeader>
      <Enter index={0}>
        <Panel title="Tracking services" hint="What SchoolRide tracks, and what you can switch off.">
          {statuses.map((s) => (
            <View key={s.label} accessible accessibilityLabel={`${s.label}: ${s.tag}. ${s.hint}`} style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.label}>{s.label}</Text>
                <Text style={[text.caption, styles.hint]}>{s.hint}</Text>
              </View>
              <Tag on={s.on}>{s.tag}</Tag>
            </View>
          ))}
          {switches.map((s) => (
            <Press
              key={s.key}
              accessibilityRole="switch"
              accessibilityLabel={s.label}
              accessibilityHint={s.hint}
              accessibilityState={{ checked: privacy[s.key] }}
              onPress={() => togglePrivacy(s.key)}
              pressScale={0}
              style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.label}>{s.label}</Text>
                <Text style={[text.caption, styles.hint]}>{s.hint}</Text>
              </View>
              <SwitchTrack on={privacy[s.key]} />
            </Press>
          ))}
        </Panel>
      </Enter>
      <Enter index={1}>
        <Panel
          title="Your data"
          hint="Get a copy of what SchoolRide holds about you and your children: your profile, linked children, ride history and settings.">
          <Button
            label={dataRequested ? 'Requested' : 'Request my data'}
            tone={dataRequested ? 'done' : 'dark'}
            onPress={requestData}
          />
          {dataRequested && (
            <Text style={styles.saved} accessibilityLiveRegion="polite" role="status">
              {`We'll email a copy to ${profile.email} within 30 days.`}
            </Text>
          )}
        </Panel>
      </Enter>
      <Enter index={2}>
        <RowList>
          <RowItem icon="file" label="Terms & conditions" chevron onPress={() => router.push('/profile/terms')} last />
        </RowList>
      </Enter>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: color.line,
    minHeight: 48,
  },
  rowText: { flex: 1, minWidth: 0 },
  label: { ...font(600), fontSize: 13, color: color.ink },
  hint: { marginTop: 2 },
  saved: { ...font(700), fontSize: 12, color: color.green, marginTop: 8 },
});
