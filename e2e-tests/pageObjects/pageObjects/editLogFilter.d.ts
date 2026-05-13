
import { Driver as _Driver, Element as _Element, Locator as _Locator, BaseUtamElement as _BaseUtamElement, UtamBasePageObject as _UtamBasePageObject } from '@utam/core';

/**
 * generated from JSON editLogFilter.utam.json
 * @version 2026-05-13T12:00:23.319Z
 * @author UTAM
 */
declare class EditLogFilter extends _UtamBasePageObject {
    constructor(driver: _Driver, element?: _Element, locator?: _Locator);
    getModal(): Promise<(_BaseUtamElement)>;
    getCloseIconButton(): Promise<(_BaseUtamElement)>;
    getHeading(): Promise<(_BaseUtamElement)>;
    getFilterTextarea(): Promise<(_BaseUtamElement)>;
    getCloseButton(): Promise<(_BaseUtamElement)>;
    getSetDefaultButton(): Promise<(_BaseUtamElement)>;
    getSaveButton(): Promise<(_BaseUtamElement)>;
}
export = EditLogFilter;
