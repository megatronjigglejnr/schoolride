// The flat bus from the prototype's #bus sprite (132x60): an ink body with ice windows.
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import { color } from '@/theme/tokens';

/** The sprite's shapes, for drawing inside another SVG (the mini-map). */
export function BusShapes({ body = color.ink, windows = color.canvas }: { body?: string; windows?: string }) {
  return (
    <>
      <Path fill={body} d="M4 8Q4 2 10 2H92Q97 2 100 7L106 22H120Q128 22 128 30V46Q128 50 124 50H8Q4 50 4 46Z" />
      <G fill={windows}>
        <Rect x="12" y="9" width="15" height="14" rx="3" />
        <Rect x="31" y="9" width="15" height="14" rx="3" />
        <Rect x="50" y="9" width="15" height="14" rx="3" />
        <Rect x="69" y="9" width="15" height="14" rx="3" />
        <Path d="M88 9H93Q95 9 96 11L100.5 22H88Z" />
        <Rect x="4" y="33" width="124" height="3" />
        <Circle cx="122" cy="39" r="2.4" />
      </G>
      <G fill={body} stroke={windows} strokeWidth={2.5}>
        <Circle cx="30" cy="50" r="8.5" />
        <Circle cx="100" cy="50" r="8.5" />
      </G>
      <G fill={windows}>
        <Circle cx="30" cy="50" r="3" />
        <Circle cx="100" cy="50" r="3" />
      </G>
    </>
  );
}

export function Bus({ width, body, windows }: { width: number; body?: string; windows?: string }) {
  return (
    <Svg width={width} height={(width * 60) / 132} viewBox="0 0 132 60">
      <BusShapes body={body} windows={windows} />
    </Svg>
  );
}
