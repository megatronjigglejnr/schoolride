// Account: personal info, photos, family with trusted friends, privacy, and the terms.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { chromium, openApp, text, isVisible } = require('./helpers');

let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser.close(); });

// A 2x2 PNG, enough to stand in for a camera or library photo.
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAEklEQVR4nGP4z8DAwMDAxAAABRgBAWS3EuQAAAAASUVORK5CYII=', 'base64');

test('Account lists its sections, and Back returns to wherever you came from', async () => {
  const { page, context, errors } = await openApp(browser);
  await page.click('#accountBtn'); await page.waitForTimeout(200);
  const rows = await page.evaluate(() => [...document.querySelectorAll('#sub-account .row-label')].map((e) => e.textContent));
  assert.deepEqual(rows, ['Personal info', 'Family', 'Privacy', 'Login & security', 'Payment', 'Terms & conditions']);
  await page.evaluate(() => goToPrivacy());
  assert.equal(await text(page, '#pageTitle'), 'Privacy');
  await page.click('#sub-privacy .row-item'); // Terms, from Privacy
  assert.equal(await text(page, '#pageTitle'), 'Terms & conditions');
  assert.ok(await isVisible(page, '.legal h3'), 'the terms are readable');
  await page.click('#backBtn');
  assert.equal(await text(page, '#pageTitle'), 'Privacy', 'Back from Terms returns to Privacy');
  await page.click('#backBtn');
  assert.ok(await isVisible(page, '#sub-account'), 'then to Account');
  assert.ok(await isVisible(page, '#accountBtn'), 'and the avatar is back');
  assert.deepEqual(errors, []);
  await context.close();
});

test('Personal info edits name, phone and email; bad values get a visible message', async () => {
  const { page, context } = await openApp(browser);
  await page.evaluate(() => goToPersonal());
  assert.deepEqual(await page.evaluate(() => ['pfName', 'pfPhone', 'pfEmail'].map((id) => document.getElementById(id).type)), ['text', 'tel', 'email']);
  await page.fill('#pfName', '');
  await page.fill('#pfEmail', 'not-an-email');
  await page.click('#personalForm .btn-primary');
  assert.equal(await text(page, '#pfNameErr'), 'Enter your name.');
  assert.match(await text(page, '#pfEmailErr'), /email address/);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'pfName', 'focus moves to the first problem');
  assert.equal(await page.evaluate(() => profile.name), 'Sarah Doe', 'nothing saved');

  await page.fill('#pfName', 'Sarah Mokoena');
  await page.fill('#pfPhone', '+27 82 555 0199');
  await page.fill('#pfEmail', 'sarah@example.com');
  await page.click('#personalForm .btn-primary');
  assert.match(await text(page, '#savedPersonal'), /texted a code to \+27 82 555 0199/, 'a new number is confirmed by code');
  assert.equal(await text(page, '.greet-name'), 'Sarah');
  assert.equal(await page.evaluate(() => document.querySelector('#accountBtn .pic-initials').textContent), 'SM', 'initials follow the name');
  assert.equal(await page.evaluate(() => document.getElementById('accountBtn').getAttribute('aria-label')), 'Account, Sarah Mokoena');
  await page.evaluate(() => { goBack(); });
  assert.equal(await text(page, '#sub-account .profile-phone'), '+27 82 555 0199');
  await context.close();
});

test('a profile photo replaces the initials everywhere; Memoji is offered only on Apple devices', async () => {
  const { page, context } = await openApp(browser);
  await page.evaluate(() => { switchTab('profile'); isAppleDevice = () => false; });
  await page.click('#sub-account .profile-avatar');
  await page.waitForTimeout(100);
  assert.equal(await isVisible(page, '#memojiRow'), false, 'no Memoji off Apple devices');
  assert.equal(await isVisible(page, '#photoRemoveRow'), false, 'nothing to remove yet');
  await page.setInputFiles('#photoInput', { name: 'me.png', mimeType: 'image/png', buffer: PNG });
  await page.waitForFunction(() => photos.me);
  const withPhoto = await page.evaluate(() => [...document.querySelectorAll('[data-pic="me"]')].every((e) => e.classList.contains('has-photo') && e.style.backgroundImage.startsWith('url("data:image/png')));
  assert.ok(withPhoto, 'header, Account, Personal info and Family all show the photo');
  assert.equal(await page.evaluate(() => document.getElementById('photoSheet').inert), true, 'the sheet closes');

  await page.evaluate(() => { isAppleDevice = () => true; openPhotoSheet('me'); });
  assert.ok(await isVisible(page, '#memojiRow'), 'Memoji on Apple devices');
  await page.click('#photoRemoveRow');
  assert.equal(await page.evaluate(() => document.querySelector('#accountBtn').classList.contains('has-photo')), false, 'back to initials');

  // A child's photo is set from their card in Family.
  await page.evaluate(() => { goToFamily(); toggleChild('liam'); });
  await page.click('#body-liam .link-btn');
  assert.equal(await text(page, '#photoTitle'), "Liam's photo");
  await page.setInputFiles('#photoInput', { name: 'liam.png', mimeType: 'image/png', buffer: PNG });
  await page.waitForFunction(() => photos.liam);
  assert.ok(await page.evaluate(() => document.querySelector('#child-liam [data-pic="liam"]').classList.contains('has-photo')));
  await context.close();
});

test('Family: children from the school, guardians, and trusted friends who appear in Share ETA', async () => {
  const { page, context } = await openApp(browser);
  await page.evaluate(() => goToFamily());
  assert.equal(await page.evaluate(() => document.getElementById('body-jane').inert), true, 'closed card body is out of the tab order');
  await page.click('#sub-family .row-list .row-item'); // Add a child
  assert.match(await text(page, '#toast'), /Contact your school/, 'no self-service linking');

  await page.click('text=Add a trusted friend'); await page.waitForTimeout(100);
  await page.click('#friendForm .btn-primary');
  assert.equal(await text(page, '#frNameErr'), 'Enter their name.');
  await page.fill('#frName', 'Gogo Dlamini');
  await page.fill('#frPhone', '+27 72 555 0110');
  await page.click('#frRel [role="radio"]:has-text("Grandparent")');
  assert.equal(await page.evaluate(() => document.querySelector('#frRel [aria-checked="true"]').textContent), 'Grandparent');
  await page.click('#friendForm .btn-primary');
  const friends = await page.evaluate(() => [...document.querySelectorAll('#friendList .contact-name')].map((e) => e.textContent));
  assert.deepEqual(friends, ['Naledi Mokoena', 'Gogo Dlamini']);

  const share = await page.evaluate(() => [...document.querySelectorAll('#shareList .btn-share')].map((b) => b.getAttribute('aria-label')));
  assert.deepEqual(share, ['Share with Thabo Doe', 'Share with Naledi Mokoena', 'Share with Gogo Dlamini']);

  await page.click('[aria-label="Remove Naledi Mokoena"]');
  assert.deepEqual(await page.evaluate(() => trustedFriends.map((f) => f.name)), ['Gogo Dlamini']);
  assert.equal(await page.evaluate(() => document.querySelectorAll('#shareList .btn-share').length), 2);
  await context.close();
});

test('Privacy: location never used, analytics and crash reports off by default, data request once', async () => {
  const { page, context } = await openApp(browser);
  await page.evaluate(() => goToPrivacy());
  assert.deepEqual(await page.evaluate(() => ['prefAnalytics', 'prefCrash'].map((id) => document.getElementById(id).getAttribute('aria-checked'))), ['false', 'false']);
  await page.click('#prefAnalytics');
  assert.equal(await page.evaluate(() => document.getElementById('prefAnalytics').getAttribute('aria-checked')), 'true');
  assert.match(await text(page, '#sub-privacy'), /Your phone's location\s+Not used/);
  await page.click('#dataRequestBtn');
  assert.match(await text(page, '#dataRequested'), /sarah\.doe@email\.com within 30 days/);
  assert.equal(await page.evaluate(() => document.getElementById('dataRequestBtn').getAttribute('aria-disabled')), 'true');
  await context.close();
});
