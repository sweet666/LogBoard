@isTest
private class MetadataUtilityTest {

    @isTest
    private static void createRemoteSiteSettingTest() {
        Test.setMock(WebServiceMock.class, new MetadataHelperMock());
        Test.startTest();
        List<MetadataHelper.UpsertResult> rSSResult = MetadataUtility.createRemoteSiteSetting();
        Test.stopTest();
        System.assert(rSSResult != null, 'Upsert result is empty');
    }

    @isTest
    private static void createTrustedSiteSettingTest() {
        Test.setMock(WebServiceMock.class, new MetadataHelperMock());
        Test.startTest();
        List<MetadataHelper.UpsertResult> tSSResult = MetadataUtility.createTrustedSiteSetting();
        Test.stopTest();
        System.assert(tSSResult != null, 'Upsert result is empty');
    }
}