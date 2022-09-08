@isTest
private class MetadataUtilityTest {

    @isTest
    private static void createRemoteSiteSettingTest() {
        Test.startTest();
        List<MetadataHelper.UpsertResult> rSSResult = MetadataUtility.createRemoteSiteSetting();
        Test.stopTest();
        System.assert(rSSResult != null);
    }

    @isTest
    private static void createTrustedSiteSettingTest() {
        Test.startTest();
        List<MetadataHelper.UpsertResult> tSSResult = MetadataUtility.createTrustedSiteSetting();
        Test.stopTest();
        System.assert(tSSResult != null);
    }
}