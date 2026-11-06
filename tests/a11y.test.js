// Quality bar, measured from the rendered page (not read from CSS):
//   - text contrast >= WCAG AA (4.5:1, or 3:1 for large text), sampled from real screenshot pixels
//   - every tappable control has a >= 44x44 px hit area (an invisible ::after may extend a small visual)
//   - no horizontal overflow at 320 / 360 / 390 px widths
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { chromium, openApp, MEASURE } = require('./helpers');

let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser.close(); });

// state -> [setup, [label, selector]...]
const CONTRAST = {
  welcome: ["", [['subtitle on yellow', '#ob-welcome .onboard-sub'], ['skip link', '#ob-welcome .demo-link'], ['primary button', '#ob-welcome .btn-primary']]],
  otp: ["obGoTo('otp'); resetOtp(); otpMessage(\"That code didn't match. Check the text and try again.\")", [['resend link', '#otpResend'], ['change number', '.ob-change'], ['wrong code', '#otpError']]],
  phone: ["obGoTo('verify'); document.getElementById('obPhone').value = '1'; obSubmitPhone()", [['terms line', '.ob-terms'], ['phone error', '#obPhoneErr']]],
  confirm: ["obGoTo('confirm')", [['Verified badge', '.verified-badge'], ['school line', '.onboard-child-row .contact-role']]],
  track: ["obFinish()", [['inactive pill', '.child-pill:not(.active)'], ['active pill', '.child-pill.active'], ['status chip', '.hero .chip'], ['ETA unit', '.eta-unit'], ['next stop', '.eta-next'], ['map chip', '.map-live'], ['driver role', '#trackDriverRole'], ['upcoming stop label', '.stop.todo .label'], ['greeting', '#greetLine'], ['tab label', '#navtab-schedule span'], ['active tab label', '#navtab-track span']]],
  trackmap: ["obFinish(); document.getElementById('mainContent').scrollTop = 9999; updateHeaderGlass()", [['distance', '.dist-value'], ['distance place', '.dist-where'], ['from home', '.dist-unit'], ['frosted greeting', '#greetLine']]],
  lost: ["obFinish(); trackData.jane.lost = true; trackData.jane.lostMinutes = 7; renderTrack()", [['alert chip', '.hero.lost .chip.alert'], ['last seen text', '.hero.lost .eta-next'], ['call button', '.lost-action']]],
  exam: ["obFinish(); switchTab('schedule'); calSelectDate('2026-09-10')", [['weekday initial', '.cal-weekdays span'], ['exam badge', '.cal-badge-exam'], ['exam note', '.cal-detail-note'], ['running late', '.call-late b']]],
  history: ["obFinish(); switchTab('history')", [['row time', '.hist-card .notif-time'], ['empty note', '.hist-empty']]],
  notifs: ["obFinish(); openNotifications()", [['read title', '.notif-item.read .notif-title'], ['timestamp', '.notif-time'], ['child tag', '.notif-who']]],
  subscreen: ["obFinish(); switchTab('profile'); goToSecurity()", [['header title', '#pageTitle'], ['field label', '#sub-security .field label']]],
  account: ["obFinish(); switchTab('profile')", [['section label', '#sub-account .section-label'], ['soon tag', '.row-soon'], ['version', '.app-version'], ['phone', '.profile-phone']]],
  family: ["obFinish(); goToFamily()", [['section hint', '.section-hint'], ['friend role', '#friendList .contact-role'], ['school line', '#child-jane .contact-role']]],
  privacy: ["obFinish(); goToPrivacy()", [['status tag', '.status-tag:not(.on)'], ['on tag', '.status-tag.on'], ['row hint', '.status-row .hint']]],
  personalError: ["obFinish(); goToPersonal(); document.getElementById('pfEmail').value = 'x'; savePersonal()", [['field error', '#pfEmailErr'], ['field hint', '#pfPhoneHint']]],
  terms: ["obFinish(); goToTerms()", [['body text', '.legal p:nth-of-type(3)'], ['meta', '.legal-meta'], ['draft note', '.legal-draft']]],
  call: ["obFinish(); openSheet('call')", [['driver role on ink', '.cp-role'], ['contact role', '.cr-role'], ['hint', '.sheet-hint'], ['edit link', '.link-btn']]],
};

for (const [state, [setup, items]] of Object.entries(CONTRAST)) {
  test(`contrast AA: ${state}`, async () => {
    const { page, context } = await openApp(browser, { skipOnboarding: false });
    if (setup) await page.evaluate(setup);
    await page.waitForTimeout(900);
    const png = (await page.screenshot()).toString('base64');
    const res = await page.evaluate(MEASURE, { png, items });
    const bad = res.filter((r) => r.missing || r.ratio < r.need).map((r) => r.missing ? `${r.label}: element not found` : `${r.label}: ${r.ratio}:1 (needs ${r.need})`);
    assert.deepEqual(bad, []);
    await context.close();
  });
}

const TAP = (root) => {
  const R = document.querySelector(root) || document, out = [];
  R.querySelectorAll('a, button, input, select, [onclick], .switch').forEach((el) => {
    const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return;
    if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) return;
    for (let p = el; p; p = p.parentElement) { const s = getComputedStyle(p); if (s.display === 'none' || s.visibility === 'hidden') return; }
    if (getComputedStyle(el).pointerEvents === 'none') return;
    let w = r.width, h = r.height;
    for (const ps of ['::after', '::before']) {
      const s = getComputedStyle(el, ps);
      if (s.content !== 'none' && s.position === 'absolute') { w = Math.max(w, parseFloat(s.width) || 0); h = Math.max(h, parseFloat(s.height) || 0); }
    }
    if (Math.min(w, h) < 43.5) out.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} ${Math.round(w)}x${Math.round(h)} "${(el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 20)}"`);
  });
  return [...new Set(out)];
};
const TAP_STATES = [
  ['onboarding', '', '#onboardFlow'], ['otp', "obGoTo('otp'); resetOtp()", '#onboardFlow'],
  ['phone', "obGoTo('verify')", '#onboardFlow'], ['onboarding terms', "obGoTo('terms')", '#onboardFlow'],
  ['Track', 'obFinish()', '.screen'], ['Schedule', "obFinish(); switchTab('schedule'); calSelectDate('2026-09-10')", '.screen'],
  ['History', "obFinish(); switchTab('history')", '.screen'], ['Account', "obFinish(); switchTab('profile')", '.screen'],
  ['Login & security', "obFinish(); switchTab('profile'); goToSecurity(); toggleRecovery()", '#sub-security'],
  ['Personal info', "obFinish(); goToPersonal()", '#sub-personal'], ['Family', "obFinish(); goToFamily(); toggleChild('jane')", '#sub-family'],
  ['Privacy', "obFinish(); goToPrivacy()", '#sub-privacy'], ['Photo sheet', "obFinish(); isAppleDevice = () => true; openPhotoSheet('me')", '#photoSheet'],
  ['Friend sheet', "obFinish(); goToFamily(); openFriendSheet()", '#friendSheet'],
  ['Notifications', 'obFinish(); openNotifications()', '#notifOverlay'], ['Full map', 'obFinish(); openRouteView()', '#routeOverlay'],
  ['FAB open', 'obFinish(); toggleFab()', '.navwrap'], ['Call sheet', "obFinish(); openSheet('call')", '#callSheet'],
  ['Call sheet edit', "obFinish(); openSheet('call'); toggleCallEdit()", '#callSheet'], ['Share sheet', "obFinish(); openSheet('share')", '#shareSheet'],
];
for (const [name, setup, root] of TAP_STATES) {
  test(`tap targets >= 44px: ${name}`, async () => {
    const { page, context } = await openApp(browser, { skipOnboarding: false });
    if (setup) await page.evaluate(setup);
    await page.waitForTimeout(800);
    assert.deepEqual(await page.evaluate(TAP, root), []);
    await context.close();
  });
}

for (const [w, h] of [[320, 568], [360, 640], [390, 844]]) {
  test(`no horizontal overflow and no errors at ${w}x${h}`, async () => {
    const { page, context, errors } = await openApp(browser, { width: w, height: h });
    for (const tab of ['track', 'schedule', 'history', 'profile', 'personal', 'family', 'privacy', 'security', 'terms']) {
      await page.evaluate((t) => (window['goTo' + t[0].toUpperCase() + t.slice(1)] || (() => switchTab(t)))(), tab); await page.waitForTimeout(250);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${tab} overflows sideways`);
    }
    assert.deepEqual(errors, []);
    await context.close();
  });
}
