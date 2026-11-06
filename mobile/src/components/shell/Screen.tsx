// A tab's scrolling content (.content in the prototype): room for the header above and the nav pill below,
// and it tells the header to frost once anything scrolls under it.
import { useIsFocused } from 'expo-router';
import { useEffect, useRef, type ComponentRef, type ReactNode } from 'react';
import { ScrollView, StyleSheet, type NativeScrollEvent, type NativeSyntheticEvent, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useShell } from '@/state/ShellContext';
import { color } from '@/theme/tokens';

/** Room under the header: with the child switcher row (Track, Schedule, History), and without (Account). */
export const HEADER_ROOM = 100;
export const HEADER_ROOM_COMPACT = 60;
export const NAV_ROOM = 122;

type Props = { children: ReactNode; contentStyle?: StyleProp<ViewStyle>; compactHeader?: boolean };

export function Screen({ children, contentStyle, compactHeader = false }: Props) {
  const insets = useSafeAreaInsets();
  const { setScrolled } = useShell();
  const focused = useIsFocused();
  const last = useRef(false);

  // Coming back to a tab starts it at the top with a clear header, like switchTab in the prototype.
  const ref = useRef<ComponentRef<typeof ScrollView>>(null);
  useEffect(() => {
    if (!focused) return;
    ref.current?.scrollTo({ y: 0, animated: false });
    last.current = false;
    setScrolled(false);
  }, [focused, setScrolled]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const under = e.nativeEvent.contentOffset.y > 6;
    if (under !== last.current) {
      last.current = under;
      setScrolled(under);
    }
  };

  return (
    <ScrollView
      ref={ref}
      style={styles.scroll}
      onScroll={onScroll}
      scrollEventThrottle={32}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        {
          paddingTop: Math.max(16, insets.top) + (compactHeader ? HEADER_ROOM_COMPACT : HEADER_ROOM),
          paddingBottom: NAV_ROOM + insets.bottom,
          paddingHorizontal: 18,
          flexGrow: 1,
        },
        contentStyle,
      ]}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({ scroll: { flex: 1, backgroundColor: color.canvas } });
