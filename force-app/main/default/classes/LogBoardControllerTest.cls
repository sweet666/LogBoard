@isTest
private class LogBoardControllerTest {

    @isTest
    private static void getDebugLogsTest() {
        List<LogBoardController.Log> logs = LogBoardController.getDebugLogs('');
        System.assertNotEquals(null, logs);
    }

    @isTest
    private static void getActiveTraceFlagTest() {
        Test.setMock(HttpCalloutMock.class, new LogBoardAPIMocks.ActiveTraceFlagMock());

        Test.startTest();
        LogBoardController.TraceFlagRecord activeTrace = LogBoardController.getActiveTraceFlag();
        Test.stopTest();

        System.assertNotEquals(null, activeTrace.ExpirationDate);
    }

    @isTest
    private static void updateTraceFlagTest() {
        Test.setMock(HttpCalloutMock.class, new LogBoardAPIMocks.ActiveTraceFlagMock());
        Integer duration = 5;

        Test.startTest();
        String activeDateTime = LogBoardController.updateTraceFlag('000000000000000AAA', duration);
        Test.stopTest();

        System.assertNotEquals(null, activeDateTime);
    }

    @isTest
    private static void stopTraceFlagTest() {
        Test.setMock(HttpCalloutMock.class, new LogBoardAPIMocks.ActiveTraceFlagMock());
        LogBoardController.stopTraceFlag('000000000000000AAA');
    }

    @isTest
    private static void deleteDebugLogs() {
        Test.setMock(HttpCalloutMock.class, new LogBoardAPIMocks.LogBodyMock());
        LogBoardController.deleteDebugLogs();
    }

    @isTest
    private static void insertUserTraceFlagTest() {
        LogBoardController.TraceFlagRecord trace = LogBoardController.insertUserTraceFlag();
        System.assertNotEquals(null, trace.Id);
    }

    @isTest
    private static void saveLogFilterTest() {
        Test.startTest();
        LogBoardController.Response resp = LogBoardController.saveLogFilter(
            Utility.DEFAULT_FILTER
        );
        Test.stopTest();

        System.assert(resp.isSuccess);
        System.assert(Log_Board_Settings__c.getOrgDefaults().Log_Filter__c == Utility.DEFAULT_FILTER);
    }

    @isTest
    private static void saveLogFilterEmptyTest() {
        Test.startTest();
        LogBoardController.Response resp = LogBoardController.saveLogFilter('');
        Test.stopTest();

        System.assert(resp.isSuccess);
        System.assert(Log_Board_Settings__c.getOrgDefaults().Log_Filter__c == null);
    }

    @isTest
    private static void saveLogFilterNegativeTest() {
        Test.startTest();
        LogBoardController.Response resp = LogBoardController.saveLogFilter('invalid');
        Test.stopTest();

        System.assert(!resp.isSuccess);
        System.assert(resp.error != null);
    }

}
