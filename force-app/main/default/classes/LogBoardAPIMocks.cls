@IsTest
public class LogBoardAPIMocks {
    public class ActiveTraceFlagMock implements HttpCalloutMock {
        public HTTPResponse respond( HTTPRequest req ) {
            HttpResponse res = new HttpResponse();

            LogBoardController.TraceFlagRecord rec = new LogBoardController.TraceFlagRecord();
            rec.Id = '000000000000000AAA';
            rec.ExpirationDate = Datetime.now().addMinutes(10);

            LogBoardController.TraceFlagResponse body = new LogBoardController.TraceFlagResponse();
            body.records = new List<LogBoardController.TraceFlagRecord>{rec};
            
            res.setHeader( 'Content-Type', 'application/json' );
            res.setBody(JSON.serialize(body));
            res.setStatusCode(200);
            
            return res;
        }
    }

    public class LogBodyMock implements HttpCalloutMock {
        public HTTPResponse respond( HTTPRequest req ) {
            HttpResponse res = new HttpResponse();
            
            res.setHeader( 'Content-Type', 'application/json' );
            res.setBody('test');
            res.setStatusCode(200);
            
            return res;
        }
    }
}
