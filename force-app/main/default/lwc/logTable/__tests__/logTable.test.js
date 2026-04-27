import { createElement } from 'lwc';
import LogTable from 'c/logTable';

const SAMPLE_LOGS = [
    { id: 'log001', userName: 'Alice', operation: '/aura',      status: 'Success', size: '0.5', startTime: '2024-01-01 10:00:00' },
    { id: 'log002', userName: 'Bob',   operation: '/apex/test', status: 'Success', size: '1.2', startTime: '2024-01-01 10:01:00' },
];

function createComponent(props = {}) {
    const element = createElement('c-log-table', { is: LogTable });
    Object.assign(element, props);
    document.body.appendChild(element);
    return element;
}

describe('c-log-table', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        jest.restoreAllMocks();
    });

    it('renders the table without errors when logsData is empty', () => {
        const element = createComponent();
        expect(element.shadowRoot.querySelector('table')).not.toBeNull();
        expect(element.shadowRoot.querySelectorAll('tbody tr')).toHaveLength(0);
    });

    it('renders one row per log entry', () => {
        const element = createComponent({ logsData: SAMPLE_LOGS });
        const rows = element.shadowRoot.querySelectorAll('tbody tr');
        expect(rows).toHaveLength(2);
    });

    it('displays the correct data in each row', () => {
        const element = createComponent({ logsData: SAMPLE_LOGS });
        const firstRow = element.shadowRoot.querySelector('tbody tr');
        expect(firstRow.textContent).toContain('Alice');
        expect(firstRow.textContent).toContain('/aura');
        expect(firstRow.textContent).toContain('Success');
    });

    it('fires viewlog event with the log id when the view button is clicked', () => {
        const element = createComponent({ logsData: SAMPLE_LOGS });
        const handler = jest.fn();
        element.addEventListener('viewlog', handler);

        // Each row has two lightning-button-icons: download then view
        // The view button is the second icon in the first row
        const rows = element.shadowRoot.querySelectorAll('tbody tr');
        const viewBtn = rows[0].querySelectorAll('lightning-button-icon')[1];
        viewBtn.click();

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler.mock.calls[0][0].detail).toBe('log001');
    });

    it('opens a new window with the download URL when the download button is clicked', () => {
        const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation(() => {});
        const element = createComponent({ logsData: SAMPLE_LOGS });

        // Download button is the first icon in the second row
        const rows = element.shadowRoot.querySelectorAll('tbody tr');
        const downloadBtn = rows[1].querySelectorAll('lightning-button-icon')[0];
        downloadBtn.click();

        expect(windowOpenSpy).toHaveBeenCalledTimes(1);
        expect(windowOpenSpy.mock.calls[0][0]).toContain('log002');
        expect(windowOpenSpy.mock.calls[0][0]).toContain('servlet.FileDownload');
        expect(windowOpenSpy.mock.calls[0][1]).toBe('_blank');
    });
});
