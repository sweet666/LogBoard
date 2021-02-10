import { LightningElement, api } from 'lwc';

export default class LogView extends LightningElement {
    @api logData = '';

    get formattedLogData() {
        if (!this.logData) {
            return '';
        }

        let formatted = '';

        this.logData.split('\n').forEach(function(entry) {
            if (entry.includes('CODE_UNIT_') || entry.includes('METHOD_')) {
                formatted += '<div style="color: rgb(230, 219, 116)">' + entry + '</div>'
            } else if (entry.includes('CALLOUT_')) {
                formatted += '<div style="color: rgb(174, 129, 255)">' + entry + '</div>'
            } else if (entry.includes('SOQL_EXECUTE_')) {
                formatted += '<div style="color: rgb(102, 217, 239)">' + entry + '</div>'
            } else if (entry.includes('USER_DEBUG')) {
                formatted += '<div style="color: rgb(166, 226, 46)">' + entry + '</div>'
            } else if (entry.includes('EXCEPTION_THROWN') || entry.includes('FATAL_ERROR')) {
                formatted += '<div style="color: red">' + entry + '</div>'
            } else {
                formatted += '<div>' + entry + '</div>'
            } 
        });

        return formatted;
    }

    handleClose() {
        const closeEvent = new CustomEvent('close');
        this.dispatchEvent(closeEvent);
    }
}