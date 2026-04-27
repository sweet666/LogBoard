/**
 * @salesforce/apex/... imports are transformed by @lwc/jest-transformer into:
 *
 *   let getSettings;
 *   try { getSettings = require('@salesforce/apex/...').default; }
 *   catch(e) { global.__lwcJestMock_getSettings = global.__lwcJestMock_getSettings || fn; getSettings = global.__lwcJestMock_getSettings; }
 *
 * So to mock them, we use jest.mock with a factory that returns { default: jest.fn() }.
 * This makes require(...).default resolve to a jest.fn() that tests can configure.
 */

// ── Apex mocks ──────────────────────────────────────────────────────────────
jest.mock('@salesforce/apex/LogBoardController.getActiveTraceFlag',
    () => ({ default: jest.fn() }), { virtual: true });
jest.mock('@salesforce/apex/LogBoardController.updateTraceFlag',
    () => ({ default: jest.fn() }), { virtual: true });
jest.mock('@salesforce/apex/LogBoardController.stopTraceFlag',
    () => ({ default: jest.fn() }), { virtual: true });
jest.mock('@salesforce/apex/LogBoardController.getDebugLogs',
    () => ({ default: jest.fn() }), { virtual: true });
jest.mock('@salesforce/apex/LogBoardController.deleteDebugLogs',
    () => ({ default: jest.fn() }), { virtual: true });
jest.mock('@salesforce/apex/LogBoardController.getLogBodyCalloutParams',
    () => ({ default: jest.fn() }), { virtual: true });
jest.mock('@salesforce/apex/LogBoardController.upsertRSSTSS',
    () => ({ default: jest.fn() }), { virtual: true });
jest.mock('@salesforce/apex/LogBoardController.getSettings',
    () => ({ default: jest.fn() }), { virtual: true });
jest.mock('@salesforce/apex/LogBoardController.saveLogFilter',
    () => ({ default: jest.fn() }), { virtual: true });
jest.mock('@salesforce/apex/LogBoardController.saveAutoRefreshSetting',
    () => ({ default: jest.fn() }), { virtual: true });

import { createElement } from 'lwc';
import LogBoard from 'c/logBoard';
import getSettings          from '@salesforce/apex/LogBoardController.getSettings';
import getActiveTraceFlag   from '@salesforce/apex/LogBoardController.getActiveTraceFlag';
import getLogBodyCalloutParams from '@salesforce/apex/LogBoardController.getLogBodyCalloutParams';
import getDebugLogs         from '@salesforce/apex/LogBoardController.getDebugLogs';
import updateTraceFlag      from '@salesforce/apex/LogBoardController.updateTraceFlag';
import stopTraceFlag        from '@salesforce/apex/LogBoardController.stopTraceFlag';
import saveLogFilter        from '@salesforce/apex/LogBoardController.saveLogFilter';

// Default: all Apex calls resolve without data so connectedCallback doesn't throw
function setupDefaultMocks() {
    getSettings.mockResolvedValue(null);
    getLogBodyCalloutParams.mockResolvedValue({
        authorization: 'Bearer token',
        url: 'https://example.com/logs/{0}'
    });
    getActiveTraceFlag.mockResolvedValue(null);
    getDebugLogs.mockResolvedValue([]);
}

function createComponent() {
    const element = createElement('c-log-board', { is: LogBoard });
    document.body.appendChild(element);
    return element;
}

describe('c-log-board', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    // ─── Rendering ──────────────────────────────────────────────────────────

    it('renders without errors', () => {
        setupDefaultMocks();
        const element = createComponent();
        expect(element.shadowRoot.querySelector('.logBoard')).not.toBeNull();
    });

    it('shows "Debug disabled" when debug is not active', () => {
        setupDefaultMocks();
        const element = createComponent();
        expect(element.shadowRoot.textContent).toContain('Debug disabled');
    });

    // ─── Duration buttons ────────────────────────────────────────────────────

    it('defaults to duration "1" selected', () => {
        setupDefaultMocks();
        const element = createComponent();
        const btn1 = element.shadowRoot.querySelector('button[data-id="1"]');
        expect(btn1.className).toContain('btn-selected');
    });

    it('moves selection to "2" when that button is clicked', async () => {
        setupDefaultMocks();
        const element = createComponent();

        element.shadowRoot.querySelector('button[data-id="2"]').click();
        await Promise.resolve();

        const btn1 = element.shadowRoot.querySelector('button[data-id="1"]');
        const btn2 = element.shadowRoot.querySelector('button[data-id="2"]');
        expect(btn2.className).toContain('btn-selected');
        expect(btn1.className).not.toContain('btn-selected');
    });

    it('allows selecting any of the five duration options', async () => {
        setupDefaultMocks();
        const element = createComponent();
        const durations = ['1', '2', '3', '5', '10'];

        for (const d of durations) {
            element.shadowRoot.querySelector(`button[data-id="${d}"]`).click();
            await Promise.resolve();

            for (const other of durations) {
                const btn = element.shadowRoot.querySelector(`button[data-id="${other}"]`);
                if (other === d) {
                    expect(btn.className).toContain('btn-selected');
                } else {
                    expect(btn.className).not.toContain('btn-selected');
                }
            }
        }
    });

    // ─── formatLine colour mapping ───────────────────────────────────────────
    // Tested indirectly: trigger a search, inspect the searchData bound to c-log-search-result

    // Flush all pending microtasks
    async function flushPromises() {
        for (let i = 0; i < 10; i++) await Promise.resolve();
    }

    async function runSearchAndGetResults(element, logBody) {
        // Wait for connectedCallback Apex calls to settle
        await flushPromises();

        global.fetch = jest.fn().mockResolvedValue({
            text: () => Promise.resolve(logBody)
        });

        const searchInput = element.shadowRoot.querySelector(
            'lightning-input[data-id="search-input"]'
        );
        searchInput.value = 'SEARCH_TERM';

        // Trigger search via Enter keydown on the input (avoids attribute selector issues)
        searchInput.dispatchEvent(
            new KeyboardEvent('keydown', { keyCode: 13, bubbles: true })
        );

        // Let Promise.all and buildSearchResults run
        await flushPromises();
    }

    // Shared setup for formatLine tests:
    // getActiveTraceFlag must return a truthy (non-expired) result so initTraceFlag calls getLogs()
    // getDebugLogs must return logs so handleSearch doesn't bail on empty logsData
    function setupSearchMocks() {
        getSettings.mockResolvedValue(null);
        getLogBodyCalloutParams.mockResolvedValue({
            authorization: 'Bearer token',
            url: 'https://example.com/logs/{0}'
        });
        getActiveTraceFlag.mockResolvedValue({ Id: 'tf001' }); // truthy → getLogs() runs
        getDebugLogs.mockResolvedValue([{ id: 'log001' }]);    // non-empty → search works
    }

    it('formats CODE_UNIT_ lines in yellow in search results', async () => {
        setupSearchMocks();
        const element = createComponent();

        await runSearchAndGetResults(
            element,
            'SEARCH_TERM\nCODE_UNIT_STARTED|MyClass\nafter'
        );

        const resultCmp = element.shadowRoot.querySelector('c-log-search-result');
        expect(resultCmp).not.toBeNull();
        expect(resultCmp.searchData[0].body).toContain('rgb(230, 219, 116)');
    });

    it('formats USER_DEBUG lines in green in search results', async () => {
        setupSearchMocks();
        const element = createComponent();

        await runSearchAndGetResults(
            element,
            'SEARCH_TERM\nUSER_DEBUG|[1]|hello\nafter'
        );

        const resultCmp = element.shadowRoot.querySelector('c-log-search-result');
        expect(resultCmp).not.toBeNull();
        expect(resultCmp.searchData[0].body).toContain('rgb(166, 226, 46)');
    });

    it('formats EXCEPTION_THROWN lines in red in search results', async () => {
        setupSearchMocks();
        const element = createComponent();

        await runSearchAndGetResults(
            element,
            'SEARCH_TERM\nEXCEPTION_THROWN|[1]|NullPointerException\nafter'
        );

        const resultCmp = element.shadowRoot.querySelector('c-log-search-result');
        expect(resultCmp).not.toBeNull();
        expect(resultCmp.searchData[0].body).toContain('color: red');
    });

    // ─── Settings handling ────────────────────────────────────────────────────

    it('passes custom log filter to getDebugLogs', async () => {
        getSettings.mockResolvedValue({
            LGB__Log_Filter__c: 'Status = \'Success\'',
            LGB__Is_Autorefresh__c: false
        });
        getLogBodyCalloutParams.mockResolvedValue({
            authorization: 'Bearer token',
            url: 'https://example.com/logs/{0}'
        });
        // Return a truthy trace flag (no ExpirationDate) so initTraceFlag calls getLogs()
        getActiveTraceFlag.mockResolvedValue({ Id: 'tf001' });
        getDebugLogs.mockResolvedValue([]);

        const element = createComponent();
        // Multiple await rounds: getSettings → initTraceFlag → getActiveTraceFlag → getLogs → getDebugLogs
        for (let i = 0; i < 10; i++) await Promise.resolve();

        expect(getDebugLogs).toHaveBeenCalledWith(
            expect.objectContaining({ filter: 'Status = \'Success\'' })
        );
    });

    // ─── Edit filter modal ────────────────────────────────────────────────────

    it('opens the edit filter modal when Filter menu item is selected', async () => {
        setupDefaultMocks();
        const element = createComponent();
        await Promise.resolve();

        const menu = element.shadowRoot.querySelector('lightning-button-menu');
        menu.dispatchEvent(new CustomEvent('select', { detail: { value: 'Filter' } }));
        await Promise.resolve();

        expect(element.shadowRoot.querySelector('c-edit-log-filter')).not.toBeNull();
    });

    it('closes the edit filter modal when the close event fires', async () => {
        setupDefaultMocks();
        const element = createComponent();
        await Promise.resolve();

        const menu = element.shadowRoot.querySelector('lightning-button-menu');
        menu.dispatchEvent(new CustomEvent('select', { detail: { value: 'Filter' } }));
        await Promise.resolve();

        const filterModal = element.shadowRoot.querySelector('c-edit-log-filter');
        filterModal.dispatchEvent(new CustomEvent('close'));
        await Promise.resolve();

        expect(element.shadowRoot.querySelector('c-edit-log-filter')).toBeNull();
    });

    it('calls saveLogFilter and closes modal when a filter is saved', async () => {
        saveLogFilter.mockResolvedValue({ isSuccess: true });
        setupDefaultMocks();

        const element = createComponent();
        await Promise.resolve();

        const menu = element.shadowRoot.querySelector('lightning-button-menu');
        menu.dispatchEvent(new CustomEvent('select', { detail: { value: 'Filter' } }));
        await Promise.resolve();

        const filterModal = element.shadowRoot.querySelector('c-edit-log-filter');
        filterModal.dispatchEvent(new CustomEvent('save', { detail: 'LogLength > 9999' }));
        await Promise.resolve();
        await Promise.resolve();

        expect(saveLogFilter).toHaveBeenCalledWith({ filter: 'LogLength > 9999' });
        expect(element.shadowRoot.querySelector('c-edit-log-filter')).toBeNull();
    });

    // ─── Keyboard shortcut ────────────────────────────────────────────────────

    it('closes the log view when Escape is pressed', async () => {
        setupDefaultMocks();
        global.fetch = jest.fn().mockResolvedValue({
            text: () => Promise.resolve('log body text')
        });

        const element = createComponent();
        // Let connectedCallback settle
        for (let i = 0; i < 5; i++) await Promise.resolve();

        // Open log view by firing viewlog from the log table child
        const logTable = element.shadowRoot.querySelector('c-log-table');
        logTable.dispatchEvent(new CustomEvent('viewlog', { detail: 'logABC' }));

        // Wait for fetch + state update
        for (let i = 0; i < 10; i++) await Promise.resolve();

        expect(element.shadowRoot.querySelector('c-log-view')).not.toBeNull();

        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true }));
        await Promise.resolve();

        expect(element.shadowRoot.querySelector('c-log-view')).toBeNull();
    });
});
