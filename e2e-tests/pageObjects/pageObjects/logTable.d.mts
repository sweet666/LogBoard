
import { Driver as _Driver, Element as _Element, Locator as _Locator, BaseUtamElement as _BaseUtamElement, UtamBasePageObject as _UtamBasePageObject } from '@utam/core';

/**
 * generated from JSON logTable.utam.json
 * @version 2026-05-13T12:00:23.351Z
 * @author UTAM
 */
export default class LogTable extends _UtamBasePageObject {
    constructor(driver: _Driver, element?: _Element, locator?: _Locator);
    getTable(): Promise<(_BaseUtamElement)>;
    getFirstRowViewButton(): Promise<(_BaseUtamElement) | null>;
    getFirstRowDownloadButton(): Promise<(_BaseUtamElement) | null>;
    getFirstRowUser(): Promise<(_BaseUtamElement) | null>;
    getFirstRowOperation(): Promise<(_BaseUtamElement) | null>;
    getFirstRowStatus(): Promise<(_BaseUtamElement) | null>;
    getFirstRowSize(): Promise<(_BaseUtamElement) | null>;
    getFirstRowStartTime(): Promise<(_BaseUtamElement) | null>;
    getEmptyTableBody(): Promise<(_BaseUtamElement)>;
}