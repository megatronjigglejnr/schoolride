// A labelled text field (.field): label above, a 48pt input, then a hint and, after a failed save, a visible
// error that is also announced and read as the field's description.
import type { ComponentRef, Ref } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { color } from '@/theme/tokens';
import { font } from '@/theme/type';
import { text } from '@/theme/text';

type Props = Omit<TextInputProps, 'style'> & {
  label: string;
  hint?: string;
  error?: string;
  ref?: Ref<ComponentRef<typeof TextInput>>;
};

export function Field({ label, hint, error, ref, ...input }: Props) {
  const described = [error, hint].filter(Boolean).join('. ');
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        accessibilityHint={described || undefined}
        aria-invalid={error ? true : undefined}
        placeholderTextColor={color.muted}
        style={[styles.input, !!error && styles.inputError]}
        {...input}
      />
      {!!error && (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      )}
      {!!hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: 10 },
  label: { ...text.label, marginBottom: 5 },
  input: {
    minHeight: 48,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: color.fieldLine,
    backgroundColor: color.card,
    color: color.ink,
    fontSize: 16,
    ...font(400),
  },
  inputError: { borderColor: color.alert },
  error: { ...font(700), fontSize: 12, color: color.alert, marginTop: 5 },
  hint: { ...text.caption, marginTop: 5, lineHeight: 17 },
});
