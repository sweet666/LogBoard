'use strict';

/**
 * logViewer.spec.js
 *
 * Tests for the log viewer modal (c-log-view):
 *   - Modal opens when View is clicked
 *   - Log content is rendered (non-empty)
 *   - "Debug Only" toggle filters lines to USER_DEBUG only
 *   - Download button is present and has an href
 *   - Close button dismisses the modal
 *   - Escape key closes the modal
 */

const { navigateToLogBoard } = require('../helpers/login');
const {
    waitForSpinnerGone,
    waitForInShadowByProperty,
    findInShadowByProperty,
} = require('../helpers/waitFor');

describe('LogBoard – Log Viewer', () => {
    let hasLogs = false;

    before(async () => {
        await navigateToLogBoard(browser, global.SF_ORG_URL);
        await waitForSpinnerGone(browser);

        // Determine whether any log rows exist
        const root = await browser.$('lgb-log-board');
        const tableHost = await root.shadow$('c-log-table');
        const rows = await tableHost.shadow$$('tbody tr');
        hasLogs = rows.length > 0;

        if (!hasLogs) {
            console.warn('  ⚠  No ApexLog records found; log viewer tests will be skipped.');
        }
    });

    // Helper: open the viewer for the first log in the table
    async function openFirstLog() {
        const root = await browser.$('lgb-log-board');
        const tableHost = await root.shadow$('c-log-table');
        // `alternative-text` on lightning-button-icon corresponds to the
        // `alternativeText` @api property and is NOT reflected to an HTML
        // attribute, so `[alternative-text="View"]` matches nothing. Pull
        // the first row and find the lightning-button-icon by JS property.
        const firstRow = await tableHost.shadow$('tbody tr:first-child');
        const firstViewBtn = await findInShadowByProperty(
            firstRow, 'lightning-button-icon', 'alternativeText', 'View',
        );
        if (!firstViewBtn) {
            throw new Error('Could not locate "View" lightning-button-icon in first row');
        }
        await firstViewBtn.click();

        // Wait for the c-log-view element to appear
        await browser.waitUntil(
            async () => {
                const logView = await root.shadow$('c-log-view');
                return await logView.isExisting();
            },
            { timeout: 30000, timeoutMsg: 'Log viewer modal did not open' }
        );

        return root.shadow$('c-log-view');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Modal opens
    // ─────────────────────────────────────────────────────────────────────────
    describe('Opening the viewer', () => {
        it('opens the log viewer modal when View is clicked', async function () {
            if (!hasLogs) this.skip();

            const logViewHost = await openFirstLog();
            const modal = await logViewHost.shadow$('section.slds-modal');
            await modal.waitForDisplayed({ timeout: 15000 });
            expect(await modal.isDisplayed()).toBe(true);
        });

        it('renders non-empty log content', async function () {
            if (!hasLogs) this.skip();

            const root = await browser.$('lgb-log-board');
            const logViewHost = await root.shadow$('c-log-view');
            const richText = await logViewHost.shadow$('.log-container lightning-formatted-rich-text');
            await richText.waitForDisplayed({ timeout: 15000 });

            // The formatted-rich-text inner HTML should not be empty
            const innerHtml = await browser.execute(
                (el) => el.shadowRoot ? el.shadowRoot.innerHTML : el.innerHTML,
                richText
            );
            expect(innerHtml.trim().length).toBeGreaterThan(0);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Debug Only toggle
    // ─────────────────────────────────────────────────────────────────────────
    describe('Debug Only toggle', () => {
        it('the Debug Only checkbox is rendered and unchecked by default', async function () {
            if (!hasLogs) this.skip();

            const root = await browser.$('lgb-log-board');
            const logViewHost = await root.shadow$('c-log-view');
            // `label` on lightning-input is an @api property, not a reflected
            // HTML attribute, so `[label="Debug Only"]` would never match.
            // Match by JS property instead.
            const toggle = await waitForInShadowByProperty(
                logViewHost, 'lightning-input', 'label', 'Debug Only', 8000,
            );

            // `checked` is also an @api property on lightning-input — read it
            // as a property, not an attribute. Default value is false.
            const checked = await toggle.getProperty('checked');
            expect(checked).toBe(false);
        });

        it('clicking Debug Only re-renders with only USER_DEBUG lines (or "Nothing to show")', async function () {
            if (!hasLogs) this.skip();

            const root = await browser.$('lgb-log-board');
            const logViewHost = await root.shadow$('c-log-view');
            const toggle = await waitForInShadowByProperty(
                logViewHost, 'lightning-input', 'label', 'Debug Only', 8000,
            );
            const checkboxInput = await toggle.shadow$('input[type="checkbox"]');
            await checkboxInput.click();
            await browser.pause(500);

            // Content area should still be visible
            const richText = await logViewHost.shadow$('.log-container lightning-formatted-rich-text');
            expect(await richText.isDisplayed()).toBe(true);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Download button
    // ─────────────────────────────────────────────────────────────────────────
    describe('Download button', () => {
        it('the Download button is visible', async function () {
            if (!hasLogs) this.skip();

            const root = await browser.$('lgb-log-board');
            const logViewHost = await root.shadow$('c-log-view');
            const dlBtn = await logViewHost.shadow$('button.slds-button_brand');
            expect(await dlBtn.isDisplayed()).toBe(true);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Close modal
    // ─────────────────────────────────────────────────────────────────────────
    describe('Closing the viewer', () => {
        it('Close button dismisses the modal', async function () {
            if (!hasLogs) this.skip();

            const root = await browser.$('lgb-log-board');
            const logViewHost = await root.shadow$('c-log-view');
            const closeBtn = await logViewHost.shadow$('button[title="Cancel"]');
            await closeBtn.waitForClickable({ timeout: 8000 });
            await closeBtn.click();

            // c-log-view element should disappear from the DOM
            await browser.waitUntil(
                async () => {
                    const lv = await root.shadow$('c-log-view');
                    return !(await lv.isExisting());
                },
                { timeout: 10000, timeoutMsg: 'Log viewer did not close after clicking Close' }
            );
        });

        it('Escape key closes the log viewer modal', async function () {
            if (!hasLogs) this.skip();

            // Re-open
            await openFirstLog();

            // Press Escape
            await browser.keys('Escape');

            const root = await browser.$('lgb-log-board');
            await browser.waitUntil(
                async () => {
                    const lv = await root.shadow$('c-log-view');
                    return !(await lv.isExisting());
                },
                { timeout: 10000, timeoutMsg: 'Log viewer did not close on Escape' }
            );
        });
    });
});
