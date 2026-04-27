import { createElement } from 'lwc';
import LogView from 'c/logView';

function createComponent(props = {}) {
    const element = createElement('c-log-view', { is: LogView });
    Object.assign(element, props);
    document.body.appendChild(element);
    return element;
}

function getFormattedHtml(element) {
    return element.shadowRoot.querySelector('lightning-formatted-rich-text').value;
}

// Toggle the debug-only checkbox and wait for LWC to re-render
async function toggleDebugOnly(element, checked) {
    const checkbox = element.shadowRoot.querySelector('lightning-input');
    checkbox.checked = checked;
    checkbox.dispatchEvent(new CustomEvent('change'));
    await Promise.resolve();
}

describe('c-log-view', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        jest.restoreAllMocks();
    });

    it('renders without errors', () => {
        const element = createComponent();
        expect(element.shadowRoot.querySelector('section')).not.toBeNull();
    });

    describe('log line colour formatting', () => {
        it('wraps CODE_UNIT_ lines in yellow', () => {
            const element = createComponent({ logData: 'CODE_UNIT_STARTED|MyClass' });
            expect(getFormattedHtml(element)).toContain('color: rgb(230, 219, 116)');
            expect(getFormattedHtml(element)).toContain('CODE_UNIT_STARTED|MyClass');
        });

        it('wraps METHOD_ lines in yellow', () => {
            const element = createComponent({ logData: 'METHOD_ENTRY|[1]|MyClass.run' });
            expect(getFormattedHtml(element)).toContain('color: rgb(230, 219, 116)');
        });

        it('wraps CALLOUT_ lines in purple', () => {
            const element = createComponent({ logData: 'CALLOUT_REQUEST|[5]|System.Http' });
            expect(getFormattedHtml(element)).toContain('color: rgb(174, 129, 255)');
        });

        it('wraps SOQL_EXECUTE_ lines in cyan', () => {
            const element = createComponent({ logData: 'SOQL_EXECUTE_BEGIN|[12]|SELECT Id FROM Account' });
            expect(getFormattedHtml(element)).toContain('color: rgb(102, 217, 239)');
        });

        it('wraps USER_DEBUG lines in green', () => {
            const element = createComponent({ logData: 'USER_DEBUG|[3]|DEBUG|hello' });
            expect(getFormattedHtml(element)).toContain('color: rgb(166, 226, 46)');
        });

        it('wraps EXCEPTION_THROWN lines in red', () => {
            const element = createComponent({ logData: 'EXCEPTION_THROWN|[7]|System.NullPointerException' });
            expect(getFormattedHtml(element)).toContain('color: red');
        });

        it('wraps FATAL_ERROR lines in red', () => {
            const element = createComponent({ logData: 'FATAL_ERROR|System.LimitException' });
            expect(getFormattedHtml(element)).toContain('color: red');
        });

        it('wraps unrecognised lines in a plain div', () => {
            const element = createComponent({ logData: 'just a plain log line' });
            const html = getFormattedHtml(element);
            expect(html).toContain('<div>just a plain log line</div>');
            expect(html).not.toContain('color:');
        });

        it('renders multiple lines in document order', () => {
            const element = createComponent({
                logData: 'USER_DEBUG|hello\nEXCEPTION_THROWN|oops'
            });
            const html = getFormattedHtml(element);
            expect(html.indexOf('rgb(166, 226, 46)')).toBeLessThan(html.indexOf('red'));
        });
    });

    describe('debug-only toggle', () => {
        it('shows only USER_DEBUG lines when debug-only is enabled', async () => {
            const element = createComponent({
                logData: 'CODE_UNIT_STARTED|MyClass\nUSER_DEBUG|[1]|hello\nSOQL_EXECUTE_BEGIN|query'
            });

            await toggleDebugOnly(element, true);

            const html = getFormattedHtml(element);
            expect(html).toContain('USER_DEBUG');
            expect(html).not.toContain('CODE_UNIT_STARTED');
            expect(html).not.toContain('SOQL_EXECUTE_BEGIN');
        });

        it('shows "Nothing to show" when debug-only is on and no USER_DEBUG lines exist', async () => {
            const element = createComponent({ logData: 'CODE_UNIT_STARTED|MyClass' });
            await toggleDebugOnly(element, true);
            expect(getFormattedHtml(element)).toContain('Nothing to show');
        });

        it('restores all lines when debug-only is toggled back off', async () => {
            const element = createComponent({
                logData: 'CODE_UNIT_STARTED|MyClass\nUSER_DEBUG|[1]|hello'
            });

            await toggleDebugOnly(element, true);
            await toggleDebugOnly(element, false);

            const html = getFormattedHtml(element);
            expect(html).toContain('CODE_UNIT_STARTED');
            expect(html).toContain('USER_DEBUG');
        });
    });

    it('fires close event when Close button is clicked', () => {
        const element = createComponent();
        const handler = jest.fn();
        element.addEventListener('close', handler);

        element.shadowRoot.querySelector('button.slds-button_neutral').click();

        expect(handler).toHaveBeenCalledTimes(1);
    });

    it('opens a new window with the correct download URL', () => {
        const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation(() => {});
        const element = createComponent({ logId: 'abc123' });

        element.shadowRoot.querySelector('button.slds-button_brand').click();

        expect(windowOpenSpy).toHaveBeenCalledTimes(1);
        expect(windowOpenSpy.mock.calls[0][0]).toContain('abc123');
        expect(windowOpenSpy.mock.calls[0][0]).toContain('servlet.FileDownload');
        expect(windowOpenSpy.mock.calls[0][1]).toBe('_blank');
    });
});
