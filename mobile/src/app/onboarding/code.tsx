// Code (#ob-otp): the six boxes, the number it went to with "Change number", a visible message for a wrong code
// (CLAUDE.md gap 2), and "Resend code". A right code plays the merge, then the linked children.
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { OtpBoxes } from '@/components/onboarding/OtpBoxes';
import { Step, stepText } from '@/components/onboarding/Step';
import { Press } from '@/components/Press';
import { DEMO_CONTROLS, OTP_CORRECT } from '@/lib/demo';
import { useOnboarding } from '@/state/OnboardingContext';
import { useShell } from '@/state/ShellContext';
import { color } from '@/theme/tokens';
import { font } from '@/theme/type';

const WRONG = "That code didn't match. Check the text and try again.";

export default function Code() {
  const { phone } = useOnboarding();
  const { showToast } = useShell();
  const [message, setMessage] = useState('');
  const [accepted, setAccepted] = useState(false);

  return (
    <Step
      title="Enter the code"
      sub={
        <>
          <Text style={stepText.sub}>
            {`We sent a 6-digit code to ${phone || 'your number'}.`}
            {DEMO_CONTROLS ? ` (demo code: ${OTP_CORRECT})` : ''}
          </Text>
          <Press
            accessibilityRole="button"
            accessibilityLabel="Change number"
            onPress={() => router.back()}
            pressScale={0}
            style={styles.change}>
            <Text style={styles.link}>Change number</Text>
          </Press>
        </>
      }>
      <OtpBoxes
        check={(c) => {
          const ok = c === OTP_CORRECT;
          if (ok) setAccepted(true);
          return ok;
        }}
        onDone={() => router.replace('/onboarding/confirm')}
        onWrong={() => setMessage(WRONG)}
        onType={() => setMessage('')}
      />
      <Text style={[styles.error, !message && styles.hidden]} accessibilityLiveRegion="assertive" role="alert">
        {message}
      </Text>
      {!accepted && (
        <Press
          accessibilityRole="button"
          accessibilityLabel="Resend code"
          onPress={() => showToast('Code resent')}
          pressScale={0}
          style={styles.resend}>
          <Text style={styles.resendText}>Resend code</Text>
        </Press>
      )}
    </Step>
  );
}

const styles = StyleSheet.create({
  change: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
  link: { ...font(800), fontSize: 13, color: color.ink, textDecorationLine: 'underline' },
  error: { ...font(700), fontSize: 13, color: color.alert, textAlign: 'center', marginTop: 14, minHeight: 18 },
  hidden: { opacity: 0 },
  resend: { alignSelf: 'center', minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, marginTop: 2 },
  resendText: { ...font(400), fontSize: 12, color: color.muted, textDecorationLine: 'underline' },
});
