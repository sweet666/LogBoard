public class MetadataHelperMock implements WebServiceMock {

    @SuppressWarnings('PMD.ExcessiveParameterList')
    public void doInvoke(
        Object stub, Object request, Map<String, Object> response, String endpoint, String soapAction,
        String requestName, String responseNS, String responseName, String responseType
    ) {
        MetadataHelper.upsertMetadataResponse_element responseElement = new MetadataHelper.upsertMetadataResponse_element();
        List<MetadataHelper.UpsertResult> resultList = new List<MetadataHelper.UpsertResult>();
        MetadataHelper.UpsertResult result = new MetadataHelper.UpsertResult();
        result.created = true;
        result.success = true;
        resultList.add(result);
        responseElement.result = resultList;
        response.put('response_x', responseElement); 
    }
}
