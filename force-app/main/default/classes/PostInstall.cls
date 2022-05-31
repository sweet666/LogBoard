global class PostInstall implements InstallHandler {
    global void onInstall(InstallContext context) {
        MetadataAPIUtility.createRemoteSiteSetting();
        MetadataAPIUtility.createTrustedSiteSetting();
    }
}
