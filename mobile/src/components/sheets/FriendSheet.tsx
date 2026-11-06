// Add a trusted friend (the friend sheet in the prototype): name, phone and how they're related. Checked before
// adding; they then appear in Family and in Share ETA.
import { useRef, useState, type ComponentRef } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Press } from '@/components/Press';
import { Sheet } from '@/components/Sheet';
import { RELATIONS, type Relation } from '@/data/account';
import { phoneOk } from '@/lib/account';
import { useAccount } from '@/state/AccountContext';
import { useShell } from '@/state/ShellContext';
import { text } from '@/theme/text';
import { color } from '@/theme/tokens';
import { font } from '@/theme/type';

export function FriendSheet() {
  const { sheet, closeSheet } = useShell();
  // The form is mounted only while the sheet is, so it starts empty each time it opens.
  return (
    <Sheet open={sheet === 'friend'} title="Add a trusted friend" onClose={closeSheet}>
      <FriendForm />
    </Sheet>
  );
}

function FriendForm() {
  const { closeSheet, showToast } = useShell();
  const { addFriend } = useAccount();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relation, setRelation] = useState<Relation>('Grandparent');
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const nameRef = useRef<ComponentRef<typeof TextInput>>(null);
  const phoneRef = useRef<ComponentRef<typeof TextInput>>(null);

  const add = () => {
    const n = name.trim();
    const p = phone.trim();
    const next = {
      name: n ? undefined : 'Enter their name.',
      phone: phoneOk(p) ? undefined : 'Enter their phone number.',
    };
    setErrors(next);
    if (next.name) return nameRef.current?.focus();
    if (next.phone) return phoneRef.current?.focus();
    addFriend({ name: n, phone: p, relation });
    closeSheet();
    setTimeout(() => showToast(`${n} added as a trusted friend`), 200);
  };

  return (
    <>
      <Field
        ref={nameRef}
        label="Name"
        value={name}
        onChangeText={setName}
        error={errors.name}
        autoCapitalize="words"
      />
      <Field
        ref={phoneRef}
        label="Phone"
        value={phone}
        onChangeText={setPhone}
        error={errors.phone}
        keyboardType="phone-pad"
      />
      <Text style={styles.label}>Relationship</Text>
      <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel="Relationship">
        {RELATIONS.map((r) => {
          const on = r === relation;
          return (
            <Press
              key={r}
              accessibilityRole="radio"
              accessibilityLabel={r}
              accessibilityState={{ checked: on }}
              onPress={() => setRelation(r)}
              style={[styles.chip, on && styles.chipOn]}>
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{r}</Text>
            </Press>
          );
        })}
      </View>
      <View style={styles.submit}>
        <Button label="Add friend" onPress={add} />
      </View>
      <Text style={styles.hint}>
        {"We'll text them that you've added them. They see a ride only when you share it."}
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  label: { ...text.label, marginBottom: 5 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: color.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: color.ink },
  chipText: { ...font(800), fontSize: 13, color: color.ink },
  chipTextOn: { color: color.onInk },
  submit: { marginTop: 6 },
  hint: { ...text.caption, marginTop: 12 },
});
