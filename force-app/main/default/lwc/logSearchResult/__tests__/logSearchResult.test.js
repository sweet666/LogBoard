import { createElement } from 'lwc';
import LogSearchResult from 'c/logSearchResult';

const SINGLE_RESULT = [
    { logId: 'log001', body: '<div>match line</div>' }
];

const MULTI_RESULTS = [
    { logId: 'log001', body: '<div>first match</div>' },
    { logId: 'log002', body: '<div>second match</div>' },
    { logId: 'log003', body: '<div>third match</div>' },
];

function createComponent(props = {}) {
    const element = createElement('c-log-search-result', { is: LogSearchResult });
    Object.assign(element, props);
    document.body.appendChild(element);
    return element;
}

function getLabel(element) {
    return element.shadowRoot.querySelector('h2').textContent;
}

// Helper: click a footer button and wait for LWC to re-render
async function clickFooterBtn(element, index) {
    const btns = element.shadowRoot.querySelectorAll('footer button');
    btns[index].click();
    await Promise.resolve();
}

describe('c-log-search-result', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('renders without errors', () => {
        const element = createComponent();
        expect(element.shadowRoot.querySelector('section')).not.toBeNull();
    });

    describe('initial state with search data', () => {
        it('shows "1 of N search results" label when data is set', () => {
            const element = createComponent({ searchData: MULTI_RESULTS });
            expect(getLabel(element)).toBe('1 of 3 search results');
        });

        it('prev is disabled and next is enabled with multiple results', () => {
            const element = createComponent({ searchData: MULTI_RESULTS });
            const footerBtns = element.shadowRoot.querySelectorAll('footer button');
            const prevBtn = footerBtns[1]; // Previous
            const nextBtn = footerBtns[2]; // Next
            expect(prevBtn.disabled).toBe(true);
            expect(nextBtn.disabled).toBe(false);
        });

        it('both prev and next are disabled with a single result', () => {
            const element = createComponent({ searchData: SINGLE_RESULT });
            const footerBtns = element.shadowRoot.querySelectorAll('footer button');
            expect(footerBtns[1].disabled).toBe(true);
            expect(footerBtns[2].disabled).toBe(true);
        });

        it('displays the first result body', () => {
            const element = createComponent({ searchData: MULTI_RESULTS });
            const richText = element.shadowRoot.querySelector('lightning-formatted-rich-text');
            expect(richText.value).toBe('<div>first match</div>');
        });
    });

    describe('pagination', () => {
        it('advances to the second result when Next is clicked', async () => {
            const element = createComponent({ searchData: MULTI_RESULTS });

            await clickFooterBtn(element, 2); // Next

            const richText = element.shadowRoot.querySelector('lightning-formatted-rich-text');
            expect(richText.value).toBe('<div>second match</div>');
            expect(getLabel(element)).toBe('2 of 3 search results');
        });

        it('enables Prev after clicking Next once', async () => {
            const element = createComponent({ searchData: MULTI_RESULTS });
            await clickFooterBtn(element, 2); // Next
            const footerBtns = element.shadowRoot.querySelectorAll('footer button');
            expect(footerBtns[1].disabled).toBe(false);
        });

        it('goes back to the first result when Prev is clicked after Next', async () => {
            const element = createComponent({ searchData: MULTI_RESULTS });
            await clickFooterBtn(element, 2); // Next → index 1
            await clickFooterBtn(element, 1); // Prev → index 0

            const richText = element.shadowRoot.querySelector('lightning-formatted-rich-text');
            expect(richText.value).toBe('<div>first match</div>');
            expect(getLabel(element)).toBe('1 of 3 search results');
        });

        it('disables Next when on the last result', async () => {
            const element = createComponent({ searchData: MULTI_RESULTS });
            await clickFooterBtn(element, 2); // → index 1
            await clickFooterBtn(element, 2); // → index 2 (last)

            const footerBtns = element.shadowRoot.querySelectorAll('footer button');
            expect(footerBtns[2].disabled).toBe(true);
        });
    });

    describe('events', () => {
        it('fires fulllog event with the current logId when Open Full Log is clicked', async () => {
            const element = createComponent({ searchData: MULTI_RESULTS });
            const handler = jest.fn();
            element.addEventListener('fulllog', handler);

            await clickFooterBtn(element, 0); // Open Full Log (index 0)

            expect(handler).toHaveBeenCalledTimes(1);
            expect(handler.mock.calls[0][0].detail).toBe('log001');
        });

        it('fires fulllog event with the logId of the currently visible result', async () => {
            const element = createComponent({ searchData: MULTI_RESULTS });
            const handler = jest.fn();
            element.addEventListener('fulllog', handler);

            await clickFooterBtn(element, 2); // Next → index 1
            await clickFooterBtn(element, 0); // Open Full Log

            expect(handler.mock.calls[0][0].detail).toBe('log002');
        });

        it('fires close event and clears the label when the X button is clicked', async () => {
            const element = createComponent({ searchData: MULTI_RESULTS });
            const handler = jest.fn();
            element.addEventListener('close', handler);

            const closeBtn = element.shadowRoot.querySelector('button.slds-modal__close');
            closeBtn.click();
            await Promise.resolve();

            expect(handler).toHaveBeenCalledTimes(1);
            expect(getLabel(element)).toBe('');
        });
    });
});
