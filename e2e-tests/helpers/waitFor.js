'use strict';

/**
 * Reusable wait/assertion helpers for LogBoard E2E tests.
 *
 * All functions accept a WebdriverIO `browser` instance (or an element root)
 * and return Promises so they can be `await`-ed in test specs.
 */

/**
 * Wait until a CSS selector exists and is displayed inside a given root.
 *
 * @param {WebdriverIO.Browser|WebdriverIO.Element} root
 * @param {string}  selector
 * @param {number}  [timeout=10000]
 * @returns {Promise<WebdriverIO.Element>}
 */
async function waitForVisible(root, selector, timeout = 10000) {
    const el = await root.$(selector);
    await el.waitForDisplayed({ timeout });
    return el;
}

/**
 * Wait until a CSS selector is NOT present or NOT visible inside a given root.
 *
 * @param {WebdriverIO.Browser|WebdriverIO.Element} root
 * @param {string}  selector
 * @param {number}  [timeout=10000]
 */
async function waitForHidden(root, selector, timeout = 10000) {
    const el = await root.$(selector);
    await el.waitForDisplayed({ timeout, reverse: true });
}

/**
 * Wait until the loading spinner inside the logBoard component disappears.
 *
 * @param {WebdriverIO.Browser} browser
 * @param {number} [timeout=20000]
 */
async function waitForSpinnerGone(browser, timeout = 20000) {
    await browser.waitUntil(
        async () => {
            const spinner = await browser.$('lgb-log-board lightning-spinner');
            return !(await spinner.isDisplayed());
        },
        { timeout, timeoutMsg: 'LogBoard spinner did not disappear' }
    );
}

/**
 * Poll until a text condition is met on an element.
 *
 * @param {WebdriverIO.Element} el
 * @param {(text: string) => boolean} predicate
 * @param {number} [timeout=10000]
 */
async function waitForText(el, predicate, timeout = 10000) {
    await browser.waitUntil(
        async () => predicate(await el.getText()),
        { timeout, timeoutMsg: `Element text did not satisfy predicate within ${timeout}ms` }
    );
}

/**
 * Shadow-DOM–aware element retrieval for deeply nested LWC components.
 *
 * Traverses a chain of shadow hosts described as an array of CSS selectors,
 * then returns the final element.
 *
 * Example:
 *   deepShadow(browser, ['lgb-log-board', 'c-log-table', 'table'])
 *
 * @param {WebdriverIO.Browser} browser
 * @param {string[]}            chain   – CSS selectors from outermost to target
 * @returns {Promise<WebdriverIO.Element>}
 */
async function deepShadow(browser, chain) {
    if (chain.length === 0) throw new Error('deepShadow: chain must not be empty');

    let el = await browser.$(chain[0]);
    for (let i = 1; i < chain.length; i++) {
        el = await el.shadow$(chain[i]);
    }
    return el;
}

/**
 * Find a `lightning-button` host inside a shadow root by its `name` property.
 *
 * Why this helper exists: LWC base components declare `name` as an `@api`
 * property and do NOT reflect it to an HTML attribute, so a CSS selector like
 * `lightning-button[name="EnableLogs"]` never matches anything in the live
 * DOM — even though the property is set. This helper queries every
 * `lightning-button` host inside `root`'s shadow root and matches them by
 * the JS property value, which is what the LWC actually carries.
 *
 * Returns `null` if no matching button exists (useful for asserting absence).
 *
 * @param {WebdriverIO.Element} root      – shadow host (e.g. lgb-log-board)
 * @param {string}              name      – target value of `lightning-button.name`
 * @returns {Promise<WebdriverIO.Element|null>}
 */
async function findLightningButtonByName(root, name) {
    const buttons = await root.shadow$$('lightning-button');
    for (const btn of buttons) {
        try {
            const btnName = await btn.getProperty('name');
            if (btnName === name) return btn;
        } catch (_) { /* element disappeared mid-iteration; skip */ }
    }
    return null;
}

/**
 * Wait until a `lightning-button` with the given `name` property appears
 * inside `root`'s shadow root, then return it.
 *
 * @param {WebdriverIO.Element} root
 * @param {string}              name
 * @param {number}              [timeout=8000]
 * @returns {Promise<WebdriverIO.Element>}
 */
async function waitForLightningButtonByName(root, name, timeout = 8000) {
    let found = null;
    await browser.waitUntil(
        async () => {
            found = await findLightningButtonByName(root, name);
            return found !== null;
        },
        {
            timeout,
            timeoutMsg: `lightning-button with name="${name}" did not appear within ${timeout}ms`,
        }
    );
    return found;
}

/**
 * Generic "find an LWC base-component instance inside a shadow root by one of
 * its @api properties" helper. Use when you'd be tempted to write
 * `shadow$('some-lwc-element[someProp="x"]')` — LWC base components do not
 * reflect their @api props to HTML attributes, so that CSS selector never
 * matches. This iterates the matching tag hosts and reads the property.
 *
 * @param {WebdriverIO.Element} root      – shadow host to search inside
 * @param {string}              tagName   – e.g. 'lightning-menu-item'
 * @param {string}              propName  – e.g. 'value' or 'label'
 * @param {*}                   propValue – exact property value to match
 * @returns {Promise<WebdriverIO.Element|null>}
 */
/**
 * Try `root.shadow$$(tagName)` if `root` is a shadow host, otherwise fall back
 * to `root.$$(tagName)`. This lets the property-based helpers work both on
 * shadow hosts (lgb-log-board, lightning-combobox) and on plain DOM elements
 * inside an existing shadow root (a <tr> returned from tableHost.shadow$$).
 */
async function _queryAllInside(root, tagName) {
    let candidates;
    try {
        candidates = await root.shadow$$(tagName);
    } catch (_) {
        candidates = null;
    }
    // shadow$$ on a non-shadow-host can throw or return a non-iterable; check
    // for iterability before using it, otherwise fall through to the non-
    // shadow descendant query.
    const isIterable = candidates && typeof candidates[Symbol.iterator] === 'function';
    if (!isIterable || (Array.isArray(candidates) && candidates.length === 0)) {
        try {
            const fallback = await root.$$(tagName);
            const fallbackIterable = fallback && typeof fallback[Symbol.iterator] === 'function';
            if (fallbackIterable) return Array.from(fallback);
        } catch (_) { /* no luck */ }
    }
    return isIterable ? Array.from(candidates) : [];
}

async function findInShadowByProperty(root, tagName, propName, propValue) {
    const list = await _queryAllInside(root, tagName);
    for (const el of list) {
        try {
            const v = await el.getProperty(propName);
            if (v === propValue) return el;
        } catch (_) { /* element disappeared mid-iteration; skip */ }
    }
    return null;
}

/**
 * Return an array of every @api property value (read via getProperty) for
 * every matching shadow descendant. Useful for assertions like
 * `expect(labels).toContain('Deploy RSS and TSS')`.
 *
 * @param {WebdriverIO.Element} root
 * @param {string}              tagName
 * @param {string}              propName
 * @returns {Promise<any[]>}
 */
async function getShadowProperties(root, tagName, propName) {
    const list = await _queryAllInside(root, tagName);
    const values = [];
    for (const el of list) {
        try {
            values.push(await el.getProperty(propName));
        } catch (_) { /* skip */ }
    }
    return values;
}

/**
 * Wait until a shadow descendant with a given @api property value exists,
 * then return it. Pairs with findInShadowByProperty.
 *
 * @param {WebdriverIO.Element} root
 * @param {string}              tagName
 * @param {string}              propName
 * @param {*}                   propValue
 * @param {number}              [timeout=8000]
 * @returns {Promise<WebdriverIO.Element>}
 */
async function waitForInShadowByProperty(root, tagName, propName, propValue, timeout = 8000) {
    let found = null;
    await browser.waitUntil(
        async () => {
            found = await findInShadowByProperty(root, tagName, propName, propValue);
            return found !== null;
        },
        {
            timeout,
            timeoutMsg: `<${tagName}> with ${propName}="${propValue}" did not appear within ${timeout}ms`,
        }
    );
    return found;
}

module.exports = {
    waitForVisible,
    waitForHidden,
    waitForSpinnerGone,
    waitForText,
    deepShadow,
    findLightningButtonByName,
    waitForLightningButtonByName,
    findInShadowByProperty,
    waitForInShadowByProperty,
    getShadowProperties,
};
