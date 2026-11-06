// The prototype's icon set (the #i-* symbols and inline icons in app/index.html), as one outline family:
// 24x24 view box, round joins, stroke in the given colour. Icons are decorative; the control that holds one
// carries the accessible name.
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import { color as tokens } from '@/theme/tokens';

export type IconName =
  | 'bell'
  | 'phone'
  | 'info'
  | 'plus'
  | 'calendar'
  | 'pin'
  | 'chevronRight'
  | 'chevronLeft'
  | 'clock'
  | 'user'
  | 'map'
  | 'share'
  | 'expand'
  | 'checkSquare'
  | 'close'
  | 'users'
  | 'eye'
  | 'shield'
  | 'file'
  | 'camera'
  | 'image'
  | 'smile'
  | 'card';

type Props = { name: IconName; size?: number; color?: string; strokeWidth?: number };

export function Icon({ name, size = 18, color = tokens.ink, strokeWidth = 2 }: Props) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round">
      {shapes[name]}
    </Svg>
  );
}

const shapes: Record<IconName, React.ReactNode> = {
  bell: (
    <>
      <Path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </>
  ),
  phone: (
    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  ),
  info: (
    <>
      <Circle cx="12" cy="12" r="10" />
      <Line x1="12" y1="16" x2="12" y2="12" />
      <Line x1="12" y1="8" x2="12.01" y2="8" />
    </>
  ),
  plus: (
    <>
      <Line x1="12" y1="5" x2="12" y2="19" />
      <Line x1="5" y1="12" x2="19" y2="12" />
    </>
  ),
  calendar: (
    <>
      <Rect x="3" y="4" width="18" height="18" rx="2" />
      <Line x1="16" y1="2" x2="16" y2="6" />
      <Line x1="8" y1="2" x2="8" y2="6" />
      <Line x1="3" y1="10" x2="21" y2="10" />
    </>
  ),
  pin: (
    <>
      <Path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
      <Circle cx="12" cy="10" r="2.6" />
    </>
  ),
  chevronRight: <Path d="M9 18l6-6-6-6" />,
  chevronLeft: <Path d="M15 18l-6-6 6-6" />,
  clock: (
    <>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M12 7v5l3 2" />
    </>
  ),
  user: (
    <>
      <Circle cx="12" cy="8" r="4" />
      <Path d="M4 21v-1a7 7 0 0 1 14 0v1" />
    </>
  ),
  map: (
    <>
      <Path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z" />
      <Line x1="8" y1="2" x2="8" y2="18" />
      <Line x1="16" y1="6" x2="16" y2="22" />
    </>
  ),
  share: (
    <>
      <Circle cx="18" cy="5" r="3" />
      <Circle cx="6" cy="12" r="3" />
      <Circle cx="18" cy="19" r="3" />
      <Line x1="8.6" y1="10.5" x2="15.4" y2="6.5" />
      <Line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
    </>
  ),
  expand: <Path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />,
  close: (
    <>
      <Line x1="6" y1="6" x2="18" y2="18" />
      <Line x1="18" y1="6" x2="6" y2="18" />
    </>
  ),
  checkSquare: (
    <>
      <Path d="M9 11l3 3L22 4" />
      <Path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </>
  ),
  users: (
    <>
      <Circle cx="9" cy="8" r="3.5" />
      <Path d="M2 21a7 7 0 0 1 14 0" />
      <Path d="M16 4.5a3.5 3.5 0 0 1 0 7" />
      <Path d="M18.5 14.5A7 7 0 0 1 22 21" />
    </>
  ),
  eye: (
    <>
      <Path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
      <Circle cx="12" cy="12" r="3" />
    </>
  ),
  shield: <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  file: (
    <>
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <Path d="M14 2v6h6" />
      <Line x1="8" y1="13" x2="16" y2="13" />
      <Line x1="8" y1="17" x2="13" y2="17" />
    </>
  ),
  camera: (
    <>
      <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <Circle cx="12" cy="13" r="4" />
    </>
  ),
  image: (
    <>
      <Rect x="3" y="3" width="18" height="18" rx="2" />
      <Circle cx="8.5" cy="8.5" r="1.5" />
      <Path d="M21 15l-5-5L5 21" />
    </>
  ),
  smile: (
    <>
      <Circle cx="12" cy="12" r="10" />
      <Path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <Line x1="9" y1="9" x2="9.01" y2="9" />
      <Line x1="15" y1="9" x2="15.01" y2="9" />
    </>
  ),
  card: (
    <>
      <Rect x="1" y="4" width="22" height="16" rx="2" />
      <Line x1="1" y1="10" x2="23" y2="10" />
    </>
  ),
};
