@isTest
private class PostInstallClassTest {

    @isTest
    private static void installTest() {
        PostInstall postInstall = new PostInstall();
        Test.testInstall(postinstall, null);

        System.assert(Log_Board_Settings__c.getOrgDefaults() != null);
        System.assert(Log_Board_Settings__c.getOrgDefaults().Log_Filter__c != null);
    }
    
}