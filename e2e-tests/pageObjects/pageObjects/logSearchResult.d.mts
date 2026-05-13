
import { Driver as _Driver, Element as _Element, Locator as _Locator, BaseUtamElement as _BaseUtamElement, UtamBasePageObject as _UtamBasePageObject } from '@utam/core';

/**
 * generated from JSON logSearchResult.utam.json
 * @version 2026-05-13T12:00:23.347Z
 * @author UTAM
 */
export default class LogSearchResult extends _UtamBasePageObject {
    constructor(driver: _Driver, element?: _Element, locator?: _Locator);
    getModal(): Promise<(_BaseUtamElement)>;
    getCloseButton(): Promise<(_BaseUtamElement)>;
    getHeading(): Promise<(_BaseUtamElement)>;
    getSearchContent(): Promise<(_BaseUtamElement)>;
    getOpenFullLogButton(): Promise<(_BaseUtamElement)>;
    getPreviousButton(): Promise<(_BaseUtamElement)>;
    getNextButton(): Promise<(_BaseUtamElement)>;
}