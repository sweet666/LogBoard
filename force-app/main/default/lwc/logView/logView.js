import { LightningElement, api, track } from 'lwc';

export default class LogView extends LightningElement {
    
    _logData = '';
    formattedLogData = '';
    isDebugOnly = false;

    @api 
    set logData(value) {
        if (value) {
            this._logData = value;
            this.setFormattedLogData();
        }
    }

    get logData() {
        return this._logData;
    }

    setFormattedLogData() {
        let formatted = '';

        if (this.isDebugOnly) {
            this._logData.split('\n').forEach(function(entry) {
                if (entry.includes('USER_DEBUG')) {
                    formatted += '<div style="color: rgb(166, 226, 46)">' + entry + '</div>'
                }
            });
            if (!formatted) {
                formatted = '<div style="color: rgb(166, 226, 46)">Nothing to show</div>'
            }
        } else {
            this._logData.split('\n').forEach(function(entry) {
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
        }

        this.formattedLogData = formatted;
    }

    handleDebugOnly(event) {
        this.isDebugOnly = event.target.checked;
        this.setFormattedLogData();
    }

    handleClose() {
        const closeEvent = new CustomEvent('close');
        this.dispatchEvent(closeEvent);
    }
}