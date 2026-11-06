// The terms, from the phone step's link: the same text as Account > Terms, with a back button.
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Press } from '@/components/Press';
import { TermsIntro, TermsSections } from '@/components/TermsBody';
import { color } from '@/theme/tokens';
import { font } from '@/theme/type';

export default function OnboardingTerms() {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <View style={[styles.bar, { paddingTop: Math.max(16, insets.top) }]}>
        <Press
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          containerStyle={[styles.backWrap, { top: Math.max(16, insets.top) - 6 }]}
          style={styles.back}>
          <Icon name="chevronLeft" size={18} strokeWidth={2.2} />
        </Press>
        <Text accessibilityRole="header" style={styles.title}>
          {'Terms & conditions'}
        </Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 24 + insets.bottom }}>
        <TermsIntro />
        <TermsSections />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.canvas },
  bar: { alignItems: 'center', paddingBottom: 10 },
  backWrap: { position: 'absolute', left: 8, zIndex: 1 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { ...font(800), fontSize: 15, color: color.ink, lineHeight: 34 },
});
