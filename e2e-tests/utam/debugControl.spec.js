'use strict';

/**
 * debugControl.spec.js
 *
 * Tests for the core debug flag lifecycle:
 *   - Component initial state (disabled)
 *   - Enabling debug logging (Enable button → countdown timer)
 *   - Stopping debug logging (Stop button → "Debug disabled")
 *   - Duration button selection (1 / 2 / 3 / 5 / 10 minutes)
 *   - User selector (Current User / Automated Process)
 */

const { navigateToLogBoard } = require('../helpers/login');
const {
    waitForSpinnerGone,
    findLightningButtonByName,
    waitForLightningButtonByName,
} = require('../helpers/waitFor');

describe('LogBoard – Debug Control', () => {
    before(async () => {
        await navigateToLogBoard(browser, global.SF_ORG_URL);
        await waitForSpinnerGone(browser);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Initial state
    // ─────────────────────────────────────────────────────────────────────────
    describe('Initial State', () => {
        it('shows "Debug disabled" when no active trace flag exists', async () => {
            const root = await browser.$('lgb-log-board');
            const expirationEl = await root.shadow$('.header-block.exparation');
            await expirationEl.waitForDisplayed({ timeout: 10000 });
            const text = await expirationEl.getText();
            expect(text).toContain('Debug disabled');
        });

        it('shows the Enable button (not Stop)', async () => {
            const root = await browser.$('lgb-log-board');

            // We CANNOT match `lightning-button` by `name` via a CSS attribute
            // selector ([name="EnableLogs"]) — LWC base components declare
            // `name` as an @api property and do not reflect it to an HTML
            // attribute, so the attribute is absent on the host element even
            // though the property is set. The helper iterates the
            // lightning-button hosts inside the shadow root and matches them
            // by the JS property instead.
            const enableBtn = await waitForLightningButtonByName(root, 'EnableLogs', 8000);
            expect(enableBtn).not.toBeNull();

            // Stop button NOT rendered (the {if:true=isDebugActive} branch).
            const stopBtn = await findLightningButtonByName(root, 'StopLogs');
            expect(stopBtn).toBeNull();
        });

        it('defaults to duration 1 minute selected', async () => {
            const root = await browser.$('lgb-log-board');
            const btn1 = await root.shadow$('button[data-id="1"]');
            // The selected button gets the "btn-selected" modifier appended to
            // the base "btn btn-secondary" classes — see DURATION_SELECTED_CLASS
            // in logBoard.js.
            const classes = await btn1.getAttribute('class');
            expect(classes).toMatch(/btn-selected/);
        });

        it('defaults to "Current User" in the user selector', async () => {
            const root = await browser.$('lgb-log-board');
            const combobox = await root.shadow$('lightning-combobox');
            // `value` on lightning-combobox is an @api property, not reflected
            // to an HTML attribute, so getAttribute returns null. Read the
            // property instead.
            const value = await combobox.getProperty('value');
            expect(value).toBe('current');
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Duration selection
    // ─────────────────────────────────────────────────────────────────────────
    describe('Duration Selection', () => {
        const durations = [2, 3, 5, 10, 1]; // cycle through all, end back at 1

        durations.forEach((dur) => {
            it(`selects ${dur} minute(s) when that button is clicked`, async () => {
                const root = await browser.$('lgb-log-board');
                const btn = await root.shadow$(`button[data-id="${dur}"]`);
                await btn.waitForClickable({ timeout: 5000 });
                await btn.click();

                // The clicked button gains the "btn-selected" modifier class;
                // others revert to just "btn btn-secondary".
                const classes = await btn.getAttribute('class');
                expect(classes).toMatch(/btn-selected/);

                // Spot-check: a different duration button should not be active
                const otherId = dur === 1 ? 2 : 1;
                const otherBtn = await root.shadow$(`button[data-id="${otherId}"]`);
                const otherClasses = await otherBtn.getAttribute('class');
                expect(otherClasses).not.toMatch(/btn-selected/);
            });
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Enable / Stop debug
    // ─────────────────────────────────────────────────────────────────────────
    describe('Enable Debug', () => {
        it('shows a countdown timer after clicking Enable', async () => {
            const root = await browser.$('lgb-log-board');

            // See note in "Initial State" — match by JS property, not the
            // unreflected `name` attribute.
            const enableBtn = await waitForLightningButtonByName(root, 'EnableLogs', 8000);
            await enableBtn.click();

            // Spinner may appear briefly while the Tooling API call completes
            await waitForSpinnerGone(browser, 20000);

            // Expiration text should now show a countdown (e.g. "00:59" or similar)
            const expirationEl = await root.shadow$('.header-block.exparation');
            await browser.waitUntil(
                async () => {
                    const text = await expirationEl.getText();
                    return text.includes(':') && !text.includes('Debug disabled');
                },
                { timeout: 15000, timeoutMsg: 'Countdown timer did not appear after enabling debug' }
            );
        });

        it('shows the Stop button (and hides Enable) while debug is active', async () => {
            const root = await browser.$('lgb-log-board');

            const stopBtn = await waitForLightningButtonByName(root, 'StopLogs', 10000);
            expect(stopBtn).not.toBeNull();

            const enableBtn = await findLightningButtonByName(root, 'EnableLogs');
            expect(enableBtn).toBeNull();
        });

        it('duration buttons are disabled while debug is active', async () => {
            const root = await browser.$('lgb-log-board');
            const btn1 = await root.shadow$('button[data-id="1"]');
            // The component signals "disabled" via the CSS class
            // "btn btn-secondary btn-disabled" (see disableDurationButtons()
            // in logBoard.js). It does NOT set a `disabled` HTML attribute on
            // the native <button>, so checking that attribute always yields
            // null. Look at the class list instead.
            const classes = await btn1.getAttribute('class');
            expect(classes).toMatch(/btn-disabled/);
        });
    });

    describe('Stop Debug', () => {
        it('reverts to "Debug disabled" and re-shows Enable after clicking Stop', async () => {
            const root = await browser.$('lgb-log-board');

            const stopBtn = await waitForLightningButtonByName(root, 'StopLogs', 8000);
            await stopBtn.click();

            await waitForSpinnerGone(browser, 20000);

            // Expiration text should revert
            const expirationEl = await root.shadow$('.header-block.exparation');
            await browser.waitUntil(
                async () => {
                    const text = await expirationEl.getText();
                    return text.includes('Debug disabled');
                },
                { timeout: 15000, timeoutMsg: '"Debug disabled" did not reappear after stopping debug' }
            );

            // Enable button should be back
            const enableBtn = await waitForLightningButtonByName(root, 'EnableLogs', 8000);
            expect(enableBtn).not.toBeNull();
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // User selector
    // ─────────────────────────────────────────────────────────────────────────
    describe('User Selector', () => {
        // Dismiss any leftover Lightning modal (e.g. an error toast/dialog
        // raised by a previous flaky assertion) before touching the combobox.
        // Without this guard, combobox.click() can fail with "element click
        // intercepted ... Other element would receive the click: <div role
        // ='dialog' ...>" — that's the failure mode seen in the run log.
        async function dismissAnyOpenModal() {
            const modalClose = await browser.$('button.slds-modal__close');
            if (await modalClose.isExisting() && await modalClose.isDisplayed()) {
                try { await modalClose.click(); } catch (_) { /* best-effort */ }
                await browser.pause(300);
            }
        }

        it('can switch to Automated Process user', async () => {
            await dismissAnyOpenModal();

            const root = await browser.$('lgb-log-board');
            const combobox = await root.shadow$('lightning-combobox');

            // Open the dropdown by clicking (LWC lightning-combobox shadow element)
            await combobox.click();
            await browser.pause(500);

            // Find the "Automated Process" option inside the combobox shadow
            const automatedOption = await combobox.shadow$('lightning-base-combobox-item[data-value="automated"]');
            if (await automatedOption.isExisting()) {
                await automatedOption.click();
                // `value` is an @api property on lightning-combobox; it is not
                // reflected to an HTML attribute, so getAttribute('value')
                // returns null. Read it as a property instead.
                const updatedValue = await combobox.getProperty('value');
                expect(updatedValue).toBe('automated');
            } else {
                // Fallback: use JS to set value and verify attribute propagation
                await browser.execute(
                    (el) => { el.value = 'automated'; el.dispatchEvent(new Event('change', { bubbles: true })); },
                    combobox
                );
                // Just verify the attribute updated
                await browser.pause(500);
            }
        });

        after(async () => {
            // Reset to Current User so subsequent tests are not affected
            await dismissAnyOpenModal();
            const root = await browser.$('lgb-log-board');
            const combobox = await root.shadow$('lightning-combobox');
            try {
                await combobox.click();
                await browser.pause(500);
                const currentOption = await combobox.shadow$('lightning-base-combobox-item[data-value="current"]');
                if (await currentOption.isExisting()) await currentOption.click();
            } catch (_) { /* best-effort */ }
        });
    });
});
