// The account list parts (.row-list, .row-item, .person-row, .section-label, .panel in the prototype).
import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Card } from '@/components/Card';
import { Icon, type IconName } from '@/components/Icon';
import { Press } from '@/components/Press';
import { text } from '@/theme/text';
import { color } from '@/theme/tokens';
import { font } from '@/theme/type';

export function SectionLabel({ children }: { children: string }) {
  return (
    <Text accessibilityRole="header" style={styles.section}>
      {children}
    </Text>
  );
}

export function SectionHint({ children }: { children: string }) {
  return <Text style={styles.sectionHint}>{children}</Text>;
}

/** A white card holding rows, each divided by a hairline. */
export function RowList({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <Card style={[styles.list, style]}>{children}</Card>;
}

/** The panel: a card with a title, an optional hint, and its content. */
export function Panel({ title, hint, children }: { title?: string; hint?: string; children: ReactNode }) {
  return (
    <Card style={styles.panel}>
      {!!title && (
        <Text accessibilityRole="header" style={[text.cardTitle, styles.panelTitle]}>
          {title}
        </Text>
      )}
      {!!hint && <Text style={[text.caption, styles.panelHint]}>{hint}</Text>}
      {children}
    </Card>
  );
}

type RowProps = {
  icon: IconName;
  label: string;
  sub?: string;
  onPress?: () => void;
  /** A chevron for rows that open another screen. */
  chevron?: boolean;
  /** Something on the right instead of a chevron, e.g. a "Soon" tag. */
  trailing?: ReactNode;
  last?: boolean;
};

export function RowItem({ icon, label, sub, onPress, chevron, trailing, last }: RowProps) {
  const body = (
    <>
      <View style={styles.rowIcon}>
        <Icon name={icon} size={15} />
      </View>
      <View style={styles.rowText}>
        <Text style={text.rowLabel}>{label}</Text>
        {!!sub && <Text style={[text.caption, styles.rowSub]}>{sub}</Text>}
      </View>
      {trailing}
      {chevron && <Icon name="chevronRight" size={15} color={color.muted} />}
    </>
  );
  if (!onPress) {
    return (
      <View accessible accessibilityLabel={label} style={[styles.row, !last && styles.rule]}>
        {body}
      </View>
    );
  }
  return (
    <Press
      accessibilityRole="button"
      accessibilityLabel={sub ? `${label}, ${sub}` : label}
      onPress={onPress}
      pressScale={0}
      style={[styles.row, !last && styles.rule]}>
      {body}
    </Press>
  );
}

/** A small grey tag on the right of a row ("Soon", "Not used"); ink when it says something is on. */
export function Tag({ children, on }: { children: string; on?: boolean }) {
  return (
    <View style={[styles.tag, on && styles.tagOn]}>
      <Text style={[styles.tagText, on && styles.tagTextOn]}>{children}</Text>
    </View>
  );
}

export const rowStyles = StyleSheet.create({
  rule: { borderBottomWidth: 1, borderBottomColor: color.line },
});

const styles = StyleSheet.create({
  section: { ...text.label, ...font(800), letterSpacing: 0.24, marginTop: 4, marginBottom: 10, marginHorizontal: 2 },
  sectionHint: { ...text.caption, marginTop: -4, marginBottom: 10, marginHorizontal: 2 },
  list: { marginBottom: 16, overflow: 'hidden' },
  panel: { padding: 16, marginBottom: 14 },
  panelTitle: { marginBottom: 3 },
  panelHint: { marginBottom: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    minHeight: 60,
  },
  rule: rowStyles.rule,
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: color.surfaceFlat,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, minWidth: 0 },
  rowSub: { marginTop: 1, lineHeight: 16 },
  tag: { backgroundColor: color.surfaceFlat, borderRadius: 999, paddingVertical: 3, paddingHorizontal: 9 },
  tagOn: { backgroundColor: color.ink },
  tagText: { ...font(800), fontSize: 12, color: color.ink },
  tagTextOn: { color: color.onInk },
});
