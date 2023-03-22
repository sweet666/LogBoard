import { LightningElement, api } from 'lwc';

export default class EditLogFilter extends LightningElement {
    @api logFilter = '';

    DEFAULT_VALUE = 'Operation != \'/apex/lgb__sessionidpage\' AND LogLength > 1800'

    label = 'String value of WHERE clause for ApexLog SOQL query. Can be empty if no filter needed';

    handleClose() {
        this.template.querySelector("lightning-textarea").value = this.logFilter;

        const closeEvent = new CustomEvent('close');
        this.dispatchEvent(closeEvent);
    }

    handleSave() {
        let filter = this.template.querySelector("lightning-textarea").value;

        const saveEvent = new CustomEvent('save', {detail: filter});
        this.dispatchEvent(saveEvent);
    }

    setDefaultFilter() {
        this.template.querySelector("lightning-textarea").value = this.DEFAULT_VALUE;
    }
}