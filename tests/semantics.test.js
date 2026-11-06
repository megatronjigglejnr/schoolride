// Every control is a real <button> or <a> with a name, so keyboard and screen-reader users can
// operate it. This is the shape the React Native port maps onto accessibility props.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { chromium, openApp } = require('./helpers');

let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser.close(); });

test('no clickable div or span: every onclick sits on a button or link', async () => {
  const { page, context } = await openApp(browser);
  await page.evaluate(() => { openNotifications(); switchTab('schedule'); });
  const stray = await page.evaluate(() => [...document.querySelectorAll('[onclick]')]
    .filter((el) => !['BUTTON', 'A'].includes(el.tagName))
    // Backdrops are pointer-only shortcuts; the FAB and each sheet's close button do the same from the keyboard.
    .filter((el) => !el.matches('.scrim, .sheet-scrim'))
    .map((el) => el.tagName.toLowerCase() + '.' + el.className));
  assert.deepEqual(stray, []);
  await context.close();
});

test('every button and link has an accessible name', async () => {
  const { page, context } = await openApp(browser, { skipOnboarding: false });
  await page.evaluate(() => { obFinish(); openNotifications(); switchTab('schedule'); openSheet('call'); });
  await page.waitForTimeout(300);
  const unnamed = await page.evaluate(() => [...document.querySelectorAll('button, a')].filter((el) => {
    const by = el.getAttribute('aria-labelledby');
    const name = el.getAttribute('aria-label') || (by && document.getElementById(by)?.textContent) || el.textContent;
    return !name.trim();
  }).map((el) => el.outerHTML.slice(0, 80)));
  assert.deepEqual(unnamed, []);
  await context.close();
});

test('keyboard: closed layers are out of the tab order', async () => {
  const { page, context } = await openApp(browser);
  const reachable = () => page.evaluate(() => [...document.querySelectorAll('button, a[href], input')]
    .filter((el) => !el.closest('[inert]') && el.getClientRects().length)
    .filter((el) => el.closest('.onboard-flow.done, .bottom-sheet:not(.open), .route-overlay:not(.open), .radial:not(.open)'))
    .map((el) => el.className || el.tagName));
  assert.deepEqual(await reachable(), [], 'finished onboarding, closed sheets, overlays and FAB menu');
  await page.evaluate(() => { openNotifications(); closeNotifications(); openSheet('share'); closeSheet('share'); openRouteView(); closeRouteView(); });
  assert.deepEqual(await reachable(), [], 'after opening and closing each one');
  await context.close();
});

test('keyboard: tab bar works with Enter and marks the current tab', async () => {
  const { page, context } = await openApp(browser);
  await page.focus('#navtab-schedule'); await page.keyboard.press('Enter'); await page.waitForTimeout(250);
  assert.ok(await page.evaluate(() => document.getElementById('tab-schedule').classList.contains('active')));
  const current = await page.evaluate(() => [...document.querySelectorAll('.tab[aria-current="page"]')].map((t) => t.id));
  assert.deepEqual(current, ['navtab-schedule']);
  await context.close();
});

test('keyboard: FAB actions are out of the tab order until the FAB opens', async () => {
  const { page, context } = await openApp(browser);
  const state = () => page.evaluate(() => [document.getElementById('fab').getAttribute('aria-expanded'), document.getElementById('radial').inert]);
  assert.deepEqual(await state(), ['false', true]);
  await page.focus('#fab'); await page.keyboard.press('Enter'); await page.waitForTimeout(400);
  assert.deepEqual(await state(), ['true', false]);
  await page.focus('.radial-item.r1'); await page.keyboard.press('Enter'); await page.waitForTimeout(400);
  assert.ok(await page.evaluate(() => document.getElementById('callSheet').classList.contains('open')), 'Call opens from the keyboard');
  await context.close();
});

test('keyboard: re-rendered calendar and notification lists keep focus on the item used', async () => {
  const { page, context } = await openApp(browser);
  await page.evaluate(() => switchTab('schedule')); await page.waitForTimeout(250);
  await page.focus('.cal-day[aria-label^="Thursday, 10 September"]'); await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-label')), 'Thursday, 10 September, exam day');
  assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-pressed')), 'true');

  await page.evaluate(() => openNotifications()); await page.waitForTimeout(400);
  await page.focus('.notif-item[data-id="6"]'); await page.keyboard.press('Enter'); // has no destination, stays open
  assert.equal(await page.evaluate(() => document.activeElement.dataset.id), '6');
  await context.close();
});

test('switches and disclosures report their state', async () => {
  const { page, context } = await openApp(browser);
  await page.evaluate(() => { switchTab('profile'); goToSecurity(); });
  assert.equal(await page.evaluate(() => document.getElementById('recoveryFields').inert), true, 'hidden recovery fields are not focusable');
  await page.click('#recoverySwitch');
  assert.deepEqual(await page.evaluate(() => [document.getElementById('recoverySwitch').getAttribute('aria-checked'), document.getElementById('recoveryFields').inert]), ['true', false]);

  await page.evaluate(() => { goBack(); goToFamily(); });
  await page.click('#child-jane .child-card-head');
  assert.equal(await page.evaluate(() => document.querySelector('#child-jane .child-card-head').getAttribute('aria-expanded')), 'true');

  await page.evaluate(() => openNotifications()); await page.waitForTimeout(400);
  const row = '#notifOverlay .toggle-row[role="switch"]';
  assert.equal(await page.evaluate((s) => document.querySelector(s).getAttribute('aria-checked'), row), 'true');
  await page.click(row);
  assert.deepEqual(await page.evaluate((s) => { const r = document.querySelector(s); return [r.getAttribute('aria-checked'), r.querySelector('.switch').classList.contains('on')]; }, row), ['false', false]);
  await context.close();
});
