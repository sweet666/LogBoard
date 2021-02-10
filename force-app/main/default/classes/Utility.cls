public class Utility {

    public static String getSessionIdFromVFPage() {
        if(!Test.isRunningTest()) {
            String SESSION_ID_START = 'SESSION_ID_START';
            String SESSION_ID_END = 'SESSION_ID_END';
            String pageContent = Page.SessionIdPage.getContent().toString();
            Integer startIndex = pageContent.indexOf(SESSION_ID_START) + SESSION_ID_START.length();
            Integer endIndex = pageContent.indexOf(SESSION_ID_END);
            return pageContent.substring(startIndex, endIndex);
        } else {
            return UserInfo.getUserId();
        }
    }
}
