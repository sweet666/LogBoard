public with sharing class Utility {
    public static final String DEFAULT_FILTER = 'Operation != \'/apex/lgb__sessionidpage\' AND LogLength > 1800';

    private static final  String SESSION_ID_START = 'SESSION_ID_START';
    private static final String SESSION_ID_END = 'SESSION_ID_END';

    public static String getSessionIdFromVFPage() {
        if(!Test.isRunningTest()) {
            String pageContent = Page.SessionIdPage.getContent().toString();
            Integer startIndex = pageContent.indexOf(SESSION_ID_START) + SESSION_ID_START.length();
            Integer endIndex = pageContent.indexOf(SESSION_ID_END);
            return pageContent.substring(startIndex, endIndex);
        } else {
            return UserInfo.getUserId();
        }
    }

    // CRUD check is not needed for custom setting
    @SuppressWarnings('PMD.ApexCRUDViolation')
    public static void createLogBoardSettings() {
        Log_Board_Settings__c setting = new Log_Board_Settings__c();
        setting.SetupOwnerId = UserInfo.getOrganizationId();
        setting.Log_Filter__c = DEFAULT_FILTER;
        insert setting;
    }
}
