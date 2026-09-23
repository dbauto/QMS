// Run against the served static site after functional tests, without parallel load.
const fs = require('node:fs');
(async () => {
  const { default: lighthouse } = await import('lighthouse');
  const { launch } = await import('chrome-launcher');
  const { default: desktopConfig } = await import('lighthouse/core/config/desktop-config.js');
  fs.mkdirSync('artifacts/lighthouse', { recursive: true });
  const chrome = await launch({ chromePath: process.env.QMS_CHROMIUM, chromeFlags: ['--headless=new'] });
  try {
    const results = {};
    for (const mode of ['desktop', 'mobile']) {
      const flags = { port: chrome.port, output: 'html', logLevel: 'error', onlyCategories: ['performance','accessibility','best-practices'] };
      const result = await lighthouse('http://127.0.0.1:4173/', flags, mode === 'desktop' ? desktopConfig : undefined);
      fs.writeFileSync(`artifacts/lighthouse/${mode}.html`, result.report);
      results[mode] = Object.fromEntries(Object.entries(result.lhr.categories).map(([key, value]) => [key, Math.round(value.score * 100)]));
      results[mode].metrics = Object.fromEntries(['first-contentful-paint','largest-contentful-paint','total-blocking-time','cumulative-layout-shift'].map(id => [id, result.lhr.audits[id].numericValue]));
      fs.writeFileSync(`artifacts/lighthouse/${mode}.json`, JSON.stringify(result.lhr, null, 2));
    }
    fs.writeFileSync('artifacts/lighthouse/summary.json', JSON.stringify(results, null, 2));
    console.log(JSON.stringify(results, null, 2));
  } finally {
    try { await chrome.kill(); }
    catch (error) {
      if (error.code !== 'EPERM') throw error;
      console.warn('Audit finished; Windows kept the temporary Chrome profile locked.');
    }
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
