
'use strict';

var core = require('@utam/core');

async function _utam_get_modal(driver, root) {
    let _element = root;
    const _locator = core.By.css("section.slds-modal");
    _element = new core.ShadowRoot(driver, _element);
    return _element.findElement(_locator);
}

async function _utam_get_closeIconButton(driver, root) {
    let _element = root;
    const _locator = core.By.css("header button.slds-modal__close");
    _element = new core.ShadowRoot(driver, _element);
    return _element.findElement(_locator);
}

async function _utam_get_heading(driver, root) {
    let _element = root;
    const _locator = core.By.css("h2#modal-heading-01");
    _element = new core.ShadowRoot(driver, _element);
    return _element.findElement(_locator);
}

async function _utam_get_filterTextarea(driver, root) {
    let _element = root;
    const _locator = core.By.css("lightning-textarea[name='filter']");
    _element = new core.ShadowRoot(driver, _element);
    return _element.findElement(_locator);
}

async function _utam_get_closeButton(driver, root) {
    let _element = root;
    const _locator = core.By.css("footer button.slds-button_neutral:first-child");
    _element = new core.ShadowRoot(driver, _element);
    return _element.findElement(_locator);
}

async function _utam_get_setDefaultButton(driver, root) {
    let _element = root;
    const _locator = core.By.css("footer button.slds-button_neutral:nth-child(2)");
    _element = new core.ShadowRoot(driver, _element);
    return _element.findElement(_locator);
}

async function _utam_get_saveButton(driver, root) {
    let _element = root;
    const _locator = core.By.css("footer button.slds-button_brand");
    _element = new core.ShadowRoot(driver, _element);
    return _element.findElement(_locator);
}

/**
 * generated from JSON editLogFilter.utam.json
 * @version 2026-05-13T12:00:23.319Z
 * @author UTAM
 */
class EditLogFilter extends core.UtamBasePageObject {
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
    
    async getCloseIconButton() {
        const driver = this.driver;
        const root = await this.getRootElement();
        const BaseUtamElement = core.createUtamMixinCtor();
        let element = await _utam_get_closeIconButton(driver, root);
        element = new BaseUtamElement(driver, element);
        return element;
    }
    
    async getHeading() {
        const driver = this.driver;
        const root = await this.getRootElement();
        const BaseUtamElement = core.createUtamMixinCtor();
        let element = await _utam_get_heading(driver, root);
        element = new BaseUtamElement(driver, element);
        return element;
    }
    
    async getFilterTextarea() {
        const driver = this.driver;
        const root = await this.getRootElement();
        const BaseUtamElement = core.createUtamMixinCtor();
        let element = await _utam_get_filterTextarea(driver, root);
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
    
    async getSetDefaultButton() {
        const driver = this.driver;
        const root = await this.getRootElement();
        const BaseUtamElement = core.createUtamMixinCtor();
        let element = await _utam_get_setDefaultButton(driver, root);
        element = new BaseUtamElement(driver, element);
        return element;
    }
    
    async getSaveButton() {
        const driver = this.driver;
        const root = await this.getRootElement();
        const BaseUtamElement = core.createUtamMixinCtor();
        let element = await _utam_get_saveButton(driver, root);
        element = new BaseUtamElement(driver, element);
        return element;
    }
    
}

module.exports = EditLogFilter;
