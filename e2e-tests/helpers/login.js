'use strict';

/**
 * Salesforce login helper for E2E tests.
 *
 * Navigates to the org's MyDomain login form, fills in credentials, submits,
 * and waits until the Lightning Experience shell is ready.
 *
 * Usage (in wdio.conf.js `before` hook or inside a spec `before`):
 *
 *   const { login, navigateToLogBoard } = require('./helpers/login');
 *   await login(browser, { orgUrl, username, password });
 *   await navigateToLogBoard(browser, orgUrl);
 */

const { URL } = require('url');

// Used by login() when no override is supplied — appended to the derived
// MyDomain URL. Empty string lands on the default org page which always
// renders the login form when the user isn't authenticated.
const LOGIN_URL_PATH  = '/';
const LIGHTNING_READY_SELECTOR = '.desktop.container.oneOne';

/**
 * Derive the MyDomain login origin from a Lightning Experience URL.
 *
 *   https://vrp-7c-dev-ed.lightning.force.com  →
 *   https://vrp-7c-dev-ed.my.salesforce.com
 *
 * Why this matters: navigating chromedriver to a *.lightning.force.com URL
 * while not authenticated triggers a Salesforce-side redirect to the
 * MyDomain login form on *.my.salesforce.com. That cross-subdomain hop is
 * exactly what loses the WebDriver window handle and produces the
 * "no such window: target window already closed" cascade we saw in the
 * run log. Going directly to *.my.salesforce.com skips the hop, so the
 * login form loads in the same origin chromedriver opened with.
 *
 * Inputs that are already on my.salesforce.com, or on an unknown domain,
 * are returned unchanged so callers can override this heuristic by passing
 * an explicit MyDomain URL.
 */
function toMyDomainOrigin(orgUrl) {
    try {
        const u = new URL(orgUrl);
        if (u.hostname.endsWith('.lightning.force.com')) {
            const sub = u.hostname.slice(0, -('.lightning.force.com'.length));
            return `${u.protocol}//${sub}.my.salesforce.com`;
        }
        return u.origin;
    } catch (_) {
        // Malformed input — fall back to whatever was passed in.
        return orgUrl;
    }
}

/**
 * Reattach the WebDriver session to a window that's actually alive.
 *
 * Why: when Salesforce navigation hops across subdomains, certain chromedriver
 * builds leave the session bound to a target that's already been torn down.
 * Subsequent commands fail with "no such window: target window already closed"
 * — that's the cascade documented in e2e.log when logFilter.spec.js tried to
 * start its session. Iterating the handle list and probing each one with a
 * cheap getUrl() call lets us find a window that still answers the WebDriver
 * protocol, instead of blindly switching to the last (possibly dead) handle.
 *
 * Returns true if it found and switched to a live window, false otherwise.
 *
 * @param {WebdriverIO.Browser} browser
 * @returns {Promise<boolean>}
 */
async function reattachToLiveWindow(browser) {
    let handles;
    try {
        handles = await browser.getWindowHandles();
    } catch (_) {
        return false;  // session itself is gone; nothing to do
    }
    if (!handles || handles.length === 0) return false;

    // Iterate from newest → oldest. Newer handles are usually the right
    // target (post-redirect), but if the newest is the dead one we fall
    // back through the older handles instead of blindly trusting it.
    for (let i = handles.length - 1; i >= 0; i--) {
        try {
            await browser.switchToWindow(handles[i]);
            // Probe with a no-op WebDriver command. If the window is dead
            // this throws "no such window" and we move on to the next.
            await browser.getUrl();
            return true;
        } catch (_) {
            // dead handle — try the next one
        }
    }
    return false;
}

/**
 * Returns true if the browser is already inside a Lightning Experience shell.
 * Used to skip the login form when cookies/SSO already authenticated us.
 */
async function isOnLightning(browser) {
    try {
        const url = await browser.getUrl();
        return url.includes('/lightning/') || url.includes('/one/');
    } catch (_) {
        return false;
    }
}

/**
 * Log in to a Salesforce org via the standard username/password form.
 *
 * The function navigates directly to the org's MyDomain origin
 * (*.my.salesforce.com) rather than the Lightning origin
 * (*.lightning.force.com) to avoid the cross-subdomain redirect that
 * chromedriver can choke on. See toMyDomainOrigin() for the rationale.
 *
 * @param {WebdriverIO.Browser} browser
 * @param {{ orgUrl: string, username: string, password: string }} opts
 */
async function login(browser, { orgUrl, username, password }) {
    if (!username || !password) {
        throw new Error(
            'SF_USERNAME and SF_PASSWORD environment variables are required to run E2E tests.'
        );
    }

    // Navigate directly to the MyDomain login origin. This is the page that
    // *.lightning.force.com would have redirected to anyway — going there
    // first sidesteps the cross-subdomain hop that kills the window handle.
    const loginOrigin = toMyDomainOrigin(orgUrl);
    await browser.url(loginOrigin + LOGIN_URL_PATH);
    await reattachToLiveWindow(browser);

    // If cookies/SSO already dropped us into Lightning, skip the credential
    // form — waiting 15s for #username on a Lightning page is pure delay.
    if (await isOnLightning(browser)) {
        return;
    }

    // Fill in username
    const usernameInput = await browser.$('#username');
    await usernameInput.waitForExist({ timeout: 15000 });
    await usernameInput.setValue(username);

    // Fill in password
    const passwordInput = await browser.$('#password');
    await passwordInput.setValue(password);

    // Click Login button
    const loginBtn = await browser.$('#Login');
    await loginBtn.click();

    // Successful login redirects from my.salesforce.com to lightning.force.com.
    // That single hop is the one we couldn't avoid; recover the window handle
    // once more so the readiness poll below has a live target.
    await reattachToLiveWindow(browser);

    // Wait for Lightning shell to be ready.
    await browser.waitUntil(
        async () => {
            try {
                const url = await browser.getUrl();
                return url.includes('/lightning/') || url.includes('/one/');
            } catch (_) {
                // Window handle changed underneath us; try to recover and
                // keep polling rather than aborting the whole spec.
                await reattachToLiveWindow(browser);
                return false;
            }
        },
        {
            timeout: 30000,
            timeoutMsg: 'Lightning Experience did not load after login',
        }
    );
}

/**
 * Navigate to the LogBoard Lightning tab.
 *
 * Uses SF_APP_URL if provided; otherwise builds the standard Lightning tab URL
 * from the org's base URL.
 *
 * @param {WebdriverIO.Browser} browser
 * @param {string} orgUrl   – e.g. https://myorg.lightning.force.com
 */
async function navigateToLogBoard(browser, orgUrl) {
    // Prefer an explicit URL override (useful for sandboxes / custom domains)
    const appUrl = global.SF_APP_URL
        || `${orgUrl}/lightning/n/lgb__Log_Board`;

    await browser.url(appUrl);
    // Same rationale as login(): a navigation to the LogBoard tab can leave
    // chromedriver bound to a stale window handle when the org bounces
    // across subdomains. Probe-each-handle reattach finds a live target.
    await reattachToLiveWindow(browser);

    // Wait for the root logBoard LWC custom element to appear in the DOM
    await browser.waitUntil(
        async () => {
            try {
                const el = await browser.$('lgb-log-board');
                return (await el.isExisting());
            } catch (_) {
                // Window vanished mid-poll — try to recover instead of dying.
                await reattachToLiveWindow(browser);
                return false;
            }
        },
        {
            timeout: 30000,
            timeoutMsg: 'LogBoard component did not appear on the page',
        }
    );

    // Give Lightning a moment to finish rendering sub-components
    await browser.pause(1500);
}

/**
 * Wait for a Lightning toast notification and return its message text.
 *
 * @param {WebdriverIO.Browser} browser
 * @param {number} [timeout=10000]
 * @returns {Promise<string>}
 */
async function getToastMessage(browser, timeout = 10000) {
    const toast = await browser.$('.toastMessage');
    await toast.waitForExist({ timeout });
    return toast.getText();
}

/**
 * Dismiss any visible Lightning toast.
 *
 * @param {WebdriverIO.Browser} browser
 */
async function dismissToast(browser) {
    try {
        const closeBtn = await browser.$('.toastClose');
        if (await closeBtn.isExisting()) {
            await closeBtn.click();
        }
    } catch (_) {
        // No toast visible; that's fine
    }
}

module.exports = {
    login,
    navigateToLogBoard,
    getToastMessage,
    dismissToast,
    // Exported so specs can reuse the recovery primitive in their own
    // before() hooks without re-implementing it.
    reattachToLiveWindow,
    toMyDomainOrigin,
};
