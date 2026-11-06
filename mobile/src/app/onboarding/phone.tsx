// Phone (#ob-verify): the number the school has on file. A phone keypad, checked before the code is sent, and
// the terms one tap away. CLAUDE.md gap 2: type "tel", a visible error.
import { router } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Press } from '@/components/Press';
import { Step } from '@/components/onboarding/Step';
import { phoneOk } from '@/lib/account';
import { useOnboarding } from '@/state/OnboardingContext';
import { color } from '@/theme/tokens';
import { font } from '@/theme/type';

export default function Phone() {
  const { phone, setPhone } = useOnboarding();
  const [value, setValue] = useState(phone);
  const [error, setError] = useState<string>();
  const input = useRef<ComponentRef<typeof TextInput>>(null);

  const send = () => {
    const p = value.trim();
    if (!phoneOk(p)) {
      setError('Enter the number you gave the school, like +27 82 555 0142.');
      input.current?.focus();
      return;
    }
    setError(undefined);
    setPhone(p);
    router.push('/onboarding/code');
  };

  return (
    <Step
      title="Let's find your child's link"
      sub="Enter the phone number you gave the school when your child was enrolled."
      actions={
        <>
          {/* The link is its own 44pt control (the prototype extends its inline link the same way). */}
          <View style={styles.termsRow}>
            <Text style={styles.terms}>By continuing, you agree to the </Text>
            <Press
              accessibilityRole="link"
              accessibilityLabel="Terms & conditions"
              onPress={() => router.push('/onboarding/terms')}
              pressScale={0}
              style={styles.termsLink}>
              <Text style={[styles.terms, styles.link]}>{'Terms & conditions'}</Text>
            </Press>
            <Text style={styles.terms}>.</Text>
          </View>
          <Button label="Send code" onPress={send} />
        </>
      }>
      <View style={styles.field}>
        <Field
          ref={input}
          label="Phone number"
          value={value}
          onChangeText={(t) => {
            setValue(t);
            if (error) setError(undefined);
          }}
          error={error}
          placeholder="+27 82 555 0142"
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          returnKeyType="send"
          onSubmitEditing={send}
        />
      </View>
    </Step>
  );
}

const styles = StyleSheet.create({
  field: { marginTop: 18 },
  termsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  terms: { ...font(400), fontSize: 12, lineHeight: 18, color: color.muted },
  termsLink: { minHeight: 44, justifyContent: 'center' },
  link: { ...font(800), color: color.ink, textDecorationLine: 'underline' },
});
