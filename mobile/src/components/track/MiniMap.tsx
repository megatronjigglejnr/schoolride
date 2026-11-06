// The live map card's drawing (renderMiniMap in the prototype): a hand-drawn street grid, the route solid
// behind the bus and dotted ahead, the stops, the next stop's pulse, and the bus tilted along the road.
import { useEffect, useMemo } from 'react';
import Animated, {
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { BusShapes } from '@/components/Bus';
import { miniMapSpec } from '@/data/maps';
import { trackData } from '@/data/track';
import type { ChildKey } from '@/data/types';
import { layout } from '@/lib/minimap';
import { alpha, color, rgb } from '@/theme/tokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const VB_W = 350;
const VB_H = 196;

type Props = { child: ChildKey; lost: boolean; width: number; height: number };

export function MiniMap({ child, lost, width, height }: Props) {
  const spec = miniMapSpec[child];
  const route = trackData[child].route;
  const geo = useMemo(() => layout(spec), [spec]);
  const reduce = useReducedMotion();

  // The prototype scales the 350x196 drawing to fit ("meet") and lets the streets run past it to the card's
  // edges. Widening the view box to the card's own shape does the same.
  const vbW = Math.max(VB_W, (VB_H * width) / Math.max(height, 1));
  const vbH = Math.max(VB_H, (VB_W * height) / Math.max(width, 1));
  const viewBox = `${(VB_W - vbW) / 2} ${(VB_H - vbH) / 2} ${vbW} ${vbH}`;

  const pulse = useSharedValue(0);
  const animate = !reduce && !lost;
  useEffect(() => {
    pulse.value = 0;
    if (animate) pulse.value = withRepeat(withTiming(1, { duration: 2000, easing: Easing.out(Easing.quad) }), -1);
  }, [animate, pulse]);
  // r 13 → 24 and back, opacity .8 → 0 and back, like the prototype's SVG <animate>.
  const ring = useAnimatedProps(() => {
    const t = pulse.value < 0.5 ? pulse.value * 2 : (1 - pulse.value) * 2;
    return { r: 13 + 11 * t, opacity: animate ? 0.8 * (1 - t) : 0 };
  });

  const nextIdx = route.findIndex((s) => s.state === 'next');
  const next = spec.pts[nextIdx];

  return (
    <Svg width={width} height={height} viewBox={viewBox}>
      <Rect x={-500} y={-500} width={1350} height={1200} fill={color.mapGround} />
      {spec.blocks.map(([x, y, w, h], i) => (
        <Rect key={'b' + i} x={x} y={y} width={w} height={h} rx={8} fill={color.mapBlock} />
      ))}
      {spec.roads.map((d, i) => (
        <Path key={'e' + i} d={d} fill="none" stroke={color.mapRoadEdge} strokeWidth={19} strokeLinecap="round" />
      ))}
      {spec.roads.map((d, i) => (
        <Path key={'r' + i} d={d} fill="none" stroke={color.card} strokeWidth={14} strokeLinecap="round" />
      ))}
      <Path d={geo.restPath} fill="none" stroke={color.ink} strokeWidth={4.5} strokeLinecap="round" strokeDasharray="0.1 9" />
      <Path d={geo.donePath} fill="none" stroke={color.ink} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />

      {spec.pts.map(([x, y], k) => {
        const st = route[k]?.state;
        if (st === 'done') return <Circle key={k} cx={x} cy={y} r={6} fill={color.ink} stroke={color.card} strokeWidth={3} />;
        if (st === 'next') return <Circle key={k} cx={x} cy={y} r={13} fill={color.card} stroke={color.ink} strokeWidth={4} />;
        return <Circle key={k} cx={x} cy={y} r={6} fill={color.card} stroke={color.strokeQuiet} strokeWidth={3} />;
      })}
      {next && <AnimatedCircle cx={next[0]} cy={next[1]} fill="none" stroke={color.ink} strokeWidth={3} animatedProps={ring} />}

      <G
        transform={`translate(${geo.bus[0].toFixed(1)} ${geo.bus[1].toFixed(1)}) rotate(${geo.angle.toFixed(1)})`}
        opacity={lost ? 0.45 : 1}>
        <Ellipse cx={0} cy={11} rx={21} ry={4} fill={alpha(rgb.ink, 0.2)} />
        <G transform={`translate(-23 -11) scale(${46 / 132} ${21 / 60})`}>
          <BusShapes />
        </G>
      </G>
      {lost && (
        <Circle
          cx={geo.bus[0]}
          cy={geo.bus[1]}
          r={27}
          fill="none"
          stroke={color.ink}
          strokeWidth={2}
          strokeDasharray="4 5"
          opacity={0.55}
        />
      )}
    </Svg>
  );
}
