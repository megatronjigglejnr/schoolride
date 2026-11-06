// Loads the HTML prototype (app/index.html) in headless Chromium and saves its mock data, plus the mini-map
// geometry its own functions compute, to __tests__/fixtures/prototype-data.json. The port's data tests
// compare against this file, so the prototype stays the source of truth.
//
// Re-run after changing data in app/app.js:  npm run dump-prototype
// Uses the Playwright install at the repo root (npm run setup there).
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require(path.resolve(__dirname, '../../node_modules/playwright'));

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + path.resolve(__dirname, '../../app/index.html'));
  const data = await page.evaluate(() => {
    const mini = {};
    for (const key of Object.keys(miniMapSpec)) {
      const spec = miniMapSpec[key];
      const segs = mmSegs(spec.pts);
      const parts = mmSplit(segs[spec.busSeg], spec.busT);
      mini[key] = {
        donePath: mmPath(segs.slice(0, spec.busSeg).concat([parts[0]])),
        restPath: mmPath([parts[1]].concat(segs.slice(spec.busSeg + 1))),
        bus: parts[0][3],
      };
    }
    return {
      trackData,
      callData,
      callPrefs,
      examDaysByChild,
      todayStr,
      historyData,
      notifications: notifications.map((n) => ({ ...n, goto: n.goto ? String(n.goto) : null })),
      miniMapSpec,
      miniMapLayout: mini,
      routeMaps,
      routeTitles,
      OTP_CORRECT,
      DEMO_CALLS,
    };
  });
  await browser.close();
  const out = path.resolve(__dirname, '../__tests__/fixtures/prototype-data.json');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(data, null, 2) + '\n');
  console.log('Wrote ' + path.relative(process.cwd(), out));
})();
