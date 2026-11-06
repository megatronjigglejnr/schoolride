// The two shared building blocks of every tab: the page title (.page-title) and the raised card
// (white, 22px radius, the two-layer aubergine shadow). docs/design-system.md allows only two card styles.
import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { text } from '@/theme/text';
import { color, shadow } from '@/theme/tokens';

export function PageTitle({ children }: { children: string }) {
  return (
    <Text accessibilityRole="header" style={styles.title}>
      {children}
    </Text>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** A small grey label over a group of cards (.notif-group-label). */
export function GroupLabel({ children }: { children: string }) {
  return <Text style={styles.group}>{children}</Text>;
}

const styles = StyleSheet.create({
  title: { ...text.pageTitle, marginTop: 4, marginHorizontal: 2, marginBottom: 16 },
  card: { backgroundColor: color.card, borderRadius: 22, boxShadow: shadow.raised },
  // The card above already leaves 14px; the prototype's margins collapse, React Native's don't.
  group: { ...text.label, marginBottom: 8, marginHorizontal: 2 },
});
