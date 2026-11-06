// Personal info (#sub-personal): the parent's photo, then name, phone and email, all editable. Each is checked
// before saving; a problem shows under its field and the first one takes focus. A new number is confirmed by code.
import { useRef, useState, type ComponentRef } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Panel } from '@/components/account/Rows';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Enter } from '@/components/Enter';
import { Field } from '@/components/Field';
import { Press } from '@/components/Press';
import { Screen } from '@/components/shell/Screen';
import { emailOk, initialsOf, phoneOk } from '@/lib/account';
import { useAccount } from '@/state/AccountContext';
import { useShell } from '@/state/ShellContext';
import { color } from '@/theme/tokens';
import { font } from '@/theme/type';

type Errors = { name?: string; phone?: string; email?: string };

export default function PersonalInfo() {
  const { profile, saveProfile, photos, setPhotoTarget } = useAccount();
  const { openSheet } = useShell();
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [email, setEmail] = useState(profile.email);
  const [errors, setErrors] = useState<Errors>({});
  const [saved, setSaved] = useState<string | null>(null);
  const nameRef = useRef<ComponentRef<typeof TextInput>>(null);
  const phoneRef = useRef<ComponentRef<typeof TextInput>>(null);
  const emailRef = useRef<ComponentRef<typeof TextInput>>(null);

  const save = () => {
    const n = name.trim();
    const p = phone.trim();
    const e = email.trim();
    const next: Errors = {
      name: n ? undefined : 'Enter your name.',
      phone: phoneOk(p) ? undefined : 'Enter a phone number, like +27 82 555 0142.',
      email: emailOk(e) ? undefined : 'Enter an email address, like you@example.com.',
    };
    setErrors(next);
    const first = (['name', 'phone', 'email'] as const).find((k) => next[k]);
    if (first) {
      setSaved(null);
      ({ name: nameRef, phone: phoneRef, email: emailRef })[first].current?.focus();
      return;
    }
    const phoneChanged = p !== profile.phone;
    saveProfile({ name: n, phone: p, email: e });
    setSaved(phoneChanged ? `Saved. We texted a code to ${p} to confirm it.` : 'Details updated.');
  };

  return (
    <Screen compactHeader>
      <Enter index={0}>
        <View style={styles.photo}>
          <Avatar initials={initialsOf(profile.name)} uri={photos.me} size={88} />
          <Press
            accessibilityRole="button"
            accessibilityLabel="Change photo"
            onPress={() => {
              setPhotoTarget('me');
              openSheet('photo');
            }}
            style={styles.link}>
            <Text style={styles.linkText}>Change photo</Text>
          </Press>
        </View>
      </Enter>
      <Enter index={1}>
        <Panel title="Your information" hint="Your school and your co-guardian see your name and phone number.">
          <Field
            ref={nameRef}
            label="Full name"
            value={name}
            onChangeText={setName}
            error={errors.name}
            autoComplete="name"
            textContentType="name"
            autoCapitalize="words"
          />
          <Field
            ref={phoneRef}
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            error={errors.phone}
            hint="A new number is confirmed with a texted code."
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
          />
          <Field
            ref={emailRef}
            label="Email"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            autoCapitalize="none"
          />
          <Button label="Save changes" onPress={save} />
          {!!saved && (
            <Text style={styles.saved} accessibilityLiveRegion="polite" role="status">
              {saved}
            </Text>
          )}
        </Panel>
      </Enter>
    </Screen>
  );
}

const styles = StyleSheet.create({
  photo: { alignItems: 'center', marginTop: 2, marginBottom: 10 },
  link: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 },
  linkText: { ...font(800), fontSize: 14, color: color.ink, textDecorationLine: 'underline' },
  saved: { ...font(700), fontSize: 12, color: color.green, marginTop: 8 },
});
