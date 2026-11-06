// The header child switcher is the ONLY way the active child changes (setActiveChild).
// Every tab, sheet and the full map must follow it.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { chromium, openApp, text, activePills, isVisible } = require('./helpers');

let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser.close(); });

test('switcher shows on child tabs and hides on Account', async () => {
  const { page, context } = await openApp(browser);
  assert.ok(await isVisible(page, '#trackSwitch'), 'Track');
  for (const tab of ['schedule', 'history']) {
    await page.click(`#navtab-${tab}`); await page.waitForTimeout(250);
    assert.ok(await isVisible(page, '#trackSwitch'), tab);
  }
  await page.click('#accountBtn'); await page.waitForTimeout(250);
  assert.ok(!(await isVisible(page, '#trackSwitch')), 'Account is about the parent, not a child');
  await context.close();
});

test('one tap on Liam re-renders every tab for Liam', async () => {
  const { page, context, errors } = await openApp(browser);
  await page.click('#navtab-schedule'); await page.waitForTimeout(250);
  await page.click('#trackSwitch .child-pill:nth-child(2)'); await page.waitForTimeout(350);
  const examDays = await page.evaluate(() => [...document.querySelectorAll('.cal-day')].filter((d) => d.querySelector('.cal-dot')).map((d) => d.firstChild.textContent.trim()));
  assert.deepEqual(examDays, ['14', '21'], "Liam's exam days");
  await page.evaluate(() => calSelectDate('2026-09-10')); await page.waitForTimeout(150);
  assert.match(await text(page, '#calDetail'), /No exam/, "Jane's exam must not leak into Liam's calendar");
  await page.click('#navtab-history'); await page.waitForTimeout(250);
  const hist = await text(page, '#historyList');
  assert.ok(hist.includes('Ms. Dlamini') && !hist.includes('Mr. Naidoo'), 'History is Liam\'s');
  await page.click('#navtab-track'); await page.waitForTimeout(350);
  assert.equal(await text(page, '#trackDriverName'), 'Ms. Dlamini');
  const pressed = await page.evaluate(() => [...document.querySelectorAll('#trackSwitch .child-pill')].map((p) => p.getAttribute('aria-pressed')));
  assert.deepEqual(pressed, ['false', 'true']);
  assert.deepEqual(errors, []);
  await context.close();
});

test('tapping a notification switches child, then navigates', async () => {
  const { page, context } = await openApp(browser);
  await page.evaluate(() => openNotifications()); await page.waitForTimeout(500);
  assert.equal(await page.evaluate(() => document.querySelectorAll('.notif-who').length), 6, 'every notification is tagged with a child');
  await page.evaluate(() => handleNotifTap(5)); await page.waitForTimeout(700); // Liam's spelling test
  assert.deepEqual(await activePills(page), [false, true]);
  assert.ok(await page.evaluate(() => document.getElementById('tab-schedule').classList.contains('active')));
  assert.match(await text(page, '#calDetail'), /Liam's spelling test[\s\S]*12:00|12:00[\s\S]*Liam's spelling test/);
  await context.close();
});

test('swiping the full-map carousel updates the header switcher', async () => {
  const { page, context } = await openApp(browser);
  await page.evaluate(() => setActiveChild('liam'));
  await page.evaluate(() => openRouteView()); await page.waitForTimeout(700);
  await page.evaluate(() => { document.getElementById('routeCarousel').scrollLeft = 0; }); await page.waitForTimeout(500);
  assert.deepEqual(await activePills(page), [true, false]);
  await context.close();
});

test('map card: live route, lost-signal chip, opens full map', async () => {
  const { page, context } = await openApp(browser);
  assert.ok(await page.evaluate(() => !!document.querySelector('#miniMap svg use')));
  await page.evaluate(() => toggleSignalDemo()); await page.waitForTimeout(2300);
  assert.match(await text(page, '#mapLive'), /Last seen/);
  await page.evaluate(() => toggleSignalDemo());
  await page.evaluate(() => document.getElementById('mapCard').click()); await page.waitForTimeout(600);
  assert.ok(await page.evaluate(() => document.getElementById('routeOverlay').classList.contains('open')));
  assert.ok(await page.evaluate(() => [...document.querySelectorAll('svg use')].every((u) => document.querySelector(u.getAttribute('href')))), 'every sprite icon resolves');
  await context.close();
});

test('Account opens from the header avatar; the nav holds only the child tabs and docks the FAB', async () => {
  const { page, context } = await openApp(browser);
  const tabs = await page.evaluate(() => [...document.querySelectorAll('#tabbar .tab')].map((t) => t.id));
  assert.deepEqual(tabs, ['navtab-track', 'navtab-schedule', 'navtab-history'], 'no Profile tab');
  await page.click('#accountBtn'); await page.waitForTimeout(300);
  assert.ok(await page.evaluate(() => document.getElementById('tab-profile').classList.contains('active')), 'avatar opens Account');
  assert.equal(await page.evaluate(() => document.getElementById('accountBtn').getAttribute('aria-current')), 'page');
  assert.equal(await page.evaluate(() => document.querySelectorAll('#tabbar [aria-current]').length), 0, 'no tab marked on Account');
  await page.evaluate(() => goToSecurity());
  assert.ok(!(await isVisible(page, '#accountBtn')), 'the back button takes the avatar\'s place on sub-screens');
  // The FAB sits at the pill's right end, and its shortcuts carry visible labels.
  const pos = await page.evaluate(() => { const f = document.getElementById('fab').getBoundingClientRect(), t = document.getElementById('tabbar').getBoundingClientRect(); return { gap: f.left - t.right, mid: Math.abs((f.top + f.bottom) / 2 - (t.top + t.bottom) / 2) }; });
  assert.ok(pos.gap >= 6 && pos.gap <= 14 && pos.mid < 2, `FAB docked beside the pill (${JSON.stringify(pos)})`);
  await page.evaluate(() => { goBack(); switchTab('track'); toggleFab(); }); await page.waitForTimeout(400);
  const labels = await page.evaluate(() => [...document.querySelectorAll('.radial-label')].map((l) => l.innerText));
  assert.deepEqual(labels, ['Call', 'Full route', 'Exam day', 'Share ETA']);
  await context.close();
});

test('header greets by the phone\'s local time; Track shows route, driver, then the map with each child\'s distance from home', async () => {
  const { page, context } = await openApp(browser);
  const greet = await page.evaluate(() => [0, 4, 5, 11, 12, 16, 17, 23].map((h) => greetingFor(h)));
  assert.deepEqual(greet, ['Good evening', 'Good evening', 'Good morning', 'Good morning', 'Good afternoon', 'Good afternoon', 'Good evening', 'Good evening']);
  const shown = await page.evaluate(() => document.getElementById('greetLine').textContent);
  assert.equal(shown, (await page.evaluate(() => greetingFor(new Date().getHours()))) + ',');
  // Order on the sheet: Today's route, the driver card, then the map.
  const order = await page.evaluate(() => ['#trackLine', '.driver-card', '#mapCard'].map((s) => document.querySelector(s).getBoundingClientRect().top));
  assert.ok(order[0] < order[1] && order[1] < order[2], `route, driver, map (${order})`);
  const rows = await page.evaluate(() => [...document.querySelectorAll('#distList .dist-row')].map((r) => r.getAttribute('aria-label')));
  assert.deepEqual(rows, ['Jane: about 4.1 kilometres from home. Bus near Oak Street.', 'Liam: about 1.8 kilometres from home. Bus near Birch Close.']);
  await page.evaluate(() => { trackData.jane.lost = true; renderTrack(); });
  assert.match(await page.evaluate(() => document.querySelector('#distList .dist-row').getAttribute('aria-label')), /Last seen near Oak Street/);
  await context.close();
});
