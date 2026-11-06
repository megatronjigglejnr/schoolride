// An onboarding step (.onboard-step): the canvas, 26pt side margins, the safe area, and a title and sub-line at
// the top. Content between them; the actions sit at the bottom, above the keyboard when it is open.
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Enter } from '@/components/Enter';
import { color } from '@/theme/tokens';
import { font, tracking } from '@/theme/type';

type Props = { title?: string; sub?: ReactNode; children?: ReactNode; actions?: ReactNode };

export function Step({ title, sub, children, actions }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { paddingTop: Math.max(28, insets.top + 12), paddingBottom: Math.max(24, insets.bottom + 8) },
        ]}>
        {!!title && (
          <Enter index={0}>
            <Text accessibilityRole="header" style={styles.title}>
              {title}
            </Text>
            {typeof sub === 'string' ? <Text style={styles.sub}>{sub}</Text> : sub}
          </Enter>
        )}
        <Enter index={1} style={styles.body}>
          {children}
        </Enter>
        {actions && <Enter index={2}>{actions}</Enter>}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export const stepText = StyleSheet.create({
  sub: { ...font(400), fontSize: 13, lineHeight: 19.5, color: color.muted },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.canvas },
  content: { flexGrow: 1, paddingHorizontal: 26 },
  title: { ...font(900), fontSize: 19, color: color.ink, marginBottom: 4, ...tracking(-0.02, 19) },
  sub: stepText.sub,
  body: { flexGrow: 1 },
});
