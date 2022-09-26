public class MetadataUtility {

    private static final String BASE_URL = URL.getSalesforceBaseUrl().toExternalForm();
    private static final String  METADATA_NAME = 'self';


    public static List<MetadataHelper.UpsertResult> createRemoteSiteSetting() {
        List<MetadataHelper.Metadata> allMetadataList = new List<MetadataHelper.Metadata>();

        MetadataHelper.RemoteSiteSetting remoteSiteDetails = new MetadataHelper.RemoteSiteSetting();
        remoteSiteDetails.fullName = METADATA_NAME + 'RSS';
        remoteSiteDetails.disableProtocolSecurity  = false;
        remoteSiteDetails.isActive  = true;
        remoteSiteDetails.url = BASE_URL;
        allMetadataList.add(remoteSiteDetails);

        MetadataHelper.MetadataPort service = createService();

        return service.upsertMetadata(allMetadataList);   
    }

    public static List<MetadataHelper.UpsertResult> createTrustedSiteSetting() {
        List<MetadataHelper.Metadata> allMetadataList = new List<MetadataHelper.Metadata>();

        MetadataHelper.CspTrustedSite trustedSiteDetails = new MetadataHelper.CspTrustedSite();
        trustedSiteDetails.fullName = METADATA_NAME + 'TSS';
        trustedSiteDetails.endpointUrl = BASE_URL;
        trustedSiteDetails.isActive = true;
        trustedSiteDetails.isApplicableToConnectSrc = true;
        trustedSiteDetails.isApplicableToFontSrc = true;
        trustedSiteDetails.isApplicableToFrameSrc = true;
        trustedSiteDetails.isApplicableToImgSrc = true;
        trustedSiteDetails.isApplicableToMediaSrc = true;
        trustedSiteDetails.isApplicableToStyleSrc = true;
        allMetadataList.add(trustedSiteDetails);

        MetadataHelper.MetadataPort service = createService();

        return service.upsertMetadata(allMetadataList);
    }

    private static MetadataHelper.MetadataPort createService() { 
        MetadataHelper.MetadataPort service = new MetadataHelper.MetadataPort();
        service.SessionHeader = new MetadataHelper.SessionHeader_element();
        service.SessionHeader.sessionId = Utility.getSessionIdFromVFPage();
        return service;     
    }
}