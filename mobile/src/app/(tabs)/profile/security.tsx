// Login & security (#sub-security): change password, and the optional recovery email behind a switch that is
// off by default (CLAUDE.md). The switch lives in AccountContext, so it survives leaving this screen.
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Panel } from '@/components/account/Rows';
import { Button } from '@/components/Button';
import { Enter } from '@/components/Enter';
import { Field } from '@/components/Field';
import { Press } from '@/components/Press';
import { Screen } from '@/components/shell/Screen';
import { SwitchTrack } from '@/components/Switch';
import { useAccount } from '@/state/AccountContext';
import { text } from '@/theme/text';
import { color } from '@/theme/tokens';
import { font } from '@/theme/type';

const RECOVERY_HINT = 'Optional — lets you reset your password if you forget it.';

export default function Security() {
  const { recovery, setRecovery } = useAccount();
  const [pwSaved, setPwSaved] = useState(false);
  const [emailSaved, setEmailSaved] = useState(false);

  const flash = (set: (v: boolean) => void) => {
    set(true);
    setTimeout(() => set(false), 2200);
  };

  return (
    <Screen compactHeader>
      <Enter index={0}>
        <Panel title="Change password" hint="Use at least 8 characters, with a mix of letters and numbers.">
          <Field
            label="Current password"
            secureTextEntry
            placeholder="••••••••"
            autoComplete="current-password"
            textContentType="password"
          />
          <Field
            label="New password"
            secureTextEntry
            placeholder="••••••••"
            autoComplete="new-password"
            textContentType="newPassword"
          />
          <Field
            label="Confirm new password"
            secureTextEntry
            placeholder="••••••••"
            autoComplete="new-password"
            textContentType="newPassword"
          />
          <Button label="Update password" onPress={() => flash(setPwSaved)} />
          {pwSaved && (
            <Text style={styles.saved} accessibilityLiveRegion="polite" role="status">
              Password updated.
            </Text>
          )}
        </Panel>
      </Enter>
      <Enter index={1}>
        <Panel>
          <Press
            accessibilityRole="switch"
            accessibilityLabel="Recovery email"
            accessibilityHint={RECOVERY_HINT}
            accessibilityState={{ checked: recovery }}
            onPress={() => setRecovery(!recovery)}
            pressScale={0}
            style={styles.toggle}>
            <View style={styles.toggleText}>
              <Text style={styles.label}>Recovery email</Text>
              <Text style={text.caption}>{RECOVERY_HINT}</Text>
            </View>
            <SwitchTrack on={recovery} />
          </Press>
          {recovery && (
            <View style={styles.recovery}>
              <Field
                label="Recovery email"
                placeholder="you@example.com"
                keyboardType="email-address"
                autoComplete="email"
                autoCapitalize="none"
              />
              <Button label="Save recovery email" tone="dark" onPress={() => flash(setEmailSaved)} />
              {emailSaved && (
                <Text style={styles.saved} accessibilityLiveRegion="polite" role="status">
                  Recovery email saved.
                </Text>
              )}
            </View>
          )}
        </Panel>
      </Enter>
    </Screen>
  );
}

const styles = StyleSheet.create({
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 48 },
  toggleText: { flex: 1, minWidth: 0 },
  label: { ...font(600), fontSize: 13, color: color.ink },
  recovery: { marginTop: 12 },
  saved: { ...font(700), fontSize: 12, color: color.green, marginTop: 8 },
});
