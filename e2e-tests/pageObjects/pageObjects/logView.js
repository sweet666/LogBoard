
'use strict';

var core = require('@utam/core');

async function _utam_get_modal(driver, root) {
    let _element = root;
    const _locator = core.By.css("section.slds-modal");
    _element = new core.ShadowRoot(driver, _element);
    return _element.findElement(_locator);
}

async function _utam_get_closeButton(driver, root) {
    let _element = root;
    const _locator = core.By.css("button[title='Cancel']");
    _element = new core.ShadowRoot(driver, _element);
    return _element.findElement(_locator);
}

async function _utam_get_downloadButton(driver, root) {
    let _element = root;
    const _locator = core.By.css("button.slds-button_brand");
    _element = new core.ShadowRoot(driver, _element);
    return _element.findElement(_locator);
}

async function _utam_get_debugOnlyToggle(driver, root) {
    let _element = root;
    const _locator = core.By.css("lightning-input[label='Debug Only']");
    _element = new core.ShadowRoot(driver, _element);
    return _element.findElement(_locator);
}

async function _utam_get_logContent(driver, root) {
    let _element = root;
    const _locator = core.By.css(".log-container lightning-formatted-rich-text");
    _element = new core.ShadowRoot(driver, _element);
    return _element.findElement(_locator);
}

async function _utam_get_backdrop(driver, root) {
    let _element = root;
    const _locator = core.By.css(".slds-backdrop");
    _element = new core.ShadowRoot(driver, _element);
    return _element.findElement(_locator);
}

/**
 * generated from JSON logView.utam.json
 * @version 2026-05-13T12:00:23.356Z
 * @author UTAM
 */
class LogView extends core.UtamBasePageObject {
    constructor(driver, element, locator) {
        super(driver, element, locator);
    }

    async __getRoot() {
        const driver = this.driver;
        const root = await this.getRootElement();
        const BaseUtamElement = core.createUtamMixinCtor();
        return new BaseUtamElement(driver, root);
    }
    
    async getModal() {
        const driver = this.driver;
        const root = await this.getRootElement();
        const BaseUtamElement = core.createUtamMixinCtor();
        let element = await _utam_get_modal(driver, root);
        element = new BaseUtamElement(driver, element);
        return element;
    }
    
    async getCloseButton() {
        const driver = this.driver;
        const root = await this.getRootElement();
        const BaseUtamElement = core.createUtamMixinCtor();
        let element = await _utam_get_closeButton(driver, root);
        element = new BaseUtamElement(driver, element);
        return element;
    }
    
    async getDownloadButton() {
        const driver = this.driver;
        const root = await this.getRootElement();
        const BaseUtamElement = core.createUtamMixinCtor();
        let element = await _utam_get_downloadButton(driver, root);
        element = new BaseUtamElement(driver, element);
        return element;
    }
    
    async getDebugOnlyToggle() {
        const driver = this.driver;
        const root = await this.getRootElement();
        const BaseUtamElement = core.createUtamMixinCtor();
        let element = await _utam_get_debugOnlyToggle(driver, root);
        element = new BaseUtamElement(driver, element);
        return element;
    }
    
    async getLogContent() {
        const driver = this.driver;
        const root = await this.getRootElement();
        const BaseUtamElement = core.createUtamMixinCtor();
        let element = await _utam_get_logContent(driver, root);
        element = new BaseUtamElement(driver, element);
        return element;
    }
    
    async getBackdrop() {
        const driver = this.driver;
        const root = await this.getRootElement();
        const BaseUtamElement = core.createUtamMixinCtor();
        let element = await _utam_get_backdrop(driver, root);
        element = new BaseUtamElement(driver, element);
        return element;
    }
    
}

module.exports = LogView;
