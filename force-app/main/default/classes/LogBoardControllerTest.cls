@isTest
private class LogBoardControllerTest {

    @isTest
    private static void getDebugLogsTest() {
        List<LogBoardController.Log> logs = LogBoardController.getDebugLogs('');
        System.assertNotEquals(null, logs, 'Log list can not be null');
    }

    @isTest
    private static void getActiveTraceFlagTest() {
        Test.setMock(HttpCalloutMock.class, new LogBoardAPIMocks.ActiveTraceFlagMock());

        Test.startTest();
        LogBoardController.TraceFlagRecord activeTrace = LogBoardController.getActiveTraceFlag('current');
        Test.stopTest();

        System.assertNotEquals(null, activeTrace.ExpirationDate, 'Expiration Date should be null');
    }

    @isTest
    private static void updateTraceFlagTest() {
        Test.setMock(HttpCalloutMock.class, new LogBoardAPIMocks.ActiveTraceFlagMock());
        Integer duration = 5;

        Test.startTest();
        String activeDateTime = LogBoardController.updateTraceFlag(LogBoardController.generateUUID(), duration);
        Test.stopTest();

        System.assertNotEquals(null, activeDateTime, 'Trace flag should be active');
    }

    @isTest
    private static void stopTraceFlagTest() {
        Test.setMock(HttpCalloutMock.class, new LogBoardAPIMocks.ActiveTraceFlagMock());

        Test.startTest();
        LogBoardController.Response resp =  LogBoardController.stopTraceFlag(LogBoardController.generateUUID());
        Test.stopTest();

        System.assert(resp.isSuccess, 'Response should have success status');
    }

    @isTest
    private static void getLogBodyCalloutParamsTest() {
        Test.startTest();
        LogBoardController.CalloutParams params = LogBoardController.getLogBodyCalloutParams();
        Test.stopTest();

        System.assert(params.url != null, 'URL should not be null');
        System.assert(params.authorization != null, 'token should not be null');
    }

    @isTest
    private static void insertUserTraceFlagTest() {
        LogBoardController.TraceFlagRecord trace = LogBoardController.insertUserTraceFlag(LogBoardController.generateUUID());
        System.assertNotEquals(null, trace.Id, 'Trace flag Id can not be null');
    }

    @isTest
    private static void saveLogFilterTest() {
        Test.startTest();
        LogBoardController.Response resp = LogBoardController.saveLogFilter(
            Utility.DEFAULT_FILTER
        );
        Test.stopTest();

        System.assert(resp.isSuccess, 'Response should be success');
        System.assert(Log_Board_Settings__c.getOrgDefaults().Log_Filter__c == Utility.DEFAULT_FILTER, 'Filter should have default value');

        String filter = LogBoardController.getLogFilter();
        System.assert(filter == Utility.DEFAULT_FILTER, 'Filter should have default value');
    }

    @isTest
    private static void saveLogFilterEmptyTest() {
        Test.startTest();
        LogBoardController.Response resp = LogBoardController.saveLogFilter('');
        Test.stopTest();

        System.assert(resp.isSuccess, 'Response should have success status');
        System.assert(Log_Board_Settings__c.getOrgDefaults().Log_Filter__c == null, 'Filter should be null');
    }

    @isTest
    private static void saveLogFilterNegativeTest() {
        Test.startTest();
        LogBoardController.Response resp = LogBoardController.saveLogFilter('invalid');
        Test.stopTest();

        System.assert(!resp.isSuccess, 'Response should have non-success status');
        System.assert(resp.error != null, 'Error message should not be empty');
    }
}
