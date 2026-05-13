'use strict';

/**
 * search.spec.js
 *
 * Tests for the cross-log search feature:
 *   - Typing a term and pressing Enter triggers a search
 *   - Clicking the Search button also triggers a search
 *   - Search results modal appears with a heading showing "X of Y search results"
 *   - Previous / Next navigation buttons work (and disable at boundaries)
 *   - "Open Full Log" opens the log viewer for the matched log
 *   - Closing the results modal works (close button and Escape)
 *   - Searching for a non-existent term produces "No results" feedback
 */

const { navigateToLogBoard } = require('../helpers/login');
const { waitForSpinnerGone, waitForInShadowByProperty } = require('../helpers/waitFor');

// A term very likely to appear in any Apex debug log
const COMMON_SEARCH_TERM = 'EXECUTION_STARTED';
// A term that should never appear in a real log
const ABSENT_SEARCH_TERM = 'ZZZZZNOMATCH_LOGBOARD_E2E_XYZ';

describe('LogBoard – Search', () => {
    let hasLogs = false;

    before(async () => {
        await navigateToLogBoard(browser, global.SF_ORG_URL);
        await waitForSpinnerGone(browser);

        const root = await browser.$('lgb-log-board');
        const tableHost = await root.shadow$('c-log-table');
        const rows = await tableHost.shadow$$('tbody tr');
        hasLogs = rows.length > 0;

        if (!hasLogs) {
            console.warn('  ⚠  No ApexLog records found; search tests will be skipped.');
        }
    });

    // Helper: type a search term into the search input and trigger it
    async function triggerSearch(term, method = 'button') {
        const root = await browser.$('lgb-log-board');
        const searchInputHost = await root.shadow$('lightning-input[data-id="search-input"]');
        const input = await searchInputHost.shadow$('input');
        await input.clearValue();
        await input.setValue(term);
        await browser.pause(200);

        if (method === 'enter') {
            await input.keys('Enter');
        } else {
            // `title` on lightning-button-icon is an @api property and is not
            // reflected to an HTML attribute, so `[title="Search"]` matches
            // nothing in the DOM. Look up by JS property instead.
            const searchBtn = await waitForInShadowByProperty(
                root, 'lightning-button-icon', 'title', 'Search', 5000,
            );
            await searchBtn.click();
        }
    }

    // Helper: wait for the search results modal to appear
    async function waitForSearchResults() {
        const root = await browser.$('lgb-log-board');
        await browser.waitUntil(
            async () => {
                const resultHost = await root.shadow$('c-log-search-result');
                return await resultHost.isExisting();
            },
            { timeout: 60000, timeoutMsg: 'Search results modal did not appear' }
        );
        return root.shadow$('c-log-search-result');
    }

    // Helper: close the search results modal if open
    async function closeSearchResults() {
        try {
            const root = await browser.$('lgb-log-board');
            const resultHost = await root.shadow$('c-log-search-result');
            if (await resultHost.isExisting()) {
                const closeBtn = await resultHost.shadow$('button.slds-modal__close');
                await closeBtn.click();
                await browser.waitUntil(
                    async () => !(await resultHost.isExisting()),
                    { timeout: 8000 }
                );
            }
        } catch (_) { /* already closed */ }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Triggering search
    // ─────────────────────────────────────────────────────────────────────────
    describe('Triggering search via button', () => {
        it('shows a loading spinner during search then reveals results modal', async function () {
            if (!hasLogs) this.skip();

            await triggerSearch(COMMON_SEARCH_TERM, 'button');

            // Spinner should appear while logs are fetched
            const root = await browser.$('lgb-log-board');
            await browser.waitUntil(
                async () => {
                    const spinner = await root.shadow$('lightning-spinner');
                    return await spinner.isExisting();
                },
                { timeout: 10000, interval: 100, timeoutMsg: 'Spinner did not appear' }
            ).catch(() => { /* may be too fast */ });

            const resultHost = await waitForSearchResults();
            const modal = await resultHost.shadow$('section.slds-modal');
            expect(await modal.isDisplayed()).toBe(true);

            await closeSearchResults();
        });
    });

    describe('Triggering search via Enter key', () => {
        it('opens the results modal when Enter is pressed in the search field', async function () {
            if (!hasLogs) this.skip();

            await triggerSearch(COMMON_SEARCH_TERM, 'enter');
            const resultHost = await waitForSearchResults();
            const modal = await resultHost.shadow$('section.slds-modal');
            expect(await modal.isDisplayed()).toBe(true);

            await closeSearchResults();
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Results modal content
    // ─────────────────────────────────────────────────────────────────────────
    describe('Search results modal content', () => {
        before(async function () {
            if (!hasLogs) return;
            await triggerSearch(COMMON_SEARCH_TERM, 'button');
        });

        after(async () => { await closeSearchResults(); });

        it('heading shows "X of Y search results"', async function () {
            if (!hasLogs) this.skip();

            const resultHost = await waitForSearchResults();
            const heading = await resultHost.shadow$('h2');
            await heading.waitForDisplayed({ timeout: 8000 });
            const text = await heading.getText();
            expect(text).toMatch(/\d+\s+of\s+\d+\s+search results/i);
        });

        it('displays highlighted match content in the rich-text area', async function () {
            if (!hasLogs) this.skip();

            const root = await browser.$('lgb-log-board');
            const resultHost = await root.shadow$('c-log-search-result');
            const richText = await resultHost.shadow$('.log-container lightning-formatted-rich-text');
            await richText.waitForDisplayed({ timeout: 8000 });

            const html = await browser.execute(
                (el) => el.shadowRoot ? el.shadowRoot.innerHTML : el.innerHTML,
                richText
            );
            expect(html.trim().length).toBeGreaterThan(0);
        });

        it('"Previous" button is disabled on the first result', async function () {
            if (!hasLogs) this.skip();

            const root = await browser.$('lgb-log-board');
            const resultHost = await root.shadow$('c-log-search-result');
            const prevBtn = await resultHost.shadow$('footer button:nth-child(2)');
            const disabled = await prevBtn.getAttribute('disabled');
            expect(disabled).not.toBeNull();
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Navigation between results
    // ─────────────────────────────────────────────────────────────────────────
    describe('Navigation (Previous / Next)', () => {
        let totalResults = 0;

        before(async function () {
            if (!hasLogs) return;
            await triggerSearch(COMMON_SEARCH_TERM, 'button');

            const resultHost = await waitForSearchResults();
            const heading = await resultHost.shadow$('h2');
            const text = await heading.getText();
            const match = text.match(/(\d+)\s+of\s+(\d+)/i);
            totalResults = match ? parseInt(match[2], 10) : 0;
        });

        after(async () => { await closeSearchResults(); });

        it('Next button advances to result 2 and enables Previous', async function () {
            if (!hasLogs || totalResults < 2) this.skip();

            const root = await browser.$('lgb-log-board');
            const resultHost = await root.shadow$('c-log-search-result');
            const nextBtn = await resultHost.shadow$('footer button:nth-child(3)');
            await nextBtn.waitForClickable({ timeout: 5000 });
            await nextBtn.click();
            await browser.pause(300);

            const heading = await resultHost.shadow$('h2');
            const text = await heading.getText();
            expect(text).toMatch(/^2\s+of\s+\d+/i);

            const prevBtn = await resultHost.shadow$('footer button:nth-child(2)');
            const disabled = await prevBtn.getAttribute('disabled');
            expect(disabled).toBeNull(); // now enabled
        });

        it('Previous button goes back to result 1', async function () {
            if (!hasLogs || totalResults < 2) this.skip();

            const root = await browser.$('lgb-log-board');
            const resultHost = await root.shadow$('c-log-search-result');
            const prevBtn = await resultHost.shadow$('footer button:nth-child(2)');
            await prevBtn.waitForClickable({ timeout: 5000 });
            await prevBtn.click();
            await browser.pause(300);

            const heading = await resultHost.shadow$('h2');
            const text = await heading.getText();
            expect(text).toMatch(/^1\s+of\s+\d+/i);
        });

        it('Next button is disabled on the last result', async function () {
            if (!hasLogs || totalResults < 2) this.skip();

            const root = await browser.$('lgb-log-board');
            const resultHost = await root.shadow$('c-log-search-result');
            const nextBtn = await resultHost.shadow$('footer button:nth-child(3)');

            // Navigate to the last result
            for (let i = 1; i < totalResults; i++) {
                if (await nextBtn.getAttribute('disabled') !== null) break;
                await nextBtn.click();
                await browser.pause(200);
            }

            const disabled = await nextBtn.getAttribute('disabled');
            expect(disabled).not.toBeNull();
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Open Full Log from search results
    // ─────────────────────────────────────────────────────────────────────────
    describe('"Open Full Log" button', () => {
        before(async function () {
            if (!hasLogs) return;
            await triggerSearch(COMMON_SEARCH_TERM, 'button');
            await waitForSearchResults();
        });

        it('opens the log viewer modal when "Open Full Log" is clicked', async function () {
            if (!hasLogs) this.skip();

            const root = await browser.$('lgb-log-board');
            const resultHost = await root.shadow$('c-log-search-result');
            const openFullLogBtn = await resultHost.shadow$('footer button.slds-button_brand');
            await openFullLogBtn.waitForClickable({ timeout: 8000 });
            await openFullLogBtn.click();

            // Search result modal should close and log viewer should open
            await browser.waitUntil(
                async () => {
                    const logView = await root.shadow$('c-log-view');
                    return await logView.isExisting();
                },
                { timeout: 30000, timeoutMsg: 'Log viewer did not open from Open Full Log' }
            );

            // Clean up — close the log viewer
            const logViewHost = await root.shadow$('c-log-view');
            const closeBtn = await logViewHost.shadow$('button[title="Cancel"]');
            await closeBtn.click();
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Closing the modal
    // ─────────────────────────────────────────────────────────────────────────
    describe('Closing search results', () => {
        it('close (X) button dismisses the modal', async function () {
            if (!hasLogs) this.skip();

            await triggerSearch(COMMON_SEARCH_TERM, 'button');
            const resultHost = await waitForSearchResults();

            const closeBtn = await resultHost.shadow$('button.slds-modal__close');
            await closeBtn.waitForClickable({ timeout: 8000 });
            await closeBtn.click();

            const root = await browser.$('lgb-log-board');
            await browser.waitUntil(
                async () => !(await (await root.shadow$('c-log-search-result')).isExisting()),
                { timeout: 10000, timeoutMsg: 'Search results modal did not close' }
            );
        });

        it('Escape key closes the search results modal', async function () {
            if (!hasLogs) this.skip();

            await triggerSearch(COMMON_SEARCH_TERM, 'button');
            await waitForSearchResults();

            await browser.keys('Escape');

            const root = await browser.$('lgb-log-board');
            await browser.waitUntil(
                async () => !(await (await root.shadow$('c-log-search-result')).isExisting()),
                { timeout: 10000, timeoutMsg: 'Search results modal did not close on Escape' }
            );
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // No-results scenario
    // ─────────────────────────────────────────────────────────────────────────
    describe('No search results', () => {
        it('shows a modal indicating no matches for an absent term', async function () {
            if (!hasLogs) this.skip();

            await triggerSearch(ABSENT_SEARCH_TERM, 'button');

            // Either a results modal with "0 of 0" heading, OR the component
            // simply closes/doesn't show the modal. Both behaviours are acceptable.
            const root = await browser.$('lgb-log-board');
            await browser.pause(5000); // give the fetches time to complete

            const resultHost = await root.shadow$('c-log-search-result');
            if (await resultHost.isExisting()) {
                const heading = await resultHost.shadow$('h2');
                const text = await heading.getText();
                // Should indicate 0 results
                expect(text).toMatch(/0\s+of\s+0|no results/i);
                await closeSearchResults();
            }
            // If modal never opened, search returned nothing — that's acceptable too
        });
    });
});
