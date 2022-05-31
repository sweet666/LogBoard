global class MetadataAPIUtility {

    private static final String BASE_URL = URL.getSalesforceBaseUrl().toExternalForm();
    private static final String  METADATA_NAME = 'self';


    global static void createRemoteSiteSetting() {
        List<MetadataService.Metadata> allMetadataList = new List<MetadataService.Metadata>();

        MetadataService.RemoteSiteSetting remoteSiteDetails = new MetadataService.RemoteSiteSetting();
        remoteSiteDetails.fullName = METADATA_NAME;
        remoteSiteDetails.disableProtocolSecurity  = false;
        remoteSiteDetails.isActive  = true;
        remoteSiteDetails.url = BASE_URL;
        allMetadataList.add(remoteSiteDetails);

        MetadataService.MetadataPort service = createService();
        List<MetadataService.UpsertResult> results = service.upsertMetadata(allMetadataList);
    }

    global static void createTrustedSiteSetting() {
        List<MetadataService.Metadata> allMetadataList = new List<MetadataService.Metadata>();

        MetadataService.CspTrustedSite trustedSiteDetails = new MetadataService.CspTrustedSite();
        trustedSiteDetails.fullName = METADATA_NAME;
        trustedSiteDetails.endpointUrl = BASE_URL;
        trustedSiteDetails.isActive = true;
        trustedSiteDetails.isApplicableToConnectSrc = true;
        trustedSiteDetails.isApplicableToFontSrc = true;
        trustedSiteDetails.isApplicableToFrameSrc = true;
        trustedSiteDetails.isApplicableToImgSrc = true;
        trustedSiteDetails.isApplicableToMediaSrc = true;
        trustedSiteDetails.isApplicableToStyleSrc = true;
        allMetadataList.add(trustedSiteDetails);

        MetadataService.MetadataPort service = createService();
        List<MetadataService.UpsertResult> results = service.upsertMetadata(allMetadataList);
    }
    
    private static MetadataService.MetadataPort createService() { 
        MetadataService.MetadataPort service = new MetadataService.MetadataPort();
        service.SessionHeader = new MetadataService.SessionHeader_element();
        service.SessionHeader.sessionId = UserInfo.getSessionId();
        return service;     
    }
}
