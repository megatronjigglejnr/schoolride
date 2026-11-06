// Stand-in for a tab whose screen is ported in a later phase (docs/rn-port-plan.md). It keeps the real page
// title, so the shell can be tried end to end, and says plainly what will be here.
import { StyleSheet, Text } from 'react-native';

import { Card, PageTitle } from '@/components/Card';
import { Enter } from '@/components/Enter';
import { text } from '@/theme/text';

import { Screen } from './Screen';

export function ComingTab({
  title,
  phase,
  what,
  compactHeader,
}: {
  title: string;
  phase: number;
  what: string;
  compactHeader?: boolean;
}) {
  return (
    <Screen compactHeader={compactHeader}>
      <Enter index={0}>
        <PageTitle>{title}</PageTitle>
      </Enter>
      <Enter index={1}>
        <Card style={styles.card}>
          <Text style={text.cardTitle}>Arrives in phase {phase}</Text>
          <Text style={[text.body, styles.body]}>{what}</Text>
        </Card>
      </Enter>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { padding: 18 },
  body: { marginTop: 4 },
});
