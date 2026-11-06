// Calling is the highest-stakes interaction: the driver is always one tap, school contacts
// are never hidden behind a toggle, and a parent's "hide this contact" choice is remembered per child.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { chromium, openApp, text } = require('./helpers');

let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser.close(); });

const toast = (page) => page.evaluate(() => document.getElementById('toast').classList.contains('show') ? document.getElementById('toast').innerText : '');
const telNames = (page) => page.evaluate(() => [...document.querySelectorAll('#callSheetBody a[href^="tel:"]')].map((a) => a.dataset.name));
const openSheet = async (page) => { await page.evaluate(() => openSheet('call')); await page.waitForTimeout(400); };
const closeSheet = async (page) => { await page.evaluate(() => closeSheet('call')); await page.waitForTimeout(300); };

test('driver is ONE tap from Track, via a real tel: link', async () => {
  const { page, context } = await openApp(browser);
  assert.equal(await page.evaluate(() => document.getElementById('trackCallBtn').getAttribute('href')), 'tel:+27825550104');
  await page.click('#trackCallBtn'); await page.waitForTimeout(200);
  assert.match(await toast(page), /Calling Mr\. Naidoo/);
  assert.ok(!(await page.evaluate(() => document.getElementById('callSheet').classList.contains('open'))), 'no sheet in between');
  await context.close();
});

test('register teacher is reachable in 3 taps from anywhere, no toggles', async () => {
  const { page, context } = await openApp(browser);
  await page.click('#fab'); await page.waitForTimeout(450);
  await page.click('.radial-item.r1'); await page.waitForTimeout(500);
  assert.deepEqual(await telNames(page), ['Mr. Naidoo', 'Ms. Patel', 'Mr. Coetzee']);
  assert.equal(await page.evaluate(() => document.querySelectorAll('#callSheetBody .switch').length), 0, 'no switches in calling view');
  await page.click('#callSheetBody a[data-name="Mr. Coetzee"]'); await page.waitForTimeout(200);
  assert.match(await toast(page), /Calling Mr\. Coetzee/);
  await context.close();
});

test('Edit hides a contact; choice is remembered per child and reversible', async () => {
  const { page, context } = await openApp(browser);
  await openSheet(page);
  await page.click('#callSheetBody .link-btn'); await page.waitForTimeout(150);
  const sw = await page.evaluate(() => [...document.querySelectorAll('#callSheetBody button.switch')].map((s) => [s.getAttribute('role'), s.getAttribute('aria-checked')]));
  assert.deepEqual(sw, [['switch', 'true'], ['switch', 'true']]);
  await page.click('#callSheetBody button.switch[aria-label="Show Mr. Coetzee in this list"]');
  await page.click('#callSheetBody .link-btn'); await page.waitForTimeout(150);
  assert.deepEqual(await telNames(page), ['Mr. Naidoo', 'Ms. Patel']);
  await closeSheet(page); await openSheet(page);
  assert.deepEqual(await telNames(page), ['Mr. Naidoo', 'Ms. Patel'], 'remembered after reopening');
  assert.equal(await text(page, '#callSheetBody .link-btn'), 'Edit', 'always reopens in calling mode');
  await page.evaluate(() => { setActiveChild('liam'); renderCallSheet(); }); await page.waitForTimeout(250);
  assert.deepEqual(await telNames(page), ['Ms. Dlamini', 'Mr. Khumalo', 'Ms. Williams'], "Liam's list is unaffected");
  await context.close();
});

test('exam day: "Running late?" prefers register teacher, falls back to grade head, hides if both hidden', async () => {
  const { page, context } = await openApp(browser);
  await page.evaluate(() => { switchTab('schedule'); calSelectDate('2026-09-10'); }); await page.waitForTimeout(300);
  const href = () => page.evaluate(() => { const a = document.querySelector('#calDetail .call-late'); return a ? a.getAttribute('href') : null; });
  assert.equal(await href(), 'tel:+27115550143', 'register teacher first');
  await page.evaluate(() => { callPrefs.jane.register = false; calSelectDate(calSelected); });
  assert.equal(await href(), 'tel:+27115550142', 'falls back to grade head');
  await page.evaluate(() => { callPrefs.jane.gradeHead = false; calSelectDate(calSelected); });
  assert.equal(await href(), null, 'parent opted out of both');
  await page.evaluate(() => { callPrefs.jane.register = true; callPrefs.jane.gradeHead = true; calSelectDate('2026-09-06'); });
  assert.equal(await href(), null, 'regular day: no late button');
  await context.close();
});

test('lost signal: direct call to check in, and the sheet leads with why', async () => {
  const { page, context } = await openApp(browser);
  await page.evaluate(() => { trackData.jane.lost = true; trackData.jane.lostMinutes = 7; renderTrack(); }); await page.waitForTimeout(250);
  assert.deepEqual(await page.evaluate(() => { const a = document.querySelector('.lost-action'); return a && [a.tagName, a.getAttribute('href')]; }), ['A', 'tel:+27825550104']);
  await openSheet(page);
  assert.match(await text(page, '#callSheetBody .call-alert'), /Signal lost 7 min ago/);
  await context.close();
});

test('360x640: tallest call-sheet state still fits on screen', async () => {
  const { page, context } = await openApp(browser, { width: 360, height: 640 });
  await page.evaluate(() => { trackData.jane.lost = true; trackData.jane.lostMinutes = 7; renderTrack(); openSheet('call'); toggleCallEdit(); });
  await page.waitForTimeout(600);
  const r = await page.evaluate(() => { const b = document.getElementById('callSheet').getBoundingClientRect(); return { top: b.top, bottom: b.bottom, vh: innerHeight }; });
  assert.ok(r.top >= 0 && r.bottom <= r.vh + 1, JSON.stringify(r));
  await context.close();
});
