public class HttpHelper {

    private Http http;
    private HttpRequest request;
    private static final String SESSION_ID = Utility.getSessionIdFromVFPage();

    // Session Id auth type is used instead of Named Credentials
    // to avoid create Named Credentials package post-install step
    @SuppressWarnings('PMD.ApexSuggestUsingNamedCred')
    public HttpHelper(String authType, String method) {
        http = new Http();
        request = new HttpRequest();
        request.setHeader('Content-Type', 'application/json');
        request.setHeader('Authorization', + authType + ' ' + SESSION_ID);
        request.setMethod(method);
    }

    public void setEndpoint(String endPoint) {
        request.setEndpoint(endPoint);
    }

    public void setBody(String body) {
        request.setBody(body);
    }

    public HttpResponse send() {
        return http.send(request);
    }
}
