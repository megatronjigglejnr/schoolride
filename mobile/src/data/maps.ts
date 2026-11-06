// The hand-drawn maps, ported from miniMapSpec and routeMaps in app/app.js. Not a real map provider.
// The prototype built routeMaps as SVG strings; here they are data, drawn by src/app/route-map.tsx.
import type { ChildKey, MiniMapSpec, RouteMap } from './types';

/** Mini-map on Track: 350x196 view box. */
export const miniMapSpec: Record<ChildKey, MiniMapSpec> = {
  jane: {
    pts: [
      [28, 166],
      [96, 138],
      [162, 108],
      [234, 78],
      [316, 46],
    ],
    busSeg: 1,
    busT: 0.62,
    roads: [
      'M-300 138 C -100 118, 100 168, 250 128 S 500 108, 650 128',
      'M-300 36 C -100 66, 120 16, 300 46 S 520 76, 650 46',
      'M72 -300 C 92 -100, 62 100, 88 500',
      'M258 -300 C 238 -100, 278 100, 252 500',
    ],
    blocks: [
      [118, 150, 56, 28],
      [196, 112, 46, 26],
      [268, 96, 52, 30],
      [28, 70, 56, 30],
      [150, 16, 70, 26],
      [300, 150, 40, 28],
    ],
  },
  liam: {
    pts: [
      [34, 70],
      [112, 96],
      [198, 130],
      [286, 118],
    ],
    busSeg: 0,
    busT: 0.7,
    roads: [
      'M-300 100 C -100 80, 80 130, 220 100 S 480 70, 650 90',
      'M-300 160 C -80 150, 120 200, 280 170 S 520 150, 650 170',
      'M150 -300 C 130 -100, 170 100, 140 500',
      'M300 -300 C 280 -100, 320 100, 290 500',
    ],
    blocks: [
      [60, 100, 50, 30],
      [140, 40, 56, 26],
      [236, 76, 48, 30],
      [40, 150, 60, 26],
      [262, 18, 60, 28],
      [150, 150, 54, 24],
    ],
  },
};

/** Full-map overlay: viewBox "0 -125 320 570". */
export const routeMaps: Record<ChildKey, RouteMap> = {
  jane: {
    title: "Jane's route",
    roads: [
      'M0 90 C 80 70, 150 120, 230 90 S 320 60, 320 60',
      'M0 190 C 90 210, 180 160, 260 190 S 320 210, 320 210',
      'M60 0 C 40 100, 90 200, 60 320',
    ],
    route: 'M 40 280 C 80 250, 70 190, 130 175 C 190 160, 190 100, 175 60',
    home: { at: [40, 280], label: 'Home', labelAt: [52, 284] },
    stop: { at: [130, 175], label: 'Oak Street', labelAt: [142, 179] },
    school: { at: [163, 46], letter: 'S', label: 'Riverside Primary', labelAt: [192, 60] },
    live: [84, 210],
  },
  liam: {
    title: "Liam's route",
    roads: [
      'M0 100 C 90 80, 160 130, 240 100 S 320 80, 320 80',
      'M0 200 C 100 220, 190 170, 270 200 S 320 220, 320 220',
      'M260 0 C 240 100, 280 200, 260 320',
    ],
    route: 'M 280 290 C 260 250, 240 220, 210 190 C 190 160, 230 100, 250 60',
    home: { at: [280, 290], label: 'Home', labelAt: [228, 304] },
    stop: { at: [210, 190], label: 'Birch Close', labelAt: [120, 194] },
    school: { at: [238, 46], letter: 'N', label: 'Northgate Academy', labelAt: [130, 60] },
    live: [238, 228],
  },
};
