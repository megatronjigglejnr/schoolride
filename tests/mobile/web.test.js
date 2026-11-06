// The React Native port, measured on its Expo web build the way tests/a11y.test.js measures the prototype:
//   - every visible text meets WCAG AA contrast (from rendered pixels) and is at least 12px;
//   - every control's touch area is at least 44x44 (Press's web hit-area layer counts, as hitSlop does on phones);
//   - nothing is clipped off the side at 320 / 360 / 390 px, and no page errors.
// Build first:  npm run build:mobile-web   (needs Node 24; see mobile/.nvmrc). Run: npm run test:mobile-web
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium, MEASURE } = require('../helpers');

const DIST = path.resolve(__dirname, '../../mobile/dist-web');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.ttf': 'font/ttf', '.json': 'application/json', '.ico': 'image/x-icon' };

let browser, server, base;
before(async () => {
  if (!fs.existsSync(path.join(DIST, 'index.html'))) throw new Error('No web build: run `npm run build:mobile-web` first.');
  // A static server that falls back to index.html, as the single-page build expects.
  server = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    let file = path.join(DIST, url);
    if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, 'index.html');
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch();
});
after(async () => {
  await browser?.close();
  server?.close();
});

async function open({ width = 390, height = 844 } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(base + '/');
  await page.getByRole('button', { name: 'Get started' }).waitFor({ timeout: 30000 });
  return { page, context, errors };
}

const btn = (page, name) => page.getByRole('button', { name, exact: typeof name === 'string' });
const settle = (page, ms = 700) => page.waitForTimeout(ms);
async function skip(page) {
  await btn(page, 'Skip onboarding (demo control)').click();
  await btn(page, 'Quick actions').waitFor();
  await settle(page);
}
async function toPhone(page) {
  await btn(page, 'Get started').click();
  await page.getByLabel('Phone number').waitFor();
  await settle(page);
}
async function toCode(page) {
  await toPhone(page);
  await page.getByLabel('Phone number').fill('+27 82 555 0142');
  await btn(page, 'Send code').click();
  await page.getByLabel('Digit 1').waitFor();
  await settle(page, 900);
}
async function account(page) {
  await skip(page);
  await btn(page, 'Account, Sarah Doe').click();
  await settle(page);
}
async function sub(page, row) {
  await account(page);
  await btn(page, row).click();
  await settle(page);
}

// state -> how to reach it
const STATES = {
  welcome: async () => {},
  phone: toPhone,
  'phone error': async (p) => { await toPhone(p); await p.getByLabel('Phone number').fill('082'); await btn(p, 'Send code').click(); await settle(p); },
  code: toCode,
  'code wrong': async (p) => { await toCode(p); await p.getByLabel('Digit 1').click(); await p.keyboard.type('000000'); await settle(p, 300); },
  confirm: async (p) => { await toCode(p); await p.getByLabel('Digit 1').click(); await p.keyboard.type('123456'); await btn(p, 'Continue').waitFor({ timeout: 5000 }); await settle(p); },
  'notifications ask': async (p) => { await STATES.confirm(p); await btn(p, 'Continue').click(); await btn(p, 'Not now').waitFor(); await settle(p); },
  'onboarding terms': async (p) => { await toPhone(p); await page_link(p, 'Terms & conditions').click(); await settle(p); },
  track: skip,
  'track, map': async (p) => { await skip(p); await btn(p, 'Open the live map').scrollIntoViewIfNeeded(); await settle(p); },
  'track, signal lost 5+ min': async (p) => {
    await skip(p);
    await btn(p, 'Simulate signal loss (demo control)').click();
    await btn(p, 'Call Mr. Naidoo to check in').waitFor({ timeout: 15000 });
    await p.evaluate(() => window.scrollTo(0, 0));
    await settle(p);
  },
  schedule: async (p) => { await skip(p); await p.getByRole('tab', { name: 'Schedule' }).click(); await settle(p); await btn(p, /^Thursday, 10 September, exam day/).click(); await settle(p); },
  history: async (p) => { await skip(p); await p.getByRole('tab', { name: 'History' }).click(); await settle(p); },
  account,
  'personal info': (p) => sub(p, 'Personal info'),
  family: async (p) => { await sub(p, 'Family'); await btn(p, /^Jane Doe, Riverside Primary/).click(); await settle(p); },
  privacy: (p) => sub(p, 'Privacy'),
  'login & security': async (p) => { await sub(p, 'Login & security'); await p.getByRole('switch', { name: 'Recovery email' }).click(); await settle(p); },
  terms: (p) => sub(p, 'Terms & conditions'),
  notifications: async (p) => { await skip(p); await btn(p, /^Notifications/).click(); await btn(p, 'Mark all read').waitFor(); await settle(p); },
  'full map': async (p) => { await skip(p); await btn(p, 'Open the live map').click(); await btn(p, 'Zoom in').waitFor(); await settle(p); },
  'quick actions': async (p) => { await skip(p); await btn(p, 'Quick actions').click(); await settle(p); },
  'call sheet': async (p) => { await skip(p); await btn(p, 'Quick actions').click(); await settle(p, 300); await btn(p, 'Call').click(); await settle(p); },
  'call sheet, edit': async (p) => { await STATES['call sheet'](p); await btn(p, 'Edit').click(); await settle(p); },
  'share sheet': async (p) => { await skip(p); await btn(p, 'Quick actions').click(); await settle(p, 300); await btn(p, 'Share ETA').click(); await settle(p); },
  'photo sheet': async (p) => { await account(p); await btn(p, 'Change profile photo').click(); await settle(p); },
  'friend sheet': async (p) => { await sub(p, 'Family'); await btn(p, 'Add a trusted friend').click(); await settle(p); },
};
function page_link(p, name) {
  return p.getByRole('link', { name });
}

// In the page: tag every visible, unobscured text leaf in the viewport for MEASURE, and report any under 12px.
const TAG_TEXT = () => {
  const items = [], small = [];
  let i = 0;
  document.querySelectorAll('[data-cm]').forEach((e) => e.removeAttribute('data-cm'));
  document.querySelectorAll('body *').forEach((el) => {
    if (el.closest('svg')) return;
    const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
    if (!own) return;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2 || r.top < 0 || r.left < 0 || r.bottom > innerHeight || r.right > innerWidth) return;
    let op = 1;
    for (let p = el; p; p = p.parentElement) { const s = getComputedStyle(p); if (s.visibility === 'hidden' || s.display === 'none') return; op *= parseFloat(s.opacity); }
    if (op < 0.5) return; // faded out (an entrance's first frame, a hidden message)
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    if (!hit || !(el.contains(hit) || hit.contains(el))) return; // under a sheet, scrim or the header
    el.setAttribute('data-cm', String(i));
    items.push([own.slice(0, 40), `[data-cm="${i}"]`]);
    i += 1;
    if (parseFloat(getComputedStyle(el).fontSize) < 12) small.push(`${own.slice(0, 30)} (${getComputedStyle(el).fontSize})`);
  });
  return { items, small };
};

// In the page: every control in the viewport, with its touch area (its own box, or Press's web hit-area layer).
const TAP = () => {
  const out = [];
  const roles = '[role=button],[role=link],[role=switch],[role=radio],[role=tab],[role=checkbox],input,textarea';
  document.querySelectorAll(roles).forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1 || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) return;
    for (let p = el; p; p = p.parentElement) { const s = getComputedStyle(p); if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) === 0) return; }
    if (getComputedStyle(el).pointerEvents === 'none') return;
    let w = r.width, h = r.height;
    el.querySelectorAll(':scope > [data-testid="hit-area"]').forEach((a) => { const b = a.getBoundingClientRect(); w = Math.max(w, b.width); h = Math.max(h, b.height); });
    if (Math.min(w, h) < 43.5) out.push(`${el.getAttribute('role') || el.tagName.toLowerCase()} ${Math.round(w)}x${Math.round(h)} "${(el.getAttribute('aria-label') || el.innerText || '').trim().slice(0, 30)}"`);
  });
  return [...new Set(out)];
};

// In the page: visible text pushed past the screen's sides (horizontal scrollers like the map's cards excepted).
const CLIPPED = () => {
  const out = [];
  document.querySelectorAll('body *').forEach((el) => {
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!own) return;
    for (let p = el.parentElement; p; p = p.parentElement) { const s = getComputedStyle(p); if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) === 0) return; if (s.overflowX === 'auto' || s.overflowX === 'scroll') return; }
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.bottom < 0 || r.top > innerHeight) return;
    if (r.left < -0.5 || r.right > innerWidth + 0.5) out.push(`"${el.textContent.trim().slice(0, 30)}" ${Math.round(r.left)}..${Math.round(r.right)}`);
  });
  return out;
};

for (const [name, reach] of Object.entries(STATES)) {
  test(`expo web: ${name}: contrast AA, 12px floor, 44pt targets, no errors`, async () => {
    const { page, context, errors } = await open();
    await reach(page);
    const { items, small } = await page.evaluate(TAG_TEXT);
    assert.ok(items.length > 0, 'found text to measure');
    const png = (await page.screenshot()).toString('base64');
    const res = await page.evaluate(MEASURE, { png, items });
    const bad = res.filter((r) => r.missing || r.ratio < r.need).map((r) => (r.missing ? `${r.label}: not found` : `${r.label}: ${r.ratio}:1 (needs ${r.need})`));
    assert.deepEqual(bad, [], 'contrast');
    assert.deepEqual(small, [], 'text under 12px');
    assert.deepEqual(await page.evaluate(TAP), [], 'touch targets under 44x44');
    assert.deepEqual(errors, [], 'page errors');
    await context.close();
  });
}

for (const [w, h] of [[320, 568], [360, 640], [390, 844]]) {
  test(`expo web: nothing clipped sideways at ${w}x${h}`, async () => {
    const out = [];
    for (const name of ['welcome', 'phone', 'code', 'track', 'schedule', 'history', 'account', 'family', 'full map', 'call sheet']) {
      const { page, context, errors } = await open({ width: w, height: h });
      await STATES[name](page);
      (await page.evaluate(CLIPPED)).forEach((c) => out.push(`${name}: ${c}`));
      errors.forEach((e) => out.push(`${name}: error ${e}`));
      await context.close();
    }
    assert.deepEqual(out, []);
  });
}
