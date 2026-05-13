
import { Driver as _Driver, Element as _Element, Locator as _Locator, BaseUtamElement as _BaseUtamElement, UtamBasePageObject as _UtamBasePageObject } from '@utam/core';

/**
 * generated from JSON logView.utam.json
 * @version 2026-05-13T12:00:23.356Z
 * @author UTAM
 */
declare class LogView extends _UtamBasePageObject {
    constructor(driver: _Driver, element?: _Element, locator?: _Locator);
    getModal(): Promise<(_BaseUtamElement)>;
    getCloseButton(): Promise<(_BaseUtamElement)>;
    getDownloadButton(): Promise<(_BaseUtamElement)>;
    getDebugOnlyToggle(): Promise<(_BaseUtamElement)>;
    getLogContent(): Promise<(_BaseUtamElement)>;
    getBackdrop(): Promise<(_BaseUtamElement)>;
}
export = LogView;
