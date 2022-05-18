import { LightningElement, api, track} from 'lwc';

export default class LogTable extends LightningElement {
    @api logsData = [];

    handleView(event) {
        let logId = event.target.dataset.id;
        const logEvent = new CustomEvent('viewlog', {detail: logId});
        this.dispatchEvent(logEvent);
    }

    handleDownload(event) {
        let logId = event.target.dataset.id;
        let url = window.location.origin + '/servlet/servlet.FileDownload?file=' + logId;
        window.open(url, "_blank");
    }
}