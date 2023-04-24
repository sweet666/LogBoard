public with sharing class LogBoardController {

    private static final String ORG_URL = URL.getSalesforceBaseUrl().toExternalForm();
    private static final String TOOLING_API_URI = '/services/data/v47.0/tooling';
    private static final String TRACE_UPDATE_QUERY = '/sobjects/TraceFlag/{0}';
    private static final String TRACE_DATE_FORMAT = 'yyyy-MM-dd\'T\'HH:mm:ss.SSSXXX';
    private static final String LOG_BODY_QUERY = '/sobjects/ApexLog/{0}/Body/';
    private static final String LOG_QUERY = '/services/data/v44.0/sobjects/Apexlog/';
    
    @AuraEnabled(cacheable=true)
    public static TraceFlagRecord getActiveTraceFlag() {
        Boolean isActive = false;
        TraceFlagRecord activeFlag;

        HttpHelper request = new HttpHelper('OAuth', 'GET');
        String query = 'SELECT Id, ExpirationDate, TracedEntityId FROM TraceFlag WHERE LogType = \'USER_DEBUG\' AND TracedEntityId =\'' +
            UserInfo.getUserId() + '\'';
        query = query.replace(' ','+');
        request.setEndpoint(ORG_URL + TOOLING_API_URI + '/query?q=' + query);
        HttpResponse response = request.send();

        if (response.getStatusCode() == 200) {
            TraceFlagResponse traceFlags = (TraceFlagResponse)JSON.deserialize(response.getBody(), TraceFlagResponse.class);
            if (traceFlags.records != null && !traceFlags.records.isEmpty()) {
                for (TraceFlagRecord trace : traceFlags.records) {
                    activeFlag = trace;
                    if (trace.ExpirationDate > System.now()) {
                        isActive = true;
                        break;
                    }
                }
            } else {
                activeFlag = insertUserTraceFlag();
                isActive = false;
            }
        } else {
            throw new AuraHandledException(response.getBody());
        }

        if (!isActive) {
            activeFlag.ExpirationDate = null;
        }
        return activeFlag;
    }

    @AuraEnabled(cacheable=false)
    public static String updateTraceFlag(String traceId, Integer duration) {
        String endDate = System.now().addMinutes(duration).format(TRACE_DATE_FORMAT);
        String traceRecordBody = getTraceRecordBody(endDate);
        String traceRecordPath = String.format(TRACE_UPDATE_QUERY, new List<String> {traceId});

        HttpHelper request = new HttpHelper('OAuth', 'PATCH');
        request.setBody(traceRecordBody);
        request.setEndpoint(ORG_URL + TOOLING_API_URI + traceRecordPath);
        HttpResponse response = request.send();

        if (response.getStatusCode() < 200 && response.getStatusCode() >= 300) {
            throw new AuraHandledException(response.getBody());
        }

        return endDate;
    }

    @AuraEnabled(cacheable=false)
    public static Response stopTraceFlag(String traceId) {
        Response result = new Response();
        result.isSuccess = true;

        String endDate = System.now().addSeconds(2).format(TRACE_DATE_FORMAT);
        String traceRecordBody = getTraceRecordBody(endDate);
        String traceRecordPath = String.format(TRACE_UPDATE_QUERY, new List<String> {traceId});

        HttpHelper request = new HttpHelper('OAuth', 'PATCH');
        request.setBody(traceRecordBody);
        request.setEndpoint(ORG_URL + TOOLING_API_URI + traceRecordPath);
        HttpResponse response = request.send();

        if (response.getStatusCode() < 200 && response.getStatusCode() >= 300) {
            result.isSuccess = false;
            result.error = response.getBody();
        }

        return result;
    }

    @AuraEnabled(cacheable=false)
    public static CalloutParams getLogBodyCalloutParams() {
        CalloutParams params = new CalloutParams();
        params.url = ORG_URL + TOOLING_API_URI + LOG_BODY_QUERY;
        params.authorization = 'OAuth ' + Utility.getSessionIdFromVFPage();

        return params;
    }

    @AuraEnabled(cacheable=false)
    public static List<Log> getDebugLogs(String filter) {
        List<Log> logWrappers = new List<Log>();
        Set<Id> userIds = new Set<Id>();

        String query = 'SELECT Id, StartTime, Status, Operation, LogUserId, LogLength' +
            ' FROM ApexLog';
        if (!String.isEmpty(filter)) {
            query += ' WHERE ' + filter;
        }
        query += ' ORDER BY StartTime DESC LIMIT 100';

        List<ApexLog> logs = (List<ApexLog>)Database.query(query);

        for (ApexLog log : logs) {
            userIds.add(log.LogUserId);
        }

        Map<Id, User> userMap = new Map<Id, User>([
            SELECT Name
            FROM User
            WHERE Id IN :userIds
        ]);

        for (ApexLog log : logs) {
            Log logWrap = new Log();
            logWrap.id = log.Id;
            logWrap.operation = log.Operation;
            logWrap.status = log.Status;
            logWrap.userName = userMap.get(log.LogUserId).Name;
            logWrap.startTime = log.StartTime.format('HH:mm:ss, dd MMM');
            Decimal sizeValue = Decimal.valueOf(log.LogLength).divide((1024*1024),2);
            logWrap.size = String.valueOf(
                sizeValue != 0 ? sizeValue : 0.01
            );
            logWrappers.add(logWrap);
        }

        return logWrappers;
    }

    @AuraEnabled(cacheable=false)
    public static String getLogFilter() {
        String filter = '';

        Log_Board_Settings__c setting = Log_Board_Settings__c.getOrgDefaults();
        if (setting != null && setting.Log_Filter__c != null) {
            filter = setting.Log_Filter__c;
        }

        return filter;
    }

    // FLS check is not needed for ApexLog object
    @SuppressWarnings('PMD.ApexCRUDViolation')
    @AuraEnabled(cacheable=false)
    public static void deleteDebugLogs() {
        for(ApexLog al: [SELECT Id FROM ApexLog LIMIT 100]){
            HttpHelper request = new HttpHelper('Bearer', 'DELETE');
            request.setEndpoint(ORG_URL + LOG_QUERY + al.Id);
            HttpResponse response = request.send();
        }
    }

    // CRUD check is not needed for custom setting
    @SuppressWarnings('PMD.ApexCRUDViolation')
    @AuraEnabled(cacheable=false)
    public static Response saveLogFilter(String filter) {
        Response response = new Response();
        response.isSuccess = true;

        if (String.isNotEmpty(filter)) {
            try {
                Database.query('SELECT Id FROM ApexLog WHERE ' + filter + ' LIMIT 1');
            }
            catch(QueryException ex) {
                response.isSuccess = false;
                response.error = ex.getMessage();
                return response;
            }
        }

        Log_Board_Settings__c setting = Log_Board_Settings__c.getOrgDefaults();
        if (setting == null) {
            setting = new Log_Board_Settings__c(
                SetupOwnerId = UserInfo.getOrganizationId()
            );
        }

        setting.Log_Filter__c = filter;
        upsert setting;

        return response;
    }

    @TestVisible
    private static TraceFlagRecord insertUserTraceFlag() {
        Id levelId = getDevConsoleLevelId();
        
        JSONGenerator gen = JSON.createGenerator(true);
        gen.writeStartObject();
        gen.writeStringField('StartDate', System.now().addSeconds(2).format(TRACE_DATE_FORMAT));
        gen.writeStringField('ExpirationDate', System.now().addSeconds(4).format(TRACE_DATE_FORMAT));
        gen.writeStringField('DebugLevelId', levelId);
        gen.writeStringField('LogType', 'USER_DEBUG');
        gen.writeStringField('TracedEntityId', UserInfo.getUserId());
        gen.writeEndObject();

        HttpHelper request = new HttpHelper('OAuth', 'POST');
        request.setBody(gen.getAsString());
        request.setEndpoint(ORG_URL + TOOLING_API_URI + TRACE_UPDATE_QUERY.removeEnd('/{0}'));

        TraceFlagRecord newFlag = new TraceFlagRecord();

        if (!Test.isRunningTest()) {
            HttpResponse response = request.send();

            Log newFlagResponse = (Log)JSON.deserialize(response.getBody(), Log.class);
            
            newFlag.Id = newFlagResponse.id;
        } else {
            newFlag.Id = generateUUID();
        }
        
        return newFlag;
    }

    @TestVisible
    private static String generateUUID() {
        return '0'.repeat(15) + 'AAA';
    }

    private static Id getDevConsoleLevelId() {
        HttpHelper request = new HttpHelper('OAuth', 'GET');
        String query = 'SELECT Id FROM DebugLevel WHERE DeveloperName = \'SFDC_DevConsole\'';
        query = query.replace(' ','+');
        request.setEndpoint(ORG_URL + TOOLING_API_URI + '/query?q=' + query);

        if (Test.isRunningTest()) {
            return generateUUID();
        }

        HttpResponse response = request.send();

        if (response.getStatusCode() == 200) {
            DebugLevelResponse debugLevels = (DebugLevelResponse)JSON.deserialize(response.getBody(), DebugLevelResponse.class);
            if (debugLevels.records != null && !debugLevels.records.isEmpty()) {
                return debugLevels.records[0].Id;
            }
        }
        return null;
    }

    private static String getTraceRecordBody(String endDate) {
        JSONGenerator gen = JSON.createGenerator(true);
        gen.writeStartObject();
        gen.writeStringField('StartDate', System.now().format(TRACE_DATE_FORMAT));
        gen.writeStringField('ExpirationDate', endDate);
        gen.writeEndObject();
        return gen.getAsString();
    }

    @AuraEnabled(cacheable=false)
    public static List<MetadataHelper.UpsertResult> upsertRSSTSS() {
        List<MetadataHelper.UpsertResult> results = new  List<MetadataHelper.UpsertResult>();

        results.addAll(MetadataUtility.createRemoteSiteSetting());
        results.addAll(MetadataUtility.createTrustedSiteSetting());

        return results;
    }

    public class TraceFlagResponse {
        public List<TraceFlagRecord> records;
    }

    // Uppercase names are required because it used
    // to deserialize the response from Tooling API
    @SuppressWarnings('PMD.VariableNamingConventions')
    public class TraceFlagRecord {
        @AuraEnabled public Id Id;
        @AuraEnabled public Datetime ExpirationDate;
    }

    public class DebugLevelResponse {
        public List<DebugLevelRecord> records;
    }

    // Uppercase name is required because it used
    // to deserialize the response from Tooling API
    @SuppressWarnings('PMD.VariableNamingConventions')
    public class DebugLevelRecord {
        @AuraEnabled public Id Id;
    }

    public class Log {
        @AuraEnabled public Id id;
        @AuraEnabled public String startTime;
        @AuraEnabled public String status;
        @AuraEnabled public String operation;
        @AuraEnabled public String userName;
        @AuraEnabled public String size;
    }

    public class CalloutParams {
        @AuraEnabled public String url;
        @AuraEnabled public String authorization;
    }

    public class Response {
        @AuraEnabled public Boolean isSuccess;
        @AuraEnabled public String error;
    }
}
