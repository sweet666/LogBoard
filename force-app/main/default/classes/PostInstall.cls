@SuppressWarnings('PMD.AvoidGlobalModifier')
global class PostInstall implements InstallHandler {
    global void onInstall(InstallContext context) {
        Utility.createLogBoardSettings();
    }
}
