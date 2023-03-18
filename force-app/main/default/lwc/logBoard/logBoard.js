import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getActiveTraceFlag from '@salesforce/apex/LogBoardController.getActiveTraceFlag';
import updateTraceFlag from '@salesforce/apex/LogBoardController.updateTraceFlag';
import stopTraceFlag from '@salesforce/apex/LogBoardController.stopTraceFlag';
import getDebugLogs from '@salesforce/apex/LogBoardController.getDebugLogs';
import deleteDebugLogs from '@salesforce/apex/LogBoardController.deleteDebugLogs';
import getLogBodyCalloutParams from '@salesforce/apex/LogBoardController.getLogBodyCalloutParams';
import upsertRSSTSS from '@salesforce/apex/LogBoardController.upsertRSSTSS';
import getLogFilter from '@salesforce/apex/LogBoardController.getLogFilter';
import saveLogFilter from '@salesforce/apex/LogBoardController.saveLogFilter';

export default class LogBoard extends LightningElement {

    debugDuration = '1';
    timeIntervalInstance;
    logBody = '';
    
    @track isLoading = false;
    @track isDebugActive = false;
    @track traceFlagId = '';
    @track traceFlagExpirationMS = 0;
    @track isViewLog = false;
    @track showSearchResults = false;
    @track isEditFilter = false;
    searchTerm = '';
    logFilter = '';
    logsData = [];
    searchData = [];
    auth;
    logBodyCalloutURL;
    

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
        this.getFilterAndLogs();
        this.getLogBodyCalloutParams();

        window.addEventListener("keydown", (event) => {
            if (event.code && event.code === 'Escape') {
                if (this.isViewLog) {
                    this.closeViewLog();
                }
                if (this.showSearchResults) {
                    this.closeSearchResults();
                }
                if (this.isEditFilter) {
                    this.closeEditFilter();
                }
            }
        }, true);
    }

    getFilterAndLogs() {
        this.isLoading = true;
        getLogFilter({})
            .then(result => {
                this.logFilter = result;
                this.getLogs();
            })
            .catch(error => {
                this.isLoading = false;
                this.showToast('', error.body.message, 'error');
            });
    }


    getLogs() {
        this.isLoading = true;
        getDebugLogs({filter: this.logFilter})
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

        this.getLogBody(logId);
    }

    getLogBodyCalloutParams() {
        getLogBodyCalloutParams().then(result => {
            this.auth = result.authorization;
            this.logBodyCalloutURL = result.url;
        }).catch(error => {
            this.isLoading = false;
            this.showToast('', error.body.message, 'error');
        });
    }

    handleSearch() {
        let searchTerm = this.template.querySelector("lightning-input").value;
        if (!searchTerm || !this.logsData.length) {
            return;
        }
        this.searchTerm = searchTerm;

        this.isLoading = true;

        let logBodyPromises = [];
        this.logsData.forEach(function (log) {
            logBodyPromises.push(new Promise((resolve, reject) => {
                let calloutURI = this.logBodyCalloutURL.replace('{0}', log.id)
            fetch(calloutURI, {
                method: "GET",
                headers: {
                    "Authorization": this.auth
                }
            }).then(
                (response) => {
                    return response.text()
                }
            ).then(text => {
                resolve({id: log.id, body: text});
            }).catch(error => {
                this.showToast('', error.body.message, 'error');
                reject(new Error('Error in logBodyPromise')); 
            });
            }));
        }, this);

        Promise.all(logBodyPromises).then(results => {
            this.buildSearchResults(results, searchTerm);
        });

    }

    buildSearchResults(results, searchTerm) {
        let searchData = [];

        results.forEach(function (log) {
            let logLines = log.body.split('\n');
            for (let i = 0; i < logLines.length; i++) {
                if (logLines[i].toLowerCase().includes(searchTerm.toLowerCase())) {
                    let searched = '';
                    if (logLines[i-1]) {
                        searched = this.formatLine(logLines[i-1]);
                    }
                    searched = searched + this.formatLine(logLines[i]);
                    if (logLines[i+1]) {
                        searched = searched + this.formatLine(logLines[i+1]);
                    }
                    searchData.push({
                        logId: log.id,
                        body: searched
                    });
                }
            }
        }, this);
        this.searchData = searchData;
        this.isLoading = false;

        if (this.searchData.length) {
            this.showSearchResults = true;
        } else {
            this.showToast('', 'No results found', 'warning');
        }
    }

    closeSearchResults() {
        this.searchData = [];
        this.showSearchResults = false;
        this.searchTerm = '';
        this.template.querySelector("lightning-input").value = '';
    }

    handleFullLog(event) {
        this.closeSearchResults();
        this.isLoading = true;
        this.getLogBody(event.detail);
    }

    formatLine(entry) {
        let formatted = '';
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
        return formatted;
    }

    getLogBody(logId) {
        let calloutURI = this.logBodyCalloutURL.replace('{0}', logId)
        fetch(calloutURI, {
            method: "GET",
            headers: {
                "Authorization": this.auth
              }
        }).then(
            (response) => {
                return response.text()
            }
        ).then(text => {
            this.logBody = text;
            this.isViewLog = true;
            this.isLoading = false;
        }).catch(error => {
            this.isLoading = false;
            this.showToast('', error.body.message, 'error');
        });
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

    handleSearchKey(event) {
        if (event.keyCode === 13) {
            this.handleSearch();
        }
    }

    handleSettingSlect(event) {
        const selectedItem = event.detail.value;
        if (selectedItem === 'RSSTSS') {
            this.deployRSSTSS();
        } else if (selectedItem === 'DebugLevel') {
            this.editDebugLevel();
        } else if (selectedItem === 'Filter') {
            this.isEditFilter = true;
        }
    }

    deployRSSTSS() {
        this.isLoading = true;
        upsertRSSTSS().then(result => {
            result.forEach(function (res) {
                let title = res.fullName === 'selfRSS' ? 'Remote Site Setting' : 'Trusted Site Setting';
                if (res.success) {
                    title = res.created ? title + ' has been deployed' : title + ' is already deployed';
                    this.showToast('Success', title, 'success');
                } else {
                    this.showToast(title + ': Error', JSON.stringify(res.errors), 'error');
                }
            }, this);
            this.isLoading = false;
        }).catch(error => {
            this.isLoading = false;
            this.showToast('', error.body.message, 'error');
        });
    }

    editDebugLevel() {
        const url = window.location.origin + '/udd/DebugLevel/editDebugLevel.apexp?traceflag_id=' + this.traceFlagId;
        window.open(url, "_blank");
    }

    closeEditFilter() {
        this.isEditFilter = false;
    }

    handleSaveEditFilter(event) {
        let filter = event.detail;
        this.isLoading = true;

        saveLogFilter({filter: filter})
            .then(result => {
                if (result.isSuccess) {
                    this.isEditFilter = false;
                    this.showToast('Success', 'Filter has been saved', 'success');
                    this.logFilter = filter;
                    this.refreshTable();
                } else {
                    this.isLoading = false;
                    this.showToast('Invalid Filter', result.error, 'error');
                }
            })
            .catch(error => {
                this.isLoading = false;
                this.showToast('', error.body.message, 'error');
            });
    }
}