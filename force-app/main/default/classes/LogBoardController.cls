public class LogBoardController {

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
    public static void stopTraceFlag(String traceId) {
        String endDate = System.now().addSeconds(2).format(TRACE_DATE_FORMAT);
        String traceRecordBody = getTraceRecordBody(endDate);
        String traceRecordPath = String.format(TRACE_UPDATE_QUERY, new List<String> {traceId});

        HttpHelper request = new HttpHelper('OAuth', 'PATCH');
        request.setBody(traceRecordBody);
        request.setEndpoint(ORG_URL + TOOLING_API_URI + traceRecordPath);
        HttpResponse response = request.send();

        if (response.getStatusCode() < 200 && response.getStatusCode() >= 300) {
            throw new AuraHandledException(response.getBody());
        }
    }

    @AuraEnabled(cacheable=false)
    public static CalloutParams getLogBodyCalloutParams() {
        CalloutParams params = new CalloutParams();
        params.url = ORG_URL + TOOLING_API_URI + LOG_BODY_QUERY;
        params.authorization = 'OAuth ' + Utility.getSessionIdFromVFPage();

        return params;
    }

    @AuraEnabled(cacheable=false)
    public static List<Log> getDebugLogs() {
        List<Log> logWrappers = new List<Log>();
        Set<Id> userIds = new Set<Id>();

        List<ApexLog> logs = [
            SELECT Id, StartTime, Status, Operation, LogUserId, LogLength
            FROM ApexLog 
            ORDER BY StartTime DESC
            LIMIT 100
        ];

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
    public static void deleteDebugLogs() {
        for(ApexLog al: [SELECT Id FROM ApexLog LIMIT 100]){
            HttpHelper request = new HttpHelper('Bearer', 'DELETE');
            request.setEndpoint(ORG_URL + LOG_QUERY + al.Id);
            HttpResponse response = request.send();
        }
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
            newFlag.Id = '000000000000000AAA';
        }
        
        return newFlag;
    }

    private static Id getDevConsoleLevelId() {
        HttpHelper request = new HttpHelper('OAuth', 'GET');
        String query = 'SELECT Id FROM DebugLevel WHERE DeveloperName = \'SFDC_DevConsole\'';
        query = query.replace(' ','+');
        request.setEndpoint(ORG_URL + TOOLING_API_URI + '/query?q=' + query);

        if (Test.isRunningTest()) {
            return '000000000000000AAB';
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

    public class TraceFlagResponse {
        public List<TraceFlagRecord> records;
    }

    public class TraceFlagRecord {
        @AuraEnabled public Id Id;
        @AuraEnabled public Datetime ExpirationDate;
    }

    public class DebugLevelResponse {
        public List<DebugLevelRecord> records;
    }

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

}
