// The port's tokens must equal :root in app/styles.css, the source of truth. Change the CSS first, then tokens.ts.
import fs from 'node:fs';
import path from 'node:path';

import { color, glass, rgb, shadow, space } from '@/theme/tokens';

const css = fs.readFileSync(path.resolve(__dirname, '../../app/styles.css'), 'utf8');
const rootBlock = css.slice(css.indexOf(':root {'), css.indexOf('}', css.indexOf(':root {')));
const vars: Record<string, string> = {};
for (const m of rootBlock.matchAll(/--([\w-]+):\s*([^;]+);/g)) vars[m[1]] = m[2].trim();

const camel = (k: string) => k.replace(/-(\w)/g, (_, c: string) => c.toUpperCase());
/** Resolve var(--x) references, then normalise numbers and spacing so CSS and TS strings compare. */
const resolve = (v: string): string => v.replace(/var\(--([\w-]+)\)/g, (_, k: string) => resolve(vars[k]));
const norm = (v: string) =>
  resolve(v)
    .replace(/\s+/g, '')
    .replace(/\d*\.\d+/g, (n) => String(parseFloat(n)))
    .toUpperCase();

test('every hex colour token matches styles.css', () => {
  const hexVars = Object.entries(vars).filter(([, v]) => /^#[0-9a-f]{6}$/i.test(v));
  expect(hexVars.length).toBeGreaterThan(15);
  for (const [k, v] of hexVars) {
    expect({ token: k, value: (color as Record<string, string>)[camel(k)] }).toEqual({ token: k, value: v });
  }
});

test('rgb triples and translucent colours match', () => {
  for (const [k, v] of Object.entries(vars).filter(([key]) => key.endsWith('-rgb'))) {
    const key = camel(k.replace(/-rgb$/, '')) as keyof typeof rgb;
    expect({ token: k, value: rgb[key]?.join(',') }).toEqual({ token: k, value: v.replace(/\s/g, '') });
  }
  expect(norm(color.accentSoft)).toBe(norm(vars['accent-soft']));
  expect(norm(color.alertSoft)).toBe(norm(vars['alert-soft']));
});

test('shadows and glass match', () => {
  expect(norm(shadow.raised)).toBe(norm(vars['shadow-raised']));
  expect(norm(shadow.float)).toBe(norm(vars['shadow-float']));
  expect(norm(`linear-gradient(180deg, ${glass.dark.join(', ')})`)).toBe(norm(vars['glass-dark']));
  expect(norm(`linear-gradient(180deg, ${glass.sheet.join(', ')})`)).toBe(norm(vars['glass-sheet']));
  expect(norm(glass.light)).toBe(norm(vars['glass-light']));
  expect(norm(glass.highlight)).toBe(norm(vars['glass-highlight']));
  expect(norm(glass.border)).toBe(norm(vars['glass-border']));
});

test('spacing scale matches', () => {
  for (const [k, v] of Object.entries(vars).filter(([key]) => /^s-\d$/.test(key))) {
    expect({ token: k, value: space[k.replace('-', '') as keyof typeof space] }).toEqual({ token: k, value: parseInt(v, 10) });
  }
});
