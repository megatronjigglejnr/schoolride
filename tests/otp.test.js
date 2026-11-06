// Onboarding code check: correct code plays rings -> deck -> merge -> one green box with a check,
// then advances. A wrong code shakes, clears, and the boxes must stay tappable.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { chromium, openApp } = require('./helpers');

let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser.close(); });

async function toOtp(page) {
  await page.click('text=Get started');
  await page.fill('#obPhone', '+27 82 555 0142');
  await page.click('text=Send code');
  await page.waitForTimeout(450);
}

test('correct code merges into one checked box, then advances', async () => {
  const { page, context, errors } = await openApp(browser, { skipOnboarding: false });
  await toOtp(page);
  await page.keyboard.type('123456');
  await page.waitForFunction(() => document.getElementById('otpRow').classList.contains('solid'), null, { timeout: 6000 });
  const s = await page.evaluate(() => {
    const c = document.querySelector('.otp-check').getBoundingClientRect(), b = document.querySelector('.otp-box:last-child').getBoundingClientRect();
    return { shown: document.getElementById('otpSuccess').classList.contains('show'), dy: Math.abs((c.y + c.height / 2) - (b.y + b.height / 2)), dx: Math.abs((c.x + c.width / 2) - (b.x + b.width / 2)) };
  });
  assert.ok(s.shown, 'check is shown');
  assert.ok(s.dx < 3 && s.dy < 3, 'check is centred in the merged box ' + JSON.stringify(s));
  await page.waitForFunction(() => document.getElementById('ob-confirm').classList.contains('active'), null, { timeout: 4000 });
  assert.deepEqual(errors, []);
  await context.close();
});

test('wrong code shakes, clears, and boxes stay tappable', async () => {
  const { page, context } = await openApp(browser, { skipOnboarding: false });
  await toOtp(page);
  await page.keyboard.type('123450');
  await page.waitForTimeout(600);
  assert.ok(await page.evaluate(() => [...document.querySelectorAll('#otpRow input')].every((i) => i.value === '')), 'cleared');
  await page.click('#otpRow input', { timeout: 2000 }); // regression: the hidden check layer used to swallow this tap
  await page.keyboard.type('123456');
  await page.waitForFunction(() => document.getElementById('ob-confirm').classList.contains('active'), null, { timeout: 7000 });
  await context.close();
});

test('pasting the full code fills all six boxes', async () => {
  const { page, context } = await openApp(browser, { skipOnboarding: false });
  await toOtp(page);
  await page.evaluate(() => {
    const dt = new DataTransfer(); dt.setData('text', '12 34 56');
    document.getElementById('otpRow').dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
  });
  await page.waitForFunction(() => document.getElementById('otpRow').classList.contains('solid'), null, { timeout: 6000 });
  await context.close();
});

test('phone step: a tel field, a visible error for a bad number, and the terms one tap away', async () => {
  const { page, context } = await openApp(browser, { skipOnboarding: false });
  await page.click('text=Get started');
  assert.deepEqual(await page.evaluate(() => { const i = document.getElementById('obPhone'); return [i.type, i.autocomplete]; }), ['tel', 'tel']);
  await page.fill('#obPhone', '082');
  await page.click('text=Send code');
  assert.match(await page.evaluate(() => document.getElementById('obPhoneErr').textContent), /number you gave the school/);
  assert.ok(await page.evaluate(() => document.getElementById('ob-verify').classList.contains('active')), 'stays on the phone step');
  await page.click('#ob-verify .inline-link');
  assert.ok(await page.evaluate(() => document.getElementById('ob-terms').classList.contains('active')));
  assert.ok(await page.evaluate(() => document.querySelectorAll('#obTermsBody .legal h3').length >= 5), 'the same terms as Account');
  await page.click('#ob-terms .ob-back');
  assert.equal(await page.inputValue('#obPhone'), '082', 'the number typed so far is kept');
  await context.close();
});

test('code step: change the number, and a wrong code says so until the parent types again', async () => {
  const { page, context } = await openApp(browser, { skipOnboarding: false });
  await toOtp(page);
  await page.click('text=Change number');
  assert.ok(await page.evaluate(() => document.getElementById('ob-verify').classList.contains('active')), 'back on the phone step');
  assert.equal(await page.inputValue('#obPhone'), '+27 82 555 0142');
  await page.click('text=Send code'); await page.waitForTimeout(450);
  await page.keyboard.type('000000');
  await page.waitForTimeout(500);
  assert.match(await page.evaluate(() => document.getElementById('otpError').textContent), /didn't match/);
  await page.keyboard.type('1');
  assert.equal(await page.evaluate(() => document.getElementById('otpError').textContent), '', 'cleared once they type');
  await context.close();
});

test('reduced motion: a right code goes straight to the check, then on', async () => {
  const { page, context } = await openApp(browser, { skipOnboarding: false }); // the helper emulates reduced motion
  await toOtp(page);
  const t0 = Date.now();
  await page.keyboard.type('123456');
  assert.ok(await page.evaluate(() => document.getElementById('otpSuccess').classList.contains('show')), 'check shown at once');
  await page.waitForFunction(() => document.getElementById('ob-confirm').classList.contains('active'), null, { timeout: 3000 });
  assert.ok(Date.now() - t0 < 2000, `advanced in ${Date.now() - t0}ms`);
  await context.close();
});
