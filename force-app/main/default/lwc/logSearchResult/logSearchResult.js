import { LightningElement, track, api } from 'lwc';

export default class LogSearchResult extends LightningElement {
    @track searchResult = '';
    @track selectedIndex = 0;
    @track isPrevDisabled = true;
    @track isNextDisabled = true;
    @track label = '';

    @api
    set searchData(value) {
        if (!value || !value.length) {
            return;
        }
        this._searchData = value;
        if (this._searchData.length >1) {
            this.isNextDisabled = false;
        }
        this.searchResult = this._searchData[0].body;
        this.label = '1 of ' + this._searchData.length.toString() + ' search results';
    }

    get searchData() {
        return this._searchData;
    }

    _searchData = [];

    handleNext() {
        this.selectedIndex = this.selectedIndex + 1;
        this.setSearchResult();
    }

    handlePrev() {
        this.selectedIndex = this.selectedIndex - 1;
        this.setSearchResult();
    }

    handleFullLog () {
        let logId = this._searchData[this.selectedIndex].logId;

        const selectedEvent = new CustomEvent('fulllog', { detail: logId });

        this.dispatchEvent(selectedEvent);
    }

    setSearchResult() {
        this.searchResult = this._searchData[this.selectedIndex].body;
        if (this.selectedIndex === 0) {
            this.isPrevDisabled = true;
        } else {
            this.isPrevDisabled = false;
        }
        if (this._searchData.length === (this.selectedIndex + 1)) {
            this.isNextDisabled = true;
        } else {
            this.isNextDisabled = false;
        }
        this.label = (this.selectedIndex + 1).toString() + ' of ' + this._searchData.length.toString() + ' search results';
    }

    handleClose() {
        this._searchData = [];
        this.selectedIndex = 0;
        this.searchResult = '';
        this.isPrevDisabled = true;
        this.isNextDisabled = true;
        this.label = '';

        const closeEvent = new CustomEvent('close');
        this.dispatchEvent(closeEvent);
    }

}