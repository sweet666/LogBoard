
'use strict';

var core = require('@utam/core');

async function _utam_get_table(driver, root) {
    let _element = root;
    const _locator = core.By.css("table.table-dark");
    _element = new core.ShadowRoot(driver, _element);
    return _element.findElement(_locator);
}

async function _utam_get_firstRowViewButton(driver, root) {
    let _element = root;
    const _locator = core.By.css("tbody tr:first-child lightning-button-icon[alternative-text='View']");
    _element = new core.ShadowRoot(driver, _element);
    const hasElement = await _element.containsElement(_locator);
    if (!hasElement) { return null; }
    return _element.findElement(_locator);
}

async function _utam_get_firstRowDownloadButton(driver, root) {
    let _element = root;
    const _locator = core.By.css("tbody tr:first-child lightning-button-icon[alternative-text='Download']");
    _element = new core.ShadowRoot(driver, _element);
    const hasElement = await _element.containsElement(_locator);
    if (!hasElement) { return null; }
    return _element.findElement(_locator);
}

async function _utam_get_firstRowUser(driver, root) {
    let _element = root;
    const _locator = core.By.css("tbody tr:first-child td:nth-child(3) .slds-truncate");
    _element = new core.ShadowRoot(driver, _element);
    const hasElement = await _element.containsElement(_locator);
    if (!hasElement) { return null; }
    return _element.findElement(_locator);
}

async function _utam_get_firstRowOperation(driver, root) {
    let _element = root;
    const _locator = core.By.css("tbody tr:first-child td:nth-child(4) .slds-truncate");
    _element = new core.ShadowRoot(driver, _element);
    const hasElement = await _element.containsElement(_locator);
    if (!hasElement) { return null; }
    return _element.findElement(_locator);
}

async function _utam_get_firstRowStatus(driver, root) {
    let _element = root;
    const _locator = core.By.css("tbody tr:first-child td:nth-child(5) .status");
    _element = new core.ShadowRoot(driver, _element);
    const hasElement = await _element.containsElement(_locator);
    if (!hasElement) { return null; }
    return _element.findElement(_locator);
}

async function _utam_get_firstRowSize(driver, root) {
    let _element = root;
    const _locator = core.By.css("tbody tr:first-child td:nth-child(6) .status");
    _element = new core.ShadowRoot(driver, _element);
    const hasElement = await _element.containsElement(_locator);
    if (!hasElement) { return null; }
    return _element.findElement(_locator);
}

async function _utam_get_firstRowStartTime(driver, root) {
    let _element = root;
    const _locator = core.By.css("tbody tr:first-child td:nth-child(7) .slds-truncate");
    _element = new core.ShadowRoot(driver, _element);
    const hasElement = await _element.containsElement(_locator);
    if (!hasElement) { return null; }
    return _element.findElement(_locator);
}

async function _utam_get_emptyTableBody(driver, root) {
    let _element = root;
    const _locator = core.By.css("tbody");
    _element = new core.ShadowRoot(driver, _element);
    return _element.findElement(_locator);
}

/**
 * generated from JSON logTable.utam.json
 * @version 2026-05-13T12:00:23.351Z
 * @author UTAM
 */
class LogTable extends core.UtamBasePageObject {
    constructor(driver, element, locator) {
        super(driver, element, locator);
    }

    async __getRoot() {
        const driver = this.driver;
        const root = await this.getRootElement();
        const BaseUtamElement = core.createUtamMixinCtor();
        return new BaseUtamElement(driver, root);
    }
    
    async getTable() {
        const driver = this.driver;
        const root = await this.getRootElement();
        const BaseUtamElement = core.createUtamMixinCtor();
        let element = await _utam_get_table(driver, root);
        element = new BaseUtamElement(driver, element);
        return element;
    }
    
    async getFirstRowViewButton() {
        const driver = this.driver;
        const root = await this.getRootElement();
        const BaseUtamElement = core.createUtamMixinCtor();
        let element = await _utam_get_firstRowViewButton(driver, root);
        if (!element) { return null; }
        element = new BaseUtamElement(driver, element);
        return element;
    }
    
    async getFirstRowDownloadButton() {
        const driver = this.driver;
        const root = await this.getRootElement();
        const BaseUtamElement = core.createUtamMixinCtor();
        let element = await _utam_get_firstRowDownloadButton(driver, root);
        if (!element) { return null; }
        element = new BaseUtamElement(driver, element);
        return element;
    }
    
    async getFirstRowUser() {
        const driver = this.driver;
        const root = await this.getRootElement();
        const BaseUtamElement = core.createUtamMixinCtor();
        let element = await _utam_get_firstRowUser(driver, root);
        if (!element) { return null; }
        element = new BaseUtamElement(driver, element);
        return element;
    }
    
    async getFirstRowOperation() {
        const driver = this.driver;
        const root = await this.getRootElement();
        const BaseUtamElement = core.createUtamMixinCtor();
        let element = await _utam_get_firstRowOperation(driver, root);
        if (!element) { return null; }
        element = new BaseUtamElement(driver, element);
        return element;
    }
    
    async getFirstRowStatus() {
        const driver = this.driver;
        const root = await this.getRootElement();
        const BaseUtamElement = core.createUtamMixinCtor();
        let element = await _utam_get_firstRowStatus(driver, root);
        if (!element) { return null; }
        element = new BaseUtamElement(driver, element);
        return element;
    }
    
    async getFirstRowSize() {
        const driver = this.driver;
        const root = await this.getRootElement();
        const BaseUtamElement = core.createUtamMixinCtor();
        let element = await _utam_get_firstRowSize(driver, root);
        if (!element) { return null; }
        element = new BaseUtamElement(driver, element);
        return element;
    }
    
    async getFirstRowStartTime() {
        const driver = this.driver;
        const root = await this.getRootElement();
        const BaseUtamElement = core.createUtamMixinCtor();
        let element = await _utam_get_firstRowStartTime(driver, root);
        if (!element) { return null; }
        element = new BaseUtamElement(driver, element);
        return element;
    }
    
    async getEmptyTableBody() {
        const driver = this.driver;
        const root = await this.getRootElement();
        const BaseUtamElement = core.createUtamMixinCtor();
        let element = await _utam_get_emptyTableBody(driver, root);
        element = new BaseUtamElement(driver, element);
        return element;
    }
    
}

module.exports = LogTable;
