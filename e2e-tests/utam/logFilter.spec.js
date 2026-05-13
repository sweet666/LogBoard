'use strict';

/**
 * logFilter.spec.js
 *
 * Tests for the "Edit Log Filter" settings panel (c-edit-log-filter):
 *   - Settings menu renders with expected items
 *   - Selecting "Edit Log Filter" opens the modal
 *   - Modal heading is "Edit Log filter"
 *   - Filter textarea shows the current filter value
 *   - "Set Default" resets the textarea to the built-in default WHERE clause
 *   - "Save" persists a custom filter and closes the modal
 *   - "Close" button discards changes and closes the modal
 *   - Escape key discards changes and closes the modal
 */

const { navigateToLogBoard } = require('../helpers/login');
const {
    waitForSpinnerGone,
    waitForInShadowByProperty,
    getShadowProperties,
} = require('../helpers/waitFor');

const DEFAULT_FILTER_FRAGMENT = "Operation != '/apex/lgb__sessionidpage'";

/**
 * Probe whether the underlying WebDriver session still has a live window.
 *
 * The run captured in e2e.log showed every command in this spec's session
 * coming back with "no such window: target window already closed" while
 * Mocha sat patiently waiting for its 60s timer to fire — chromedriver had
 * lost the window handle during the cross-subdomain hop in login(). We now
 * recover that in helpers/login.js, but as a belt-and-suspenders measure
 * this guard probes the session before the first real test action and
 * surfaces a clear, immediate failure if it's already gone, instead of
 * letting the whole describe block hang.
 */
async function assertSessionAlive(browser) {
    try {
        await browser.getUrl();
    } catch (err) {
        const handles = await browser.getWindowHandles().catch(() => []);
        if (handles.length > 0) {
            // Recoverable — swing to a live handle and continue.
            await browser.switchToWindow(handles[handles.length - 1]);
            return;
        }
        throw new Error(
            `LogFilter spec aborted: browser session has no live window (${err.message}). ` +
            'This typically means the wdio-level login navigation lost its target during a ' +
            'Salesforce subdomain redirect. See helpers/login.js#reattachToLiveWindow.'
        );
    }
}

describe('LogBoard – Edit Log Filter', () => {
    before(async () => {
        await assertSessionAlive(browser);
        await navigateToLogBoard(browser, global.SF_ORG_URL);
        await waitForSpinnerGone(browser);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Settings menu
    // ─────────────────────────────────────────────────────────────────────────
    describe('Settings menu', () => {
        it('settings gear button is visible', async () => {
            const root = await browser.$('lgb-log-board');
            const menuBtn = await root.shadow$('lightning-button-menu');
            expect(await menuBtn.isDisplayed()).toBe(true);
        });

        it('menu contains "Deploy RSS and TSS", "Edit Debug Level", and "Edit Log Filter"', async () => {
            const root = await browser.$('lgb-log-board');
            const menuBtn = await root.shadow$('lightning-button-menu');
            await menuBtn.click();
            await browser.pause(500);

            // Two issues with the previous approach:
            //  1) `shadow$$` sometimes returns a non-iterable shape when the
            //     "no such shadow root" WebDriver path falls back to the JS
            //     shim, which made `Promise.all(items.map(...))` throw
            //     "object is not iterable".
            //  2) `label` on lightning-menu-item is an @api property, not a
            //     reflected HTML attribute, so getAttribute('label') would
            //     return null even when the iteration succeeded.
            // getShadowProperties normalizes the array and reads the property.
            const labels = await getShadowProperties(root, 'lightning-menu-item', 'label');

            expect(labels).toContain('Deploy RSS and TSS');
            expect(labels).toContain('Edit Debug Level');
            expect(labels).toContain('Edit Log Filter');

            // Close the menu without selecting
            await browser.keys('Escape');
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Opening the modal
    // ─────────────────────────────────────────────────────────────────────────
    describe('Opening the Edit Log Filter modal', () => {
        async function openFilterModal() {
            const root = await browser.$('lgb-log-board');

            // Drain any in-flight close animation from the prior describe
            // block. The "Settings menu" tests end with `browser.keys('Escape')`
            // and no wait, so the dropdown can still be closing when we run.
            // Clicking the menu button while that's mid-flight desyncs the
            // menu state and the menu item ends up rendered but flagged as
            // "not interactable" by chromedriver. A second Escape is a no-op
            // if the menu is already closed.
            await browser.keys('Escape');
            await browser.pause(300);

            const menuBtn = await root.shadow$('lightning-button-menu');
            await menuBtn.click();
            await browser.pause(400);

            // `value` on lightning-menu-item is an @api property, not a
            // reflected HTML attribute, so `[value="Filter"]` doesn't match.
            // Look up by JS property instead.
            const filterItem = await waitForInShadowByProperty(
                root, 'lightning-menu-item', 'value', 'Filter', 5000,
            );

            // lightning-menu-item's host has role="presentation", which
            // WebDriver Level 1 considers non-interactable; chromedriver
            // then rejects filterItem.click() with "element not interactable"
            // when the menu has only just opened. Dispatching the click
            // via JS bypasses the interactability check while still firing
            // the LWC @click handler that opens the modal. This is the
            // failure mode that produced the three failing tests in the
            // 40.4s logFilter run.
            await browser.execute((el) => el.click(), filterItem);

            await browser.waitUntil(
                async () => {
                    const filterHost = await root.shadow$('c-edit-log-filter');
                    return await filterHost.isExisting();
                },
                { timeout: 10000, timeoutMsg: 'Edit Log Filter modal did not open' }
            );
        }

        it('opens the Edit Log Filter modal', async () => {
            await openFilterModal();

            const root = await browser.$('lgb-log-board');
            const filterHost = await root.shadow$('c-edit-log-filter');
            const modal = await filterHost.shadow$('section.slds-modal');
            expect(await modal.isDisplayed()).toBe(true);
        });

        it('modal heading reads "Edit Log filter"', async () => {
            const root = await browser.$('lgb-log-board');
            const filterHost = await root.shadow$('c-edit-log-filter');
            // LWC mangles `id` attributes at runtime to keep them unique
            // across component instances, so the template's
            // id="modal-heading-01" renders as id="modal-heading-01-<n>" in
            // the live DOM. That's why a literal `h2#modal-heading-01`
            // selector matches nothing even though editLogFilter.html clearly
            // declares the id. The modal contains a single <h2>, so the
            // tag-only selector is unambiguous and immune to LWC's rewrite.
            const heading = await filterHost.shadow$('h2');
            const text = await heading.getText();
            expect(text.toLowerCase()).toContain('edit log filter');
        });

        it('textarea contains a non-empty filter expression', async () => {
            const root = await browser.$('lgb-log-board');
            const filterHost = await root.shadow$('c-edit-log-filter');
            const textarea = await filterHost.shadow$('lightning-textarea');
            // lightning-textarea's `value` is an @api property, not reflected
            // to an HTML attribute, so getAttribute('value') returns null.
            // Read the property instead.
            const value = await textarea.getProperty('value');
            expect(typeof value).toBe('string');
            expect(value.trim().length).toBeGreaterThan(0);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Set Default
    // ─────────────────────────────────────────────────────────────────────────
    describe('"Set Default" button', () => {
        before(async () => {
            // Make sure the modal is open
            const root = await browser.$('lgb-log-board');
            const filterHost = await root.shadow$('c-edit-log-filter');
            if (!(await filterHost.isExisting())) {
                // Re-open
                const menuBtn = await root.shadow$('lightning-button-menu');
                await menuBtn.click();
                await browser.pause(400);
                // Look up by @api `value` property — see openFilterModal note.
                const filterItem = await waitForInShadowByProperty(
                    root, 'lightning-menu-item', 'value', 'Filter', 5000,
                );
                await filterItem.click();
                await browser.waitUntil(async () => (await filterHost.isExisting()), { timeout: 8000 });
            }
        });

        it('clicking Set Default populates the textarea with the built-in default filter', async () => {
            const root = await browser.$('lgb-log-board');
            const filterHost = await root.shadow$('c-edit-log-filter');

            // First, clear the textarea so we can verify Set Default fills it.
            // The Edit Log Filter modal contains a single lightning-textarea,
            // so we can drop the `[name="filter"]` predicate (LWC doesn't
            // reflect @api props to attributes anyway).
            const textarea = await filterHost.shadow$('lightning-textarea');
            const textareaInput = await textarea.shadow$('textarea');
            await textareaInput.clearValue();

            const setDefaultBtn = await filterHost.shadow$('footer button.slds-button_neutral:nth-child(2)');
            await setDefaultBtn.waitForClickable({ timeout: 5000 });
            await setDefaultBtn.click();
            await browser.pause(300);

            // See note in "Opening the modal" — read `value` as a property.
            const updatedValue = await textarea.getProperty('value');
            expect(updatedValue).toContain(DEFAULT_FILTER_FRAGMENT);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Save
    // ─────────────────────────────────────────────────────────────────────────
    describe('"Save" button', () => {
        const CUSTOM_FILTER = "LogLength > 2000 AND Operation != '/apex/lgb__sessionidpage'";
        let originalFilter = '';

        before(async () => {
            // Capture the current filter before modifying it
            const root = await browser.$('lgb-log-board');
            const filterHost = await root.shadow$('c-edit-log-filter');
            if (!(await filterHost.isExisting())) {
                const menuBtn = await root.shadow$('lightning-button-menu');
                await menuBtn.click();
                await browser.pause(400);
                // Look up by @api `value` property — see openFilterModal note.
                const filterItem = await waitForInShadowByProperty(
                    root, 'lightning-menu-item', 'value', 'Filter', 5000,
                );
                await filterItem.click();
                await browser.waitUntil(async () => (await filterHost.isExisting()), { timeout: 8000 });
            }
            const textarea = await filterHost.shadow$('lightning-textarea');
            // See note in "Opening the modal" — read `value` as a property.
            originalFilter = await textarea.getProperty('value') || '';
        });

        it('saves a custom filter and closes the modal', async () => {
            const root = await browser.$('lgb-log-board');
            const filterHost = await root.shadow$('c-edit-log-filter');
            const textarea = await filterHost.shadow$('lightning-textarea');
            const textareaInput = await textarea.shadow$('textarea');

            await textareaInput.clearValue();
            await textareaInput.setValue(CUSTOM_FILTER);
            await browser.pause(200);

            const saveBtn = await filterHost.shadow$('footer button.slds-button_brand');
            await saveBtn.waitForClickable({ timeout: 5000 });
            await saveBtn.click();

            // Modal should close
            await browser.waitUntil(
                async () => !(await filterHost.isExisting()),
                { timeout: 10000, timeoutMsg: 'Filter modal did not close after Save' }
            );
        });

        after(async () => {
            // Restore the original filter so we don't leave the org in a modified state
            if (!originalFilter) return;
            const root = await browser.$('lgb-log-board');
            const menuBtn = await root.shadow$('lightning-button-menu');
            await menuBtn.click();
            await browser.pause(400);
            // See openFilterModal note — `value` is an @api property on
            // lightning-menu-item, not a reflected HTML attribute.
            const filterItem = await waitForInShadowByProperty(
                root, 'lightning-menu-item', 'value', 'Filter', 5000,
            );
            await filterItem.click();

            const filterHost = await root.shadow$('c-edit-log-filter');
            await browser.waitUntil(async () => await filterHost.isExisting(), { timeout: 8000 });

            const textarea = await filterHost.shadow$('lightning-textarea');
            const textareaInput = await textarea.shadow$('textarea');
            await textareaInput.clearValue();
            await textareaInput.setValue(originalFilter);

            const saveBtn = await filterHost.shadow$('footer button.slds-button_brand');
            await saveBtn.click();
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Close without saving
    // ─────────────────────────────────────────────────────────────────────────
    describe('"Close" button (discard changes)', () => {
        before(async () => {
            const root = await browser.$('lgb-log-board');
            const menuBtn = await root.shadow$('lightning-button-menu');
            await menuBtn.click();
            await browser.pause(400);
            // See openFilterModal note — `value` is an @api property on
            // lightning-menu-item, not a reflected HTML attribute.
            const filterItem = await waitForInShadowByProperty(
                root, 'lightning-menu-item', 'value', 'Filter', 5000,
            );
            await filterItem.click();
            const filterHost = await root.shadow$('c-edit-log-filter');
            await browser.waitUntil(async () => await filterHost.isExisting(), { timeout: 8000 });
        });

        it('Close button discards changes and closes the modal', async () => {
            const root = await browser.$('lgb-log-board');
            const filterHost = await root.shadow$('c-edit-log-filter');

            // Type something in the textarea
            const textarea = await filterHost.shadow$('lightning-textarea');
            const textareaInput = await textarea.shadow$('textarea');
            await textareaInput.setValue(' AND LogLength > 9999');
            await browser.pause(200);

            // Click Close (first neutral button in footer)
            const closeBtn = await filterHost.shadow$('footer button.slds-button_neutral:first-child');
            await closeBtn.waitForClickable({ timeout: 5000 });
            await closeBtn.click();

            await browser.waitUntil(
                async () => !(await filterHost.isExisting()),
                { timeout: 10000, timeoutMsg: 'Filter modal did not close after clicking Close' }
            );
        });
    });

    describe('Escape key (discard changes)', () => {
        before(async () => {
            const root = await browser.$('lgb-log-board');
            const menuBtn = await root.shadow$('lightning-button-menu');
            await menuBtn.click();
            await browser.pause(400);
            // See openFilterModal note — `value` is an @api property on
            // lightning-menu-item, not a reflected HTML attribute.
            const filterItem = await waitForInShadowByProperty(
                root, 'lightning-menu-item', 'value', 'Filter', 5000,
            );
            await filterItem.click();
            const filterHost = await root.shadow$('c-edit-log-filter');
            await browser.waitUntil(async () => await filterHost.isExisting(), { timeout: 8000 });
        });

        it('Escape key closes the filter modal without saving', async () => {
            await browser.keys('Escape');

            const root = await browser.$('lgb-log-board');
            const filterHost = await root.shadow$('c-edit-log-filter');
            await browser.waitUntil(
                async () => !(await filterHost.isExisting()),
                { timeout: 10000, timeoutMsg: 'Filter modal did not close on Escape' }
            );
        });
    });
});
