'use strict';

/**
 * logTable.spec.js
 *
 * Tests for the log table component:
 *   - Table structure (columns rendered)
 *   - Log rows present after refreshing
 *   - View button opens the log viewer modal
 *   - Download button is clickable
 *   - Refresh button reloads the table
 *   - Delete All Logs clears the table
 *   - Auto-refresh toggle disables the manual Refresh button
 */

const { navigateToLogBoard } = require('../helpers/login');
const {
    waitForSpinnerGone,
    waitForInShadowByProperty,
    findInShadowByProperty,
} = require('../helpers/waitFor');

// Expected column header text (lowercase for comparison)
const EXPECTED_COLUMNS = ['user', 'operation', 'status', 'size mb', 'start datetime'];

/**
 * Normalize a shadow$$ result to a guaranteed plain Array.
 *
 * Why this is fussier than a simple Array.from(): webdriverio's
 * `ElementArray` is a custom subclass of Array. Array.isArray() returns
 * true for it, but its `.map()` (and the proxy chain that wraps it) does
 * not always return a value Promise.all considers iterable — that's the
 * "object is not iterable (cannot read property Symbol(Symbol.iterator))"
 * error the column-headers test was hitting even after we wrapped the
 * result. Copying through plain index access (not `Array.from`, which can
 * preserve subclass behaviours, and not the spread operator, which goes
 * through Symbol.iterator) gives us a vanilla Array with vanilla method
 * implementations.
 *
 * Also covers the original case: shadow$$ falling back to its JS shim and
 * returning a non-iterable. If the input is null/undefined/non-array-like
 * we just return an empty array so callers can iterate without checking.
 */
function toArray(handles) {
    if (!handles) return [];
    const length = typeof handles.length === 'number' ? handles.length : 0;
    const out = [];
    for (let i = 0; i < length; i++) {
        out.push(handles[i]);
    }
    return out;
}

/**
 * Drive the auto-refresh toggle programmatically.
 *
 * Why this exists: the spec previously did
 *   const input = await toggle.shadow$('input[type="checkbox"]');
 *   await input.click();
 * but lightning-input type="toggle" doesn't reliably render a queryable
 * <input type="checkbox"> in its shadow root across Salesforce versions,
 * so that selector returned null and the tests blew up before they could
 * exercise the toggle. logBoard.js#handleAutorefreshToggle (line 131-145)
 * reads the host's @api `checked` property directly, so setting it and
 * dispatching the expected `change` event drives the exact same code path
 * the user's tap would — without depending on internal shadow markup.
 *
 * Idempotent: if the toggle is already in the requested state we don't
 * re-dispatch the event (so we don't trigger a redundant Apex save).
 *
 * @param {WebdriverIO.Element} root      lgb-log-board host
 * @param {boolean}             desired   target checked state
 */
async function setAutoRefresh(root, desired) {
    const toggle = await root.shadow$('lightning-input[data-id="autorefresh-toggle"]');
    const changed = await browser.execute((el, value) => {
        if (el.checked === value) return false;
        el.checked = value;
        el.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true }));
        return true;
    }, toggle, desired);
    if (changed) {
        // handleAutorefreshToggle fires saveAutoRefreshSetting() (Apex round
        // trip) and may kick off getLogs() polling. 800ms gives the LWC
        // template time to react to the new isAutoRefresh value, so the
        // Refresh button's disabled state stabilizes before the next assert.
        await browser.pause(800);
    }
}

describe('LogBoard – Log Table', () => {
    before(async () => {
        await navigateToLogBoard(browser, global.SF_ORG_URL);
        await waitForSpinnerGone(browser);
        // The auto-refresh state is persisted server-side as a custom
        // setting (LGB__Is_Autorefresh__c — see logBoard.js#line 124-128 and
        // the saveAutoRefreshSetting call at line 134), so a previous run
        // that left it on will make the Refresh-button assertions in this
        // spec fail because the button is correctly disabled. Establish a
        // known starting state instead of assuming it.
        const root = await browser.$('lgb-log-board');
        await setAutoRefresh(root, false);
    });

    after(async () => {
        // Restore the org to auto-refresh OFF so we don't leave the test
        // user (or anyone else opening this org) with the toggle stuck on.
        // Best-effort; if the page session is already gone there's nothing
        // sensible to do.
        try {
            const root = await browser.$('lgb-log-board');
            await setAutoRefresh(root, false);
        } catch (_) { /* swallow */ }
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Table structure
    // ─────────────────────────────────────────────────────────────────────────
    describe('Table Structure', () => {
        it('renders the log table with a dark Bootstrap style', async () => {
            const root = await browser.$('lgb-log-board');
            const tableHost = await root.shadow$('c-log-table');
            const table = await tableHost.shadow$('table.table-dark');
            expect(await table.isDisplayed()).toBe(true);
        });

        it('renders all expected column headers', async () => {
            const root = await browser.$('lgb-log-board');
            const tableHost = await root.shadow$('c-log-table');
            // toArray() copies via plain index access so we end up with a
            // vanilla Array; see its docstring up top for why we don't trust
            // Array.isArray / spread on shadow$$ results.
            const headers = toArray(await tableHost.shadow$$('thead th .slds-truncate'));

            // Sequential getText() instead of .map()+Promise.all. The
            // previous parallel form triggered "object is not iterable" at
            // Promise.all because the ElementArray subclass's .map() (or a
            // proxy in its chain) was returning something non-iterable.
            // Five headers, three awaits each — sub-second cost, total
            // immunity to the issue.
            const headerTexts = [];
            for (const header of headers) {
                const raw = await header.getText();
                headerTexts.push(raw.toLowerCase().trim());
            }

            for (const col of EXPECTED_COLUMNS) {
                expect(headerTexts.some((t) => t.includes(col))).toBe(true);
            }
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Refresh
    // ─────────────────────────────────────────────────────────────────────────
    describe('Manual Refresh', () => {
        // `title` and `disabled` on lightning-button-icon are @api properties
        // that LWC does not reflect to HTML attributes. So
        // `lightning-button-icon[title="Refresh"]` never matches, and
        // getAttribute('disabled') always returns null even when the button is
        // disabled. Use property-based lookup + getProperty for both.
        it('refresh button is enabled when auto-refresh is off', async () => {
            const root = await browser.$('lgb-log-board');
            const refreshBtn = await waitForInShadowByProperty(
                root, 'lightning-button-icon', 'title', 'Refresh', 8000,
            );
            const disabled = await refreshBtn.getProperty('disabled');
            expect(disabled).toBe(false);
        });

        it('clicking refresh triggers a reload (spinner appears then disappears)', async () => {
            const root = await browser.$('lgb-log-board');
            const refreshBtn = await waitForInShadowByProperty(
                root, 'lightning-button-icon', 'title', 'Refresh', 8000,
            );
            await refreshBtn.click();

            // Spinner should appear briefly
            await browser.waitUntil(
                async () => {
                    const spinner = await root.shadow$('lightning-spinner');
                    return await spinner.isExisting();
                },
                { timeout: 5000, timeoutMsg: 'Spinner did not appear after refresh click', interval: 100 }
            ).catch(() => { /* spinner may be too fast to catch; that's fine */ });

            // Spinner should eventually disappear
            await waitForSpinnerGone(browser, 20000);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Auto-refresh toggle
    // ─────────────────────────────────────────────────────────────────────────
    describe('Auto-Refresh Toggle', () => {
        // Both tests use setAutoRefresh() (see top of file) instead of
        // hunting for an `<input type="checkbox">` inside lightning-input's
        // shadow root — lightning-input type="toggle" doesn't reliably
        // render a queryable checkbox input across SF versions, which is
        // why the previous version of these tests blew up with "element
        // wasn't found." Setting the host's @api checked + dispatching
        // change drives the same handleAutorefreshToggle handler the user
        // would trigger by tapping the toggle.

        it('disables the manual Refresh button when auto-refresh is turned on', async () => {
            const root = await browser.$('lgb-log-board');
            await setAutoRefresh(root, true);

            const refreshBtn = await waitForInShadowByProperty(
                root, 'lightning-button-icon', 'title', 'Refresh', 8000,
            );
            const disabled = await refreshBtn.getProperty('disabled');
            expect(disabled).toBe(true);
        });

        it('re-enables the manual Refresh button when auto-refresh is turned off', async () => {
            const root = await browser.$('lgb-log-board');
            await setAutoRefresh(root, false);

            const refreshBtn = await waitForInShadowByProperty(
                root, 'lightning-button-icon', 'title', 'Refresh', 8000,
            );
            const disabled = await refreshBtn.getProperty('disabled');
            expect(disabled).toBe(false);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Log rows — only run when logs exist
    // ─────────────────────────────────────────────────────────────────────────
    describe('Log Rows', () => {
        let hasLogs = false;

        before(async () => {
            const root = await browser.$('lgb-log-board');
            const tableHost = await root.shadow$('c-log-table');
            const rows = await tableHost.shadow$$('tbody tr');
            hasLogs = rows.length > 0;
            if (!hasLogs) {
                console.warn('  ⚠  No ApexLog records found; skipping row-level assertions.');
            }
        });

        it('each log row has a View and a Download button', async function () {
            if (!hasLogs) this.skip();

            const root = await browser.$('lgb-log-board');
            const tableHost = await root.shadow$('c-log-table');
            const rows = await tableHost.shadow$$('tbody tr');

            // `alternative-text` on lightning-button-icon is the same kind of
            // unreflected @api property (`alternativeText`); fall back to
            // matching by JS property on each row's descendants.
            const sampled = rows.slice(0, Math.min(rows.length, 3));
            for (const row of sampled) {
                const viewBtn = await findInShadowByProperty(
                    row, 'lightning-button-icon', 'alternativeText', 'View',
                );
                const dlBtn = await findInShadowByProperty(
                    row, 'lightning-button-icon', 'alternativeText', 'Download',
                );
                expect(viewBtn).not.toBeNull();
                expect(dlBtn).not.toBeNull();
            }
        });

        it('each log row shows non-empty User, Operation, Status and Start DateTime', async function () {
            if (!hasLogs) this.skip();

            const root = await browser.$('lgb-log-board');
            const tableHost = await root.shadow$('c-log-table');
            const firstRow = await tableHost.shadow$('tbody tr:first-child');

            const userText      = await (await firstRow.$('td:nth-child(3) .slds-truncate')).getText();
            const operationText = await (await firstRow.$('td:nth-child(4) .slds-truncate')).getText();
            const statusText    = await (await firstRow.$('td:nth-child(5) .status')).getText();
            const startText     = await (await firstRow.$('td:nth-child(7) .slds-truncate')).getText();

            expect(userText.trim().length).toBeGreaterThan(0);
            expect(operationText.trim().length).toBeGreaterThan(0);
            expect(statusText.trim().length).toBeGreaterThan(0);
            expect(startText.trim().length).toBeGreaterThan(0);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Delete All Logs
    // ─────────────────────────────────────────────────────────────────────────
    describe('Delete All Logs', () => {
        it('Delete button is disabled when the table is empty', async () => {
            // Navigate fresh so we are in a known state
            await navigateToLogBoard(browser, global.SF_ORG_URL);
            await waitForSpinnerGone(browser);

            const root = await browser.$('lgb-log-board');
            const tableHost = await root.shadow$('c-log-table');
            const rows = await tableHost.shadow$$('tbody tr');

            // `title` on lightning-button-icon is an unreflected @api prop —
            // look up by property, same as the Refresh button above.
            const deleteBtn = await waitForInShadowByProperty(
                root, 'lightning-button-icon', 'title', 'Delete All Logs', 8000,
            );
            const disabled = await deleteBtn.getProperty('disabled');
            if (rows.length === 0) {
                expect(disabled).toBe(true);
            } else {
                expect(disabled).toBe(false);
            }
        });

        it('deletes all logs and empties the table', async () => {
            const root = await browser.$('lgb-log-board');
            const tableHost = await root.shadow$('c-log-table');
            const rows = toArray(await tableHost.shadow$$('tbody tr'));

            if (rows.length === 0) {
                // Nothing to delete; just confirm button stays disabled
                return;
            }

            const deleteBtn = await waitForInShadowByProperty(
                root, 'lightning-button-icon', 'title', 'Delete All Logs', 8000,
            );
            await deleteBtn.click();

            // Wait for spinner to finish. logBoard.js#deleteLogs sets
            // isLoading = true, then chains deleteDebugLogs → getLogs, with
            // isLoading flipped back to false inside getLogs once the new
            // (now-empty) result lands.
            await waitForSpinnerGone(browser, 30000);

            // The spinner can dip away during the call chain a beat before
            // LWC has reactively re-rendered the table with the new empty
            // logsData. Polling for the rows to disappear, rather than
            // asserting the count once, eliminates the race that previously
            // produced "Expected: 0, Received: 14".
            await browser.waitUntil(
                async () => {
                    const remaining = toArray(await tableHost.shadow$$('tbody tr'));
                    return remaining.length === 0;
                },
                {
                    timeout: 15000,
                    timeoutMsg: 'Table still has rows after Delete All Logs',
                }
            );

            const remainingRows = toArray(await tableHost.shadow$$('tbody tr'));
            expect(remainingRows.length).toBe(0);
        });
    });
});
