@IsTest
private class MetadataHelperTest {
    // method is used to cover WSDL class. No asserts needed
    @SuppressWarnings('PMD.ApexUnitTestClassShouldHaveAsserts')
    @IsTest
    private static void coverTest() {
        new MetadataHelper.RemoteSiteSetting();
        new MetadataHelper.CspTrustedSite();
        new MetadataHelper.ReadRemoteSiteSettingResult();
        new MetadataHelper.readRemoteSiteSettingResponse_element();
        new MetadataHelper.ReadCspTrustedSiteResult();
        new MetadataHelper.readCspTrustedSiteResponse_element();
        new MetadataHelper.upsertMetadataResponse_element();
        new MetadataHelper.upsertMetadata_element();
        new MetadataHelper.DebuggingHeader_element();
        new MetadataHelper.CallOptions_element();
        new MetadataHelper.DebuggingInfo_element();
        new MetadataHelper.AllOrNoneHeader_element();
        new MetadataHelper.Error();
        new MetadataHelper.ExtendedErrorDetails();
        new MetadataHelper.LogInfo();
    }
}