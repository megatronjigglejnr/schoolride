// Shared test helpers. Tests drive the real app in headless Chromium via Playwright.
const { chromium } = require('playwright');
const path = require('node:path');

const APP_URL = 'file://' + path.resolve(__dirname, '../app/index.html');

async function openApp(browser, { width = 390, height = 844, skipOnboarding = true } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(APP_URL);
  await page.waitForTimeout(300);
  if (skipOnboarding) {
    await page.evaluate(() => obFinish());
    await page.waitForTimeout(700);
  }
  return { page, context, errors };
}

const text = (page, sel) => page.evaluate((s) => (document.querySelector(s) || {}).innerText || '', sel);
const activePills = (page) => page.evaluate(() => [...document.querySelectorAll('#trackSwitch .child-pill')].map((p) => p.classList.contains('active')));
const isVisible = (page, sel) => page.evaluate((s) => {
  const e = document.querySelector(s); if (!e) return false;
  const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
  return r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden';
}, sel);

// Runs in the page: decodes the screenshot into a canvas, samples the background just inside each element's
// top edge (gradient-safe: near-identical colours are bucketed first), blends the text colour by opacity.
const MEASURE = async ({ png, items }) => {
  const img = new Image(); img.src = 'data:image/png;base64,' + png; await img.decode();
  const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
  const ctx = cv.getContext('2d'); ctx.drawImage(img, 0, 0);
  const px = (x, y) => { const d = ctx.getImageData(x, y, 1, 1).data; return [d[0], d[1], d[2]]; };
  const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const L = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  return items.map(([label, sel]) => {
    const el = [...document.querySelectorAll(sel)].find((e) => { const r = e.getBoundingClientRect(); return r.width > 1 && r.height > 1 && e.offsetParent !== null; });
    if (!el) return { label, missing: true };
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    let op = 1; for (let p = el; p; p = p.parentElement) op *= parseFloat(getComputedStyle(p).opacity);
    const y = Math.round(r.y + (sel.includes('pill') ? 5 : 1)), samples = [];
    for (let k = 0; k < 21; k++) { const x = Math.round(r.x + r.width * (0.22 + k * 0.028)); if (x >= 0 && x < cv.width && y >= 0 && y < cv.height) samples.push(px(x, y)); }
    const key = (c) => c.map((v) => Math.floor(v / 12)).join(',');
    const counts = {}; samples.forEach((c) => { counts[key(c)] = (counts[key(c)] || 0) + 1; });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    const mem = samples.filter((c) => key(c) === top);
    const bg = [0, 1, 2].map((i) => mem.reduce((s, c) => s + c[i], 0) / mem.length);
    const t = cs.color.match(/[\d.]+/g).map(Number), a = (t.length > 3 ? t[3] : 1) * op;
    const fg = [0, 1, 2].map((i) => t[i] * a + bg[i] * (1 - a));
    const ratio = (Math.max(L(fg), L(bg)) + 0.05) / (Math.min(L(fg), L(bg)) + 0.05);
    const fs = parseFloat(cs.fontSize), fw = parseInt(cs.fontWeight, 10);
    return { label, ratio: Math.round(ratio * 100) / 100, need: fs >= 24 || (fs >= 18.66 && fw >= 700) ? 3 : 4.5 };
  });
};

module.exports = { chromium, APP_URL, openApp, text, activePills, isVisible, MEASURE };
