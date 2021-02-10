import { LightningElement, api, track} from 'lwc';

export default class LogTable extends LightningElement {
    @api logsData = [];

    handleView(event) {
        let logId = event.target.dataset.id;
        const logEvent = new CustomEvent('viewlog', {detail: logId});
        this.dispatchEvent(logEvent);
    }
}