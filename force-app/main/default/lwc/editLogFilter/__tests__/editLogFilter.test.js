import { createElement } from 'lwc';
import EditLogFilter from 'c/editLogFilter';

function createComponent(props = {}) {
    const element = createElement('c-edit-log-filter', { is: EditLogFilter });
    Object.assign(element, props);
    document.body.appendChild(element);
    return element;
}

describe('c-edit-log-filter', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('renders without errors', () => {
        const element = createComponent();
        expect(element.shadowRoot.querySelector('section')).not.toBeNull();
    });

    it('fires close event when footer Close button is clicked', () => {
        const element = createComponent();
        const handler = jest.fn();
        element.addEventListener('close', handler);

        // Footer has three buttons: Close, Set Default, Save — Close is first
        const buttons = element.shadowRoot.querySelectorAll('footer button');
        buttons[0].click();

        expect(handler).toHaveBeenCalledTimes(1);
    });

    it('fires close event when the X icon button in the header is clicked', () => {
        const element = createComponent();
        const handler = jest.fn();
        element.addEventListener('close', handler);

        const iconBtn = element.shadowRoot.querySelector('button.slds-modal__close');
        iconBtn.click();

        expect(handler).toHaveBeenCalledTimes(1);
    });

    it('fires save event carrying the current textarea value', () => {
        const element = createComponent();
        const handler = jest.fn();
        element.addEventListener('save', handler);

        const textarea = element.shadowRoot.querySelector('lightning-textarea');
        textarea.value = 'LogLength > 5000';

        const saveBtn = element.shadowRoot.querySelector('button.slds-button_brand');
        saveBtn.click();

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler.mock.calls[0][0].detail).toBe('LogLength > 5000');
    });

    it('populates textarea with DEFAULT_VALUE when Set Default is clicked', () => {
        const element = createComponent();

        const defaultBtn = element.shadowRoot.querySelectorAll('footer button')[1];
        defaultBtn.click();

        const textarea = element.shadowRoot.querySelector('lightning-textarea');
        expect(textarea.value).toBe(
            "Operation != '/apex/lgb__sessionidpage' AND LogLength > 1800"
        );
    });

    it('resets textarea to the logFilter prop value when Close is clicked', () => {
        const element = createComponent({ logFilter: 'Status = \'Success\'' });

        // Simulate the user typing something different
        const textarea = element.shadowRoot.querySelector('lightning-textarea');
        textarea.value = 'some unsaved value';

        const closeBtn = element.shadowRoot.querySelectorAll('footer button')[0];
        closeBtn.click();

        expect(textarea.value).toBe('Status = \'Success\'');
    });

    it('reflects the logFilter prop in the textarea initial value', () => {
        const element = createComponent({ logFilter: 'Operation != \'test\'' });

        const textarea = element.shadowRoot.querySelector('lightning-textarea');
        expect(textarea.value).toBe('Operation != \'test\'');
    });
});
