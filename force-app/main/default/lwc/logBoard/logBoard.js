import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getActiveTraceFlag from '@salesforce/apex/LogBoardController.getActiveTraceFlag';
import updateTraceFlag from '@salesforce/apex/LogBoardController.updateTraceFlag';
import stopTraceFlag from '@salesforce/apex/LogBoardController.stopTraceFlag';
import getDebugLogs from '@salesforce/apex/LogBoardController.getDebugLogs';
import deleteDebugLogs from '@salesforce/apex/LogBoardController.deleteDebugLogs';
import getLogBody from '@salesforce/apex/LogBoardController.getLogBody';

export default class LogBoard extends LightningElement {

    debugDuration = '2';
    timeIntervalInstance;
    logBody = '';
    
    @track isLoading = false;
    @track isDebugActive = false;
    @track traceFlagId = '';
    @track traceFlagExpirationMS = 0;
    @track isViewLog = false;
    logsData = [];
    searchTerm = '';

    get debugDurationOptions() {
        return [
            {label: '1', value: '1'},
            {label: '2', value: '2'},
            {label: '3', value: '3'},
            {label: '5', value: '5'},
            {label: '10', value: '10'},
        ];
    }

    get isLogsDataEmpty() {
        return this.logsData.length === 0;
    }

    get traceFlagExpiration() {
        if (this.traceFlagExpirationMS === 0) {
            this.isDebugActive = false;
            return '';
        }

        let seconds = Math.floor((this.traceFlagExpirationMS / 1000) % 60);
        let minutes = Math.floor((this.traceFlagExpirationMS / (1000 * 60)) % 60);

        return minutes + ':' + seconds;
    }
    
    connectedCallback() {
        this.initTraceFlag();
        this.getLogs();
    }


    getLogs() {
        this.isLoading = true;
        getDebugLogs({})
            .then(result => {
                if (result) {
                    this.logsData = result;
                }
                this.isLoading = false;
            })
            .catch(error => {
                this.isLoading = false;
                this.showToast('', error.body.message, 'error');
            });
    }

    initTraceFlag() {
        getActiveTraceFlag({})
            .then(result => {
                if (result) {
                    this.traceFlagId = result.Id;
                    if (result.ExpirationDate) {
                        this.isDebugActive = true;
                        this.calculateExparationInMS(Date.parse(result.ExpirationDate));
                        this.startCountDown();
                    } 
                }
            })
            .catch(error => {
                this.showToast(error.body.message, 'Try to create a new User Trace Flag' , 'error');
            });
    }

    updateTraceFlag() {
        this.isLoading = true;
        updateTraceFlag({
                traceId : this.traceFlagId,
                duration : parseInt(this.debugDuration, 10)
            }).then(result => {
                this.isDebugActive = true;
                this.calculateExparationInMS(Date.parse(result));
                this.startCountDown();
                this.isLoading = false;
            })
            .catch(error => {
                this.isLoading = false;
                this.showToast('', error.body.message, 'error');
            });
    }

    calculateExparationInMS(exparationInMillisecs) {
        this.traceFlagExpirationMS = exparationInMillisecs - Date.now();
    }

    startCountDown() {
        var parentThis = this;

        // Run timer code in every 1000 milliseconds
        this.timeIntervalInstance = setInterval(function() {

            if (parentThis.traceFlagExpirationMS <= 999) {
                parentThis.traceFlagExpirationMS = 0;
                clearInterval(parentThis.timeIntervalInstance);
            } else {
                parentThis.traceFlagExpirationMS -= 1000;
            }
        }, 1000);
    }

    handleDurationValue(event) {
        this.debugDuration = event.target.value;
    }

    refreshTable() {
        this.isLoading = true;
        this.getLogs();
    }

    deleteLogs() {
        this.isLoading = true;
        var self = this;
        deleteDebugLogs({})
            .then(result => {
                self.getLogs();
            })
            .catch(error => {
                this.isLoading = false;
                this.showToast('', error.body.message, 'error');
            });
    }

    stopTraceFlag() {
        this.isLoading = true;
        stopTraceFlag({
            traceId : this.traceFlagId
        }).then(result => {
            this.isDebugActive = false;
            this.traceFlagExpirationMS = 0;
            clearInterval(this.timeIntervalInstance);
            this.isLoading = false;
        })
        .catch(error => {
            this.isLoading = false;
            this.showToast('', error.body.message, 'error');
        });
    }

    handleViewLog(event) {
        this.isLoading = true;
        let logId = event.detail;

        getLogBody({
            logId : logId
        }).then(result => {
            this.logBody = result;
            this.isViewLog = true;
            this.isLoading = false;
        }).catch(error => {
            this.isLoading = false;
            this.showToast('', error.body.message, 'error');
        });
    }

    handleSearch() {
        let searchTerm = this.template.querySelector("lightning-input").value;

        if (!searchTerm) {
            return;
        }

        this.searchTerm = searchTerm;
        

    }

    closeViewLog() {
        this.logBody = '';
        this.isViewLog = false;
    }

    showToast(title, message, variant) {
        const toastParams = {
            title: title,
            message: message,
            variant: variant
        };
        const showToastEvent = new ShowToastEvent(toastParams);
        this.dispatchEvent(showToastEvent);
    }
}