/**
 * Design tokens, mirrored from :root in app/styles.css (the prototype is the source of truth).
 * Names match the CSS custom properties in camelCase. Change a value there first, then here.
 */

/** An "r,g,b" triple, as the CSS -rgb tokens store it. */
type Rgb = readonly [number, number, number];

/** rgba() from an -rgb token, the counterpart of rgba(var(--x-rgb), a) in the prototype. */
export const alpha = (rgb: Rgb, a: number) => `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;

export const rgb = {
  canvas: [238, 241, 245],
  ink: [58, 31, 61],
  glint: [255, 255, 255],
  accent: [245, 184, 46],
  green: [15, 122, 62],
  mapGround: [227, 232, 238],
  silver: [220, 225, 232],
} as const satisfies Record<string, Rgb>;

export const color = {
  // Ice Silver: surfaces
  canvas: '#EEF1F5',
  card: '#FFFFFF',
  line: '#DCE1E8', // hairlines, switch track off
  surfaceFlat: '#E6EAF0', // flat tints: calendar arrows, regular badge, sheet close
  frame: '#DCE1E8', // backdrop around the phone frame (web, wide screens)

  // Deep Aubergine: ink
  ink: '#3A1F3D', // all primary text, nav pill, dark buttons, focus ring
  muted: '#6B5A6E', // secondary text. Never on marigold (3.5:1)
  onInk: '#FFFFFF', // text and icons on aubergine

  // Marigold: the one loud colour. Hero, FAB, selected day, primary buttons
  accent: '#F5B82E',
  accentLight: '#FFC94F',
  accentDeep: '#E9A41E',
  accentSoft: alpha(rgb.accent, 0.3),

  // Lines and quiet strokes (>= 3:1 on white)
  fieldLine: '#857A88',
  strokeQuiet: '#8A7F8D',
  heroLost: '#DCE1E8',

  // Reserved meanings
  green: '#0F7A3E', // arrived / verified / success ONLY
  greenSoft: '#DDF3E6',
  greenInk: '#0B5A2E',
  alert: '#C4302B', // red = alerts ONLY
  alertSoft: 'rgba(196,48,43,0.11)',

  // Hand-drawn maps
  mapGround: '#E3E8EE',
  mapBlock: '#D6DCE4',
  mapRoadEdge: '#C9D0DA',
} as const;

/** Depth: aubergine-tinted, never black. Contact shadow + ambient shadow (RN boxShadow syntax). */
export const shadow = {
  raised: `0 1px 1px ${alpha(rgb.ink, 0.08)}, 0 12px 32px -14px ${alpha(rgb.ink, 0.18)}`,
  float: `0 1px 2px ${alpha(rgb.ink, 0.1)}, 0 8px 20px -8px ${alpha(rgb.ink, 0.28)}`,
} as const;

/** Liquid glass. Gradients are [from, to] top to bottom, for expo-linear-gradient. */
export const glass = {
  dark: ['rgba(74,45,78,0.88)', alpha(rgb.ink, 0.92)],
  light: alpha(rgb.canvas, 0.78),
  sheet: [alpha(rgb.glint, 0.92), 'rgba(244,242,247,0.88)'],
  highlight: `inset 0 1px 0 ${alpha(rgb.glint, 0.55)}`,
  border: alpha(rgb.silver, 0.85),
} as const;

/** Spacing: 4px scale. */
export const space = { s1: 4, s2: 8, s3: 12, s4: 16, s5: 20, s6: 24, s8: 32 } as const;
