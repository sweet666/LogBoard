
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
    const _locator = core.By.css("button.slds-modal__close");
    _element = new core.ShadowRoot(driver, _element);
    return _element.findElement(_locator);
}

async function _utam_get_heading(driver, root) {
    let _element = root;
    const _locator = core.By.css("h2#modal-heading-01");
    _element = new core.ShadowRoot(driver, _element);
    return _element.findElement(_locator);
}

async function _utam_get_searchContent(driver, root) {
    let _element = root;
    const _locator = core.By.css(".log-container lightning-formatted-rich-text");
    _element = new core.ShadowRoot(driver, _element);
    return _element.findElement(_locator);
}

async function _utam_get_openFullLogButton(driver, root) {
    let _element = root;
    const _locator = core.By.css("button.slds-button_brand");
    _element = new core.ShadowRoot(driver, _element);
    return _element.findElement(_locator);
}

async function _utam_get_previousButton(driver, root) {
    let _element = root;
    const _locator = core.By.css("footer button:nth-child(2)");
    _element = new core.ShadowRoot(driver, _element);
    return _element.findElement(_locator);
}

async function _utam_get_nextButton(driver, root) {
    let _element = root;
    const _locator = core.By.css("footer button:nth-child(3)");
    _element = new core.ShadowRoot(driver, _element);
    return _element.findElement(_locator);
}

/**
 * generated from JSON logSearchResult.utam.json
 * @version 2026-05-13T12:00:23.347Z
 * @author UTAM
 */
class LogSearchResult extends core.UtamBasePageObject {
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
    
    async getHeading() {
        const driver = this.driver;
        const root = await this.getRootElement();
        const BaseUtamElement = core.createUtamMixinCtor();
        let element = await _utam_get_heading(driver, root);
        element = new BaseUtamElement(driver, element);
        return element;
    }
    
    async getSearchContent() {
        const driver = this.driver;
        const root = await this.getRootElement();
        const BaseUtamElement = core.createUtamMixinCtor();
        let element = await _utam_get_searchContent(driver, root);
        element = new BaseUtamElement(driver, element);
        return element;
    }
    
    async getOpenFullLogButton() {
        const driver = this.driver;
        const root = await this.getRootElement();
        const BaseUtamElement = core.createUtamMixinCtor();
        let element = await _utam_get_openFullLogButton(driver, root);
        element = new BaseUtamElement(driver, element);
        return element;
    }
    
    async getPreviousButton() {
        const driver = this.driver;
        const root = await this.getRootElement();
        const BaseUtamElement = core.createUtamMixinCtor();
        let element = await _utam_get_previousButton(driver, root);
        element = new BaseUtamElement(driver, element);
        return element;
    }
    
    async getNextButton() {
        const driver = this.driver;
        const root = await this.getRootElement();
        const BaseUtamElement = core.createUtamMixinCtor();
        let element = await _utam_get_nextButton(driver, root);
        element = new BaseUtamElement(driver, element);
        return element;
    }
    
}

module.exports = LogSearchResult;
