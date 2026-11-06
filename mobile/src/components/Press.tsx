// Every control in the app: a Pressable that must have a role and a label, gives press feedback within
// about 100ms (a slight sink and dim, without moving anything around it), and reaches 44pt with hitSlop.
import {
  Platform,
  Pressable,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
  type Insets,
} from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

type Role = 'button' | 'link' | 'tab' | 'switch' | 'checkbox' | 'radio' | 'togglebutton';

type Props = Omit<PressableProps, 'style' | 'accessibilityRole' | 'accessibilityLabel'> & {
  accessibilityRole: Role;
  accessibilityLabel: string;
  /** Visual style: background, radius, padding. Scales with the press. */
  style?: StyleProp<ViewStyle>;
  /** Layout of the touch area itself: flex, position, alignment. */
  containerStyle?: StyleProp<ViewStyle>;
  /** How far the control sinks when pressed. 0 turns the scale off (large surfaces dim only). */
  pressScale?: number;
  /** Visual size; hitSlop is added so the touch area reaches 44x44. */
  size?: { width: number; height: number };
};

const MIN = 44;

/**
 * State as aria-* props: React Native maps them to native accessibility state, and react-native-web writes them to
 * the DOM (it ignores accessibilityState), so selected, checked and expanded reach screen readers everywhere.
 */
function ariaState(state: PressableProps['accessibilityState']) {
  if (!state) return {};
  return {
    'aria-selected': state.selected,
    'aria-checked': state.checked,
    'aria-expanded': state.expanded,
    'aria-disabled': state.disabled,
    'aria-busy': state.busy,
  };
}

function slopFor(size?: { width: number; height: number }): Insets | undefined {
  if (!size) return undefined;
  const h = Math.max(0, Math.ceil((MIN - size.width) / 2));
  const v = Math.max(0, Math.ceil((MIN - size.height) / 2));
  return h || v ? { left: h, right: h, top: v, bottom: v } : undefined;
}

export function Press({
  style,
  containerStyle,
  pressScale = 0.96,
  size,
  hitSlop,
  onPressIn,
  onPressOut,
  accessibilityState,
  children,
  ...rest
}: Props) {
  const reduce = useReducedMotion();
  const pressed = useSharedValue(0);
  const anim = useAnimatedStyle(() => ({
    opacity: 1 - pressed.value * 0.12,
    transform: [{ scale: reduce || !pressScale ? 1 : 1 - pressed.value * (1 - pressScale) }],
  }));

  const slop = hitSlop ?? slopFor(size);
  // react-native-web ignores hitSlop, so on web an invisible layer reaches the 44pt area instead (the prototype's
  // ::after). It sits inside the control, so a press on it is a press on the control.
  const webSlop = Platform.OS === 'web' && slop && typeof slop === 'object' ? slop : null;

  return (
    <Pressable
      {...rest}
      {...ariaState(accessibilityState)}
      style={containerStyle}
      hitSlop={slop}
      onPressIn={(e) => {
        pressed.value = withTiming(1, { duration: 90 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        pressed.value = withTiming(0, { duration: 160 });
        onPressOut?.(e);
      }}>
      {(state) => (
        <>
          <Animated.View style={[style, anim]}>
            {typeof children === 'function' ? children(state) : children}
          </Animated.View>
          {webSlop && (
            <View
              pointerEvents="auto"
              testID="hit-area"
              style={{
                position: 'absolute',
                top: -(webSlop.top ?? 0),
                bottom: -(webSlop.bottom ?? 0),
                left: -(webSlop.left ?? 0),
                right: -(webSlop.right ?? 0),
              }}
            />
          )}
        </>
      )}
    </Pressable>
  );
}
