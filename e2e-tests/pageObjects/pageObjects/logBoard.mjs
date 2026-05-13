
import { By as _By, ShadowRoot as _ShadowRoot, createUtamMixinCtor as _createUtamMixinCtor, createInstance as _createInstance, UtamBasePageObject as _UtamBasePageObject } from '@utam/core';
import _LogTable from 'utam-lgb/pageObjects/logTable';
import _LogView from 'utam-lgb/pageObjects/logView';
import _LogSearchResult from 'utam-lgb/pageObjects/logSearchResult';
import _EditLogFilter from 'utam-lgb/pageObjects/editLogFilter';

async function _utam_get_spinner(driver, root) {
    let _element = root;
    const _locator = _By.css("lightning-spinner");
    _element = new _ShadowRoot(driver, _element);
    const hasElement = await _element.containsElement(_locator);
    if (!hasElement) { return null; }
    return _element.findElement(_locator);
}

async function _utam_get_traceFlagExpiration(driver, root) {
    let _element = root;
    const _locator = _By.css(".header-block.exparation");
    _element = new _ShadowRoot(driver, _element);
    return _element.findElement(_locator);
}

async function _utam_get_enableButton(driver, root) {
    let _element = root;
    const _locator = _By.css("lightning-button[name='EnableLogs']");
    _element = new _ShadowRoot(driver, _element);
    const hasElement = await _element.containsElement(_locator);
    if (!hasElement) { return null; }
    return _element.findElement(_locator);
}

async function _utam_get_stopButton(driver, root) {
    let _element = root;
    const _locator = _By.css("lightning-button[name='StopLogs']");
    _element = new _ShadowRoot(driver, _element);
    const hasElement = await _element.containsElement(_locator);
    if (!hasElement) { return null; }
    return _element.findElement(_locator);
}

async function _utam_get_duration1Button(driver, root) {
    let _element = root;
    const _locator = _By.css("button[data-id='1']");
    _element = new _ShadowRoot(driver, _element);
    return _element.findElement(_locator);
}

async function _utam_get_duration2Button(driver, root) {
    let _element = root;
    const _locator = _By.css("button[data-id='2']");
    _element = new _ShadowRoot(driver, _element);
    return _element.findElement(_locator);
}

async function _utam_get_duration3Button(driver, root) {
    let _element = root;
    const _locator = _By.css("button[data-id='3']");
    _element = new _ShadowRoot(driver, _element);
    return _element.findElement(_locator);
}

async function _utam_get_duration5Button(driver, root) {
    let _element = root;
    const _locator = _By.css("button[data-id='5']");
    _element = new _ShadowRoot(driver, _element);
    return _element.findElement(_locator);
}

async function _utam_get_duration10Button(driver, root) {
    let _element = root;
    const _locator = _By.css("button[data-id='10']");
    _element = new _ShadowRoot(driver, _element);
    return _element.findElement(_locator);
}

async function _utam_get_deleteLogsButton(driver, root) {
    let _element = root;
    const _locator = _By.css("lightning-button-icon[title='Delete All Logs']");
    _element = new _ShadowRoot(driver, _element);
    return _element.findElement(_locator);
}

async function _utam_get_refreshButton(driver, root) {
    let _element = root;
    const _locator = _By.css("lightning-button-icon[title='Refresh']");
    _element = new _ShadowRoot(driver, _element);
    return _element.findElement(_locator);
}

async function _utam_get_autoRefreshToggle(driver, root) {
    let _element = root;
    const _locator = _By.css("lightning-input[data-id='autorefresh-toggle']");
    _element = new _ShadowRoot(driver, _element);
    return _element.findElement(_locator);
}

async function _utam_get_searchInput(driver, root) {
    let _element = root;
    const _locator = _By.css("lightning-input[data-id='search-input']");
    _element = new _ShadowRoot(driver, _element);
    return _element.findElement(_locator);
}

async function _utam_get_searchButton(driver, root) {
    let _element = root;
    const _locator = _By.css("lightning-button-icon[title='Search']");
    _element = new _ShadowRoot(driver, _element);
    return _element.findElement(_locator);
}

async function _utam_get_userCombobox(driver, root) {
    let _element = root;
    const _locator = _By.css("lightning-combobox");
    _element = new _ShadowRoot(driver, _element);
    return _element.findElement(_locator);
}

async function _utam_get_settingsMenu(driver, root) {
    let _element = root;
    const _locator = _By.css("lightning-button-menu");
    _element = new _ShadowRoot(driver, _element);
    return _element.findElement(_locator);
}

async function _utam_get_logTable(driver, root) {
    let _element = root;
    const _locator = _By.css("c-log-table");
    _element = new _ShadowRoot(driver, _element);
    return _element.findElement(_locator);
}

async function _utam_get_logView(driver, root) {
    let _element = root;
    const _locator = _By.css("c-log-view");
    _element = new _ShadowRoot(driver, _element);
    const hasElement = await _element.containsElement(_locator);
    if (!hasElement) { return null; }
    return _element.findElement(_locator);
}

async function _utam_get_logSearchResult(driver, root) {
    let _element = root;
    const _locator = _By.css("c-log-search-result");
    _element = new _ShadowRoot(driver, _element);
    const hasElement = await _element.containsElement(_locator);
    if (!hasElement) { return null; }
    return _element.findElement(_locator);
}

async function _utam_get_editLogFilter(driver, root) {
    let _element = root;
    const _locator = _By.css("c-edit-log-filter");
    _element = new _ShadowRoot(driver, _element);
    const hasElement = await _element.containsElement(_locator);
    if (!hasElement) { return null; }
    return _element.findElement(_locator);
}

/**
 * generated from JSON logBoard.utam.json
 * @version 2026-05-13T12:00:23.339Z
 * @author UTAM
 */
export default class LogBoard extends _UtamBasePageObject {
    constructor(driver, element, locator) {
        super(driver, element, locator);
    }

    async __getRoot() {
        const driver = this.driver;
        const root = await this.getRootElement();
        const BaseUtamElement = _createUtamMixinCtor();
        return new BaseUtamElement(driver, root);
    }
    
    async getSpinner() {
        const driver = this.driver;
        const root = await this.getRootElement();
        const BaseUtamElement = _createUtamMixinCtor();
        let element = await _utam_get_spinner(driver, root);
        if (!element) { return null; }
        element = new BaseUtamElement(driver, element);
        return element;
    }
    
    async getTraceFlagExpiration() {
        const driver = this.driver;
        const root = await this.getRootElement();
        const BaseUtamElement = _createUtamMixinCtor();
        let element = await _utam_get_traceFlagExpiration(driver, root);
        element = new BaseUtamElement(driver, element);
        return element;
    }
    
    async getEnableButton() {
        const driver = this.driver;
        const root = await this.getRootElement();
        const BaseUtamElement = _createUtamMixinCtor();
        let element = await _utam_get_enableButton(driver, root);
        if (!element) { return null; }
        element = new BaseUtamElement(driver, element);
        return element;
    }
    
    async getStopButton() {
        const driver = this.driver;
        const root = await this.getRootElement();
        const BaseUtamElement = _createUtamMixinCtor();
        let element = await _utam_get_stopButton(driver, root);
        if (!element) { return null; }
        element = new BaseUtamElement(driver, element);
        return element;
    }
    
    async getDuration1Button() {
        const driver = this.driver;
        const root = await this.getRootElement();
        const BaseUtamElement = _createUtamMixinCtor();
        let element = await _utam_get_duration1Button(driver, root);
        element = new BaseUtamElement(driver, element);
        return element;
    }
    
    async getDuration2Button() {
        const driver = this.driver;
        const root = await this.getRootElement();
        const BaseUtamElement = _createUtamMixinCtor();
        let element = await _utam_get_duration2Button(driver, root);
        element = new BaseUtamElement(driver, element);
        return element;
    }
    
    async getDuration3Button() {
        const driver = this.driver;
        const root = await this.getRootElement();
        const BaseUtamElement = _createUtamMixinCtor();
        let element = await _utam_get_duration3Button(driver, root);
        element = new BaseUtamElement(driver, element);
        return element;
    }
    
    async getDuration5Button() {
        const driver = this.driver;
        const root = await this.getRootElement();
        const BaseUtamElement = _createUtamMixinCtor();
        let element = await _utam_get_duration5Button(driver, root);
        element = new BaseUtamElement(driver, element);
        return element;
    }
    
    async getDuration10Button() {
        const driver = this.driver;
        const root = await this.getRootElement();
        const BaseUtamElement = _createUtamMixinCtor();
        let element = await _utam_get_duration10Button(driver, root);
        element = new BaseUtamElement(driver, element);
        return element;
    }
    
    async getDeleteLogsButton() {
        const driver = this.driver;
        const root = await this.getRootElement();
        const BaseUtamElement = _createUtamMixinCtor();
        let element = await _utam_get_deleteLogsButton(driver, root);
        element = new BaseUtamElement(driver, element);
        return element;
    }
    
    async getRefreshButton() {
        const driver = this.driver;
        const root = await this.getRootElement();
        const BaseUtamElement = _createUtamMixinCtor();
        let element = await _utam_get_refreshButton(driver, root);
        element = new BaseUtamElement(driver, element);
        return element;
    }
    
    async getAutoRefreshToggle() {
        const driver = this.driver;
        const root = await this.getRootElement();
        const BaseUtamElement = _createUtamMixinCtor();
        let element = await _utam_get_autoRefreshToggle(driver, root);
        element = new BaseUtamElement(driver, element);
        return element;
    }
    
    async getSearchInput() {
        const driver = this.driver;
        const root = await this.getRootElement();
        const BaseUtamElement = _createUtamMixinCtor();
        let element = await _utam_get_searchInput(driver, root);
        element = new BaseUtamElement(driver, element);
        return element;
    }
    
    async getSearchButton() {
        const driver = this.driver;
        const root = await this.getRootElement();
        const BaseUtamElement = _createUtamMixinCtor();
        let element = await _utam_get_searchButton(driver, root);
        element = new BaseUtamElement(driver, element);
        return element;
    }
    
    async getUserCombobox() {
        const driver = this.driver;
        const root = await this.getRootElement();
        const BaseUtamElement = _createUtamMixinCtor();
        let element = await _utam_get_userCombobox(driver, root);
        element = new BaseUtamElement(driver, element);
        return element;
    }
    
    async getSettingsMenu() {
        const driver = this.driver;
        const root = await this.getRootElement();
        const BaseUtamElement = _createUtamMixinCtor();
        let element = await _utam_get_settingsMenu(driver, root);
        element = new BaseUtamElement(driver, element);
        return element;
    }
    
    async getLogTable() {
        const driver = this.driver;
        const root = await this.getRootElement();
        let element = await _utam_get_logTable(driver, root);
        element = await _createInstance(_LogTable, driver, element);
        await element.__beforeLoad__();
        return element;
    }
    
    async getLogView() {
        const driver = this.driver;
        const root = await this.getRootElement();
        let element = await _utam_get_logView(driver, root);
        if (!element) { return null; }
        element = await _createInstance(_LogView, driver, element);
        await element.__beforeLoad__();
        return element;
    }
    
    async getLogSearchResult() {
        const driver = this.driver;
        const root = await this.getRootElement();
        let element = await _utam_get_logSearchResult(driver, root);
        if (!element) { return null; }
        element = await _createInstance(_LogSearchResult, driver, element);
        await element.__beforeLoad__();
        return element;
    }
    
    async getEditLogFilter() {
        const driver = this.driver;
        const root = await this.getRootElement();
        let element = await _utam_get_editLogFilter(driver, root);
        if (!element) { return null; }
        element = await _createInstance(_EditLogFilter, driver, element);
        await element.__beforeLoad__();
        return element;
    }
    
}