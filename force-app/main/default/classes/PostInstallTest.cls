@isTest
private class PostInstallTest {
    
    @isTest
    private static void postInstallScriptTest() {
        PostInstall postInstall = new PostInstall();
        Test.testInstall(postInstall, null);
    }
}
