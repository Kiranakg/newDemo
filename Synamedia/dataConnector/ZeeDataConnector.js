import Axios from "axios";
import DataResolver from "./DataResolver";

export default class ZeeDataConnector {
  constructor(urlList) {
    this.urlList = urlList;
    this.sessionObject = null;
    this.routePaths = null;
  }
  processRequest(serviceRequest) {
    serviceRequest.sessionObject = this.sessionObject;
    this.requestThroughAxios(serviceRequest);
  }
  requestThroughAxios(serviceRequest) {
    let dataResolver = new DataResolver(this);
    dataResolver.getURL(serviceRequest, this.onDataResolved.bind(this));
  }

  onDataResolved(serviceRequest, dataResolver) {
    this.request(serviceRequest, dataResolver);
  }

  request(serviceRequest, dataResolver) {
    switch (serviceRequest.type) {
      case "get":
        Axios.get(serviceRequest.serviceURL + serviceRequest.queryParams)
          .then(response => {
            if (dataResolver) {
              dataResolver.willCallHandler(serviceRequest.dataKey, response);
            }
            serviceRequest.responseHandler(response, {
              id: serviceRequest.id,
              response: serviceRequest.prevResponse
            });
          })
          .catch(error => console.log("Error is ", error));

        break;
      default:
        break;
    }
  }
}
