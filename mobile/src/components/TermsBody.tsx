// The terms as reading text (.legal), shared by Account > Terms and onboarding's link, so both say the same thing.
import { StyleSheet, Text, View } from 'react-native';

import { TERMS_DRAFT, TERMS_UPDATED, terms } from '@/data/account';
import { color } from '@/theme/tokens';
import { font, tracking } from '@/theme/type';

export function TermsIntro() {
  return (
    <>
      <Text style={styles.meta}>{TERMS_UPDATED}</Text>
      <View style={styles.draft}>
        <Text style={styles.draftText}>{TERMS_DRAFT}</Text>
      </View>
    </>
  );
}

export function TermsSections() {
  return (
    <>
      {terms.map((t) => (
        <View key={t.title}>
          <Text accessibilityRole="header" style={styles.h}>
            {t.title}
          </Text>
          <Text style={styles.p}>{t.body}</Text>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  meta: { ...font(700), fontSize: 12, color: color.muted, marginTop: 2, marginHorizontal: 4 },
  draft: {
    backgroundColor: color.surfaceFlat,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 10,
    marginBottom: 6,
  },
  draftText: { ...font(400), fontSize: 12.5, lineHeight: 19, color: color.ink },
  h: {
    ...font(900),
    fontSize: 15,
    color: color.ink,
    marginTop: 18,
    marginBottom: 4,
    marginHorizontal: 4,
    ...tracking(-0.01, 15),
  },
  p: { ...font(400), fontSize: 14, lineHeight: 22, color: color.ink, marginHorizontal: 4 },
});
