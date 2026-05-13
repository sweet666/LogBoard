'use strict';

/**
 * WebDriverIO + UTAM configuration for LogBoard E2E tests.
 *
 * Required environment variables:
 *   SF_ORG_URL              – Salesforce org URL, e.g. https://yourorg.lightning.force.com
 *   SF_USERNAME             – Salesforce test user login
 *   SF_PASSWORD             – Salesforce test user password
 *
 * Optional environment variables:
 *   HEADLESS                – Set to "true" to run Chrome in headless mode (default: false)
 *   SF_APP_URL              – Full URL to the LogBoard Lightning tab (auto-built from org URL if omitted)
 *   CHROME_USER_DATA_DIR    – Override the persistent Chrome profile directory.
 *                             Defaults to <e2e-tests>/.chrome-profile.
 *
 * One-time setup to avoid Salesforce's "we just emailed you a verification code"
 * prompt on every run:
 *
 *   1. Run `npm run test:e2e` once. Chrome will open and Salesforce will ask
 *      for the emailed verification code. Enter it and check "Don't ask again."
 *   2. From that point on Salesforce remembers the device (the cookies live
 *      in CHROME_USER_DATA_DIR), and the verification step is skipped on
 *      every subsequent run. To force re-verification, delete the profile
 *      directory.
 *
 * Usage:
 *   npm run test:e2e                  # headed Chrome
 *   npm run test:e2e:headless         # headless Chrome
 *   npm run test:e2e:debug            # verbose logs
 */

const path = require('path');

const ORG_URL      = process.env.SF_ORG_URL   || 'https://login.salesforce.com';
const HEADLESS     = process.env.HEADLESS === 'true';

// Persistent Chrome profile directory. Chrome stores cookies, localStorage,
// and the device-trust marker Salesforce uses to skip identity verification
// here, so reusing the same path across runs means the user only has to
// enter the emailed verification code once.
const CHROME_USER_DATA_DIR = process.env.CHROME_USER_DATA_DIR
    || path.resolve(__dirname, '.chrome-profile');

exports.config = {
    // ─── Runner ──────────────────────────────────────────────────────────────
    runner: 'local',

    // ─── Specs ───────────────────────────────────────────────────────────────
    specs: [
        path.resolve(__dirname, 'utam/**/*.spec.js'),
    ],
    exclude: [],

    // ─── Capabilities ────────────────────────────────────────────────────────
    maxInstances: 1,
    capabilities: [
        {
            browserName: 'chrome',
            'goog:chromeOptions': {
                args: [
                    ...(HEADLESS ? ['--headless', '--disable-gpu'] : []),
                    '--no-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-web-security',
                    '--window-size=1440,900',
                    // Reuse the same Chrome profile across runs so the
                    // device stays "trusted" with Salesforce — see the
                    // one-time setup note at the top of this file.
                    `--user-data-dir=${CHROME_USER_DATA_DIR}`,
                ],
            },
        },
    ],

    // ─── Services ────────────────────────────────────────────────────────────
    // NOTE: the wdio-utam-service was previously configured with an
    // `injectionConfigs` entry pointing at `__utam__/utam.config.json`, but the
    // utam compiler does not emit a profile JSON config and none of the specs
    // in utam/*.spec.js actually load UTAM page objects (they use plain
    // browser.$ / shadow$ instead). The missing file caused the loader to
    // throw in the worker's `before` hook, which corrupted the browser session
    // and produced the "Lightning Experience did not load after login" /
    // "no such window" cascade for every subsequent spec. Until the specs
    // start consuming the compiled page objects, the utam service is omitted.
    services: [
        'chromedriver',
    ],

    // ─── Framework ───────────────────────────────────────────────────────────
    framework: 'mocha',
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000,
    },

    // ─── Reporters ───────────────────────────────────────────────────────────
    reporters: [
        'spec',
    ],

    // ─── Logging ─────────────────────────────────────────────────────────────
    logLevel: 'warn',
    // Per-driver log level overrides.
    //
    //   webdriver: 'silent' — chromedriver's raw "no such shadow root"
    //   responses are NOT failures. webdriverio detects the 404 and falls
    //   back to a JavaScript shim that succeeds. Logging each one as ERROR
    //   produced a wall of red in the run log that looked like a fire
    //   and pushed the user to kill the run before debugControl could
    //   finish its (passing) sweep. Silencing the raw driver logger
    //   eliminates the noise without affecting test behavior.
    //
    //   webdriverio: 'error' — the higher-level wdio logger keeps emitting
    //   real session/protocol problems (e.g. the "no such window" cascade
    //   we saw in earlier failing runs), so genuine bugs still surface.
    logLevels: {
        webdriver:   'silent',
        webdriverio: 'error',
    },

    // ─── Run control ─────────────────────────────────────────────────────────
    // Stop the whole run on the first failed test. Without this, a spec that
    // hangs on a dead window (as logFilter did in e2e.log) leaves the four
    // subsequent specs to each spin up, fail the same way, and stretch the
    // run to the framework timeout — wasting minutes per re-run.
    bail: 1,

    // ─── Timeouts ────────────────────────────────────────────────────────────
    waitforTimeout: 15000,
    connectionRetryTimeout: 90000,
    connectionRetryCount: 3,

    // ─── Hooks ───────────────────────────────────────────────────────────────
    /**
     * beforeSession: attach useful properties to the global scope so every
     * spec file can read org credentials without re-importing env variables.
     */
    beforeSession() {
        global.SF_ORG_URL  = process.env.SF_ORG_URL   || 'https://login.salesforce.com';
        global.SF_USERNAME = process.env.SF_USERNAME   || '';
        global.SF_PASSWORD = process.env.SF_PASSWORD   || '';
        global.SF_APP_URL  = process.env.SF_APP_URL    || '';
    },

    /**
     * before: runs once before the first test. Performs Salesforce login
     * so all spec files start with an authenticated session.
     *
     * login() navigates directly to the org's MyDomain origin
     * (*.my.salesforce.com) — see helpers/login.js#toMyDomainOrigin — to
     * avoid the cross-subdomain redirect from *.lightning.force.com that
     * was killing chromedriver's window handle on the second-and-later
     * spec sessions in earlier runs.
     */
    async before() {
        const { login } = require('./helpers/login');
        await login(browser, {
            orgUrl:   global.SF_ORG_URL,
            username: global.SF_USERNAME,
            password: global.SF_PASSWORD,
        });
    },
};
