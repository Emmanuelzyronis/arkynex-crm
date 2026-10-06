/**
 * Headless browser test suite for Arkynex CRM
 * Uses Puppeteer to test all public pages, check for JS errors,
 * verify routing redirects, and capture screenshots.
 */
import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const SCREENSHOT_DIR = path.join(path.dirname(__filename), 'screenshots');

const BASE_URL = 'http://localhost:3002';

// Test results collector
const results = {
  tests: [],
  jsErrors: [],
  warnings: [],
};

async function addResult(type, name, passed, detail = '') {
  results.tests.push({ type, name, passed, detail });
  if (!passed && type === 'js_error') {
    results.jsErrors.push({ name, detail });
  } else if (!passed && type !== 'redirect') {
    results.warnings.push({ name, detail });
  }
}

async function screenshot(page, name) {
  const filePath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: false });
  return filePath;
}

async function getConsoleErrors(page) {
  const messages = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      messages.push(`${msg.type()}: ${msg.text()}`);
    }
  });
  // Small delay to catch async errors
  await new Promise(r => setTimeout(r, 500));
  return messages;
}

async function checkHtmlContent(page, name, checks) {
  const html = await page.content();
  const results = {};
  for (const [label, query] of Object.entries(checks)) {
    if (query.includes('#')) {
      const el = await page.$(query);
      results[label] = el !== null;
    } else if (query.startsWith('text:') || query.startsWith('"')) {
      const text = query.replace(/^text:"?/, '').replace(/"$/, '');
      results[label] = html.includes(text);
    } else if (query === 'has_js_errors') {
      results[label] = true; // handled separately
    }
  }
  return results;
}

async function testPage(browser, name, url, config = {}) {
  console.log(`\n--- Testing: ${name} ---`);
  console.log(`URL: ${url}`);

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // Collect JS errors
  const errors = await getConsoleErrors(page);
  for (const err of errors) {
    await addResult('js_error', name, false, err);
  }

  // Navigate
  let navError = null;
  try {
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  } catch (e) {
    navError = e.message;
  }

  const status = page.url();

  if (config.expectedTitle) {
    const title = await page.title();
    const ok = title.includes(config.expectedTitle);
    await addResult('title', name, ok, `Expected "${config.expectedTitle}", got "${title}"`);
  }

  if (config.checkSelectors) {
    for (const [selector, required] of Object.entries(config.checkSelectors)) {
      const exists = await page.$(selector);
      const ok = !required || !!exists;
      await addResult('selector', `${name}:${selector}`, ok, required ? 'Required element missing' : 'Optional element present');
    }
  }

  if (config.checkText) {
    for (const [label, text] of Object.entries(config.checkText)) {
      const bodyText = await page.evaluate(el => el.textContent, await page.$('body'));
      const found = bodyText.includes(text);
      await addResult('text', `${name}:${label}`, found, found ? '' : `Expected to find "${text}"`);
    }
  }

  if (!config.skipScreenshot) {
    try {
      const spath = await screenshot(page, `${name}_${Date.now()}`);
      console.log(`  Screenshot: ${spath}`);
    } catch (_) { /* ignore screenshot errors */ }
  }

  await page.close();

  if (navError) {
    await addResult('navigation', name, false, navError);
  } else {
    await addResult('navigation', name, true, `Final URL: ${status}`);
  }
}

async function testRedirect(browser, fromPath, expectedRedirectPath, name) {
  console.log(`\n--- Redirect Test: ${name} ---`);
  console.log(`From: ${fromPath} -> Expected: ${expectedRedirectPath}`);

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    await page.goto(BASE_URL + fromPath, { waitUntil: 'networkidle0', timeout: 15000 });
    const finalUrl = page.url();
    const redirected = finalUrl.includes(expectedRedirectPath);
    await addResult('redirect', name, redirected, `Navigated to ${finalUrl}, expected ${expectedRedirectPath}`);
    console.log(`  Result: ${redirected ? 'PASS ✓' : 'FAIL ✗'} → ${finalUrl}`);
  } catch (e) {
    await addResult('redirect', name, false, e.message);
  }

  await page.close();
}

async function main() {
  // Create screenshot directory
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  console.log('Starting Arkynex CRM headless browser tests...');
  console.log(`Base URL: ${BASE_URL}\n`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });

  let failed = 0;
  let passed = 0;
  let totalTests = 0;

  try {
    // === PUBLIC PAGES ===

    // Landing page
    await testPage(browser, 'Home Page', `${BASE_URL}/`, {
      expectedTitle: 'Arkynex',
      checkSelectors: {
        'nav': true, // Basic nav element exists
        '#features': true,
      },
      checkText: {
        heading: 'Arkynex',
      },
    });

    // Login page
    await testPage(browser, 'Login Page', `${BASE_URL}/login`, {
      expectedTitle: 'Arkynex — Close',
      checkSelectors: {
        '#fullName': false, // fullName shouldn't be on login
        '#email': true,
        '#password': true,
        'form button[type="submit"]': true,
      },
      checkText: {
        heading: 'Sign in',
        link: "Don't have an account?",
      },
    });

    // Signup page
    await testPage(browser, 'Signup Page', `${BASE_URL}/signup`, {
      expectedTitle: 'Arkynex — Close',
      checkSelectors: {
        '#fullName': true,
        '#email': true,
        '#password': true,
        'form button[type="submit"]': true,
      },
      checkText: {
        heading: 'Create your account',
        link: 'Already have an account?',
      },
    });

    // Protected routes - should redirect to login
    await testRedirect(browser, '/dashboard', '/login', 'Dashboard redirect');
    await testRedirect(browser, '/leads', '/login', 'Leads redirect');
    await testRedirect(browser, '/settings', '/login', 'Settings redirect');
    await testRedirect(browser, '/help', '/login', 'Help redirect');

    // === SUMMARY ===
    totalTests = results.tests.length;
    passed = results.tests.filter(t => t.passed).length;
    failed = totalTests - passed;

    console.log('\n\n' + '='.repeat(60));

    console.log(`\nTotal: ${totalTests} | Passed: ${passed} | Failed: ${failed}\n`);

    if (results.jsErrors.length > 0) {
      console.log(`JS/Console Errors Found: ${results.jsErrors.length}\n`);
      for (const err of results.jsErrors) {
        console.log(`  ⚠️  [${err.name}] ${err.detail}`);
      }
      console.log();
    }

    const failedTests = results.tests.filter(t => !t.passed);
    if (failedTests.length > 0) {
      console.log(`Failed Tests:\n`);
      for (const test of failedTests) {
        console.log(`  ✗ [${test.type}] ${test.name}: ${test.detail}`);
      }
    } else {
      console.log('\nAll tests passed! ✓');
    }

    // Save results to file
    fs.writeFileSync(
      path.join(SCREENSHOT_DIR, 'test-results.json'),
      JSON.stringify(results, null, 2)
    );
    console.log(`\nFull results saved to: ${path.join(SCREENSHOT_DIR, 'test-results.json')}`);

  } finally {
    await browser.close();
  }

  return failed > 0 ? 1 : 0;
}

main().then(code => {
  process.exit(code);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
