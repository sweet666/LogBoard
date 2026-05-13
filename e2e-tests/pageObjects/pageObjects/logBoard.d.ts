
import { Driver as _Driver, Element as _Element, Locator as _Locator, BaseUtamElement as _BaseUtamElement, UtamBasePageObject as _UtamBasePageObject } from '@utam/core';
import _LogTable from 'utam-lgb/pageObjects/logTable';
import _LogView from 'utam-lgb/pageObjects/logView';
import _LogSearchResult from 'utam-lgb/pageObjects/logSearchResult';
import _EditLogFilter from 'utam-lgb/pageObjects/editLogFilter';

/**
 * generated from JSON logBoard.utam.json
 * @version 2026-05-13T12:00:23.339Z
 * @author UTAM
 */
declare class LogBoard extends _UtamBasePageObject {
    constructor(driver: _Driver, element?: _Element, locator?: _Locator);
    getSpinner(): Promise<(_BaseUtamElement) | null>;
    getTraceFlagExpiration(): Promise<(_BaseUtamElement)>;
    getEnableButton(): Promise<(_BaseUtamElement) | null>;
    getStopButton(): Promise<(_BaseUtamElement) | null>;
    getDuration1Button(): Promise<(_BaseUtamElement)>;
    getDuration2Button(): Promise<(_BaseUtamElement)>;
    getDuration3Button(): Promise<(_BaseUtamElement)>;
    getDuration5Button(): Promise<(_BaseUtamElement)>;
    getDuration10Button(): Promise<(_BaseUtamElement)>;
    getDeleteLogsButton(): Promise<(_BaseUtamElement)>;
    getRefreshButton(): Promise<(_BaseUtamElement)>;
    getAutoRefreshToggle(): Promise<(_BaseUtamElement)>;
    getSearchInput(): Promise<(_BaseUtamElement)>;
    getSearchButton(): Promise<(_BaseUtamElement)>;
    getUserCombobox(): Promise<(_BaseUtamElement)>;
    getSettingsMenu(): Promise<(_BaseUtamElement)>;
    getLogTable(): Promise<_LogTable>;
    getLogView(): Promise<_LogView | null>;
    getLogSearchResult(): Promise<_LogSearchResult | null>;
    getEditLogFilter(): Promise<_EditLogFilter | null>;
}
export = LogBoard;
