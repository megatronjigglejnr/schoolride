// A round avatar (.contact-avatar, .profile-avatar, .avatar-btn): the person's photo if they set one, otherwise
// their initials on ink, or on the light tint for the second person in a pair. Decorative: the row names them.
import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { color } from '@/theme/tokens';
import { font } from '@/theme/type';

type Props = {
  initials: string;
  uri?: string | null;
  size?: number;
  tone?: 'ink' | 'muted';
  style?: StyleProp<ViewStyle>;
};

export function Avatar({ initials, uri, size = 36, tone = 'ink', style }: Props) {
  const box = { width: size, height: size, borderRadius: size / 2 };
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={[styles.base, box, tone === 'muted' ? styles.muted : styles.ink, uri ? styles.photo : null, style]}>
      {uri ? (
        <Image source={{ uri }} style={box} resizeMode="cover" />
      ) : (
        <Text style={[styles.text, { fontSize: Math.round(size * 0.36) }, tone === 'muted' && styles.textMuted]}>
          {initials}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  ink: { backgroundColor: color.ink },
  muted: { backgroundColor: color.line },
  photo: { backgroundColor: color.surfaceFlat },
  text: { ...font(900), color: color.onInk, letterSpacing: -0.2 },
  textMuted: { color: color.ink },
});
