/*
 * Copyright (C) 2014-2018 L&T Technology Services, All Rights Reserved.
 *
 * This source code and any compilation or derivative thereof is the
 * proprietary information of L&T and is confidential in nature.
 * Under no circumstances is this software to be exposed to or placed under
 * an Open Source License of any type without the expressed written permission
 * of L&T.
 */

import { get } from "lodash";
import DataRequest from "../../../core/model/service/dataRequest";
import { matchPath } from "react-router";

/**
 * Resolves API & network issues/changes if required for this project & handles data manipulation
 * according to the framework before sending it to the model generator for a component.
 *
 * @class DataResolver
 */
export default class DataResolver extends DataRequest {
  constructor(connector) {
    super();

    //All the API keys are defined here.
    var appURL =
      window.offlineURL + "https://api.weyyak.com/v1/en/menu/62?cascade=2";
    var menuBaseURL = window.offlineURL + "https://api.weyyak.com/v1/en/menu/";
    this.dataKey = {
      similarPlayList: {
        base: window.offlineURL + "https://api.weyyak.com/v1/en/related",
        url: ""
      },
      homePageList: { base: appURL, url: "" },
      searchURL: { base: window.offlineURL + "https://api.weyyak.com/v1/en/search?q=", url: "", query: "salman"},
      showsList: {base: window.offlineURL + "https://api.weyyak.com/v1/en/menu/114?cascade=2", url: ""},
      menuNavigation: { base: menuBaseURL, url: "" },
      playbackItemDetails: {
        base: window.offlineURL + "https://api.weyyak.com/v1/en",
        url: ""
      },
      viewAllGridList: {
        base:
          window.offlineURL +
          "https://api.weyyak.com/v1/en/related?id=232061&q=Drama&size=100",
        url: ""
      },
      playURL: {
        base:
          (window.isOffline ? window.offlineURL : "") +
          "https://api-weyyak.akamaized.net/get_info",
        url: ""
      },
      daysBar: {
        base: window.offlineURL + window.baseURL + "/api/daysBar.json",
        url: ""
      },
      timeBar: {
        base: window.offlineURL + window.baseURL + "/api/timeBar.json",
        url: ""
      },
      channelBar: {
        base: window.offlineURL + "https://catalogapi.zee5.com/v1/channel",
        url: ""
      },
      channelList: {
        base: window.offlineURL + "https://catalogapi.zee5.com/v1/channel",
        url: ""
      },
      mobileProgramList: {
        base: window.offlineURL + "https://catalogapi.zee5.com/v1/channel",
        url: ""
      }
    };
    this.dataRequest = null;
    this.connector = connector;
    this.responseHandler = this.processResponse.bind(this);
    this.rootModel = null;
    this.queryParam = {};
    this.onDataResolved = null;
    this.dataBuffer = {};
  }

  /**
   * Service URL changes are done here & API call is made.
   * @param dataRequest
   * @param callback
   */
  getURL(dataRequest, callback) {
    this.dataRequest = dataRequest;
    this.onDataResolved = callback;

    let routePaths = this.connector.routePaths;
    if (routePaths) {
      const routeData = this.getRouteData(routePaths);
      const dataKey = dataRequest.serviceURL;
      this.dataRequest.dataKey = dataKey;

      switch (dataKey) {
        case "similarPlayList":
        case "playbackItemDetails":
          this.queryParam = { ...routeData.params };
          this.serviceURL =
            window.offlineURL +
            `https://api.weyyak.com/v1/ar/${this.queryParam.type}/${this
              .queryParam.id}?cascade=${this.queryParam.type === "series"
              ? "3"
              : "2"}`;
          this.id = "firstRequest";
          this.dataBuffer.contentType = this.queryParam.type;
          this.connector.request(this, this);
          break;
        case "playURL":
          this.queryParam = { ...routeData.params };
          this.dataKey[dataKey].url =
            this.dataKey[dataKey].base + "/" + this.queryParam.videoId;
          this.relayDataRequest();
          break;
        case "menuNavigation":
          this.queryParam = { ...routeData.params };
          this.serviceURL =
            window.offlineURL +
            `https://api.weyyak.com/v1/en/menu/${this.queryParam.id}?cascade=2`;
          this.id = "firstRequest";
          this.connector.request(this, this);
          break;
        case "channelList":
          this.queryParam = { ...routeData.params };
          this.relayDataRequest();
          break;
        case "mobileProgramList":
          this.queryParam = { ...routeData.params };
          this.serviceURL = this.dataKey[dataKey].base;
          this.id = "programRequest";
          this.connector.request(this, this);
          break;
        default:
          this.relayDataRequest();
          break;
      }
    } else {
      this.relayDataRequest();
    }
  }

  /**
   * Returns the routing data required for a route path.
   * @param routePaths
   * @returns routeData
   */
  getRouteData(routePaths) {
    let routeData = null;
    let i = 0;
    for (i = 0; i < routePaths.length; i++) {
      const value = routePaths[i];
      const match = matchPath(this.dataRequest.location.pathname, {
        path: value,
        exact: true,
        strict: false
      });
      routeData = match;
      if (match) {
        break;
      }
    }
    return routeData;
  }

  /**
   * Return the final URL string after all the required changes are done.
   * @param dataKey
   * @returns url
   */
  getCompDataURL(dataKey) {
    let url = dataKey;
    if (dataKey !== undefined && this.dataKey[dataKey] !== undefined) {
      url = this.dataKey[dataKey].url || this.dataKey[dataKey].base;
    }
    return url;
  }

  processResponse(response, dataRequest) {
    switch (dataRequest.id) {
      case "firstRequest":
        const genres = get(response, "data.data.genres");
        this.queryParam = { ...this.queryParam, genres };
        this.updateURLs();
        this.relayDataRequest();
        break;
      case "programRequest":
        const day = this.queryParam.day ? this.queryParam.day : 0
        const id = this.queryParam.channelId ? this.queryParam.channelId : response.data.items[0].id
        const programURL = `https://catalogapi.zee5.com/v1/epg?channels=${
            id
        }&start=${day}&end=${day}&time_offset=%2B05%3A30&page_size=25&translation=en&country=IN`;
        this.queryParam = { ...this.queryParam, programURL};
        this.updateURLs();
        this.relayDataRequest();
        break;
      default:
        break;
    }
  }

  /**
   * Updates the URL before making an API call.
   */
  updateURLs() {
    if (this.queryParam.genres) {
      this.dataKey["similarPlayList"].url =
        this.dataKey["similarPlayList"].base +
        "?id=" +
        this.queryParam.id +
        "&q=" +
        this.queryParam.genres.join("&") +
        "&type=" +
        this.queryParam.type +
        "&size=10";
    }
    if (this.queryParam.programURL) {
      this.dataKey["mobileProgramList"].url = this.queryParam.programURL;
    }
    this.dataKey["playbackItemDetails"].url =
      this.dataKey["playbackItemDetails"].base +
      "/" +
      this.queryParam.type +
      "/" +
      this.queryParam.id +
      `?cascade=${this.queryParam.type === "series" ? "3" : "2"}`;
    this.dataKey["menuNavigation"].url =
      this.dataKey["menuNavigation"].base + this.queryParam.id + `?cascade=2`;
  }

  /**
   * API responses are updated as required by the framework.
   * @param dataKey - API key defined for the respected URLs.
   * @param response
   */
  willCallHandler(dataKey, response) {
    if (dataKey === "playbackItemDetails") {
      response.data.data.content_type = this.dataBuffer.contentType;
    } else if (dataKey === "playURL" && window.isOffline) {
      const sOfflineVideoUrl =
        window.offlineURL +
        "/offline-data/Offline-Data/videos/" +
        Math.ceil(Math.random() * 5).toString() +
        ".mp4";
      response.data = {};
      response.data.url_video = sOfflineVideoUrl;
    } else if (dataKey === "channelBar") {
      const temp = get(response.data, "items");
      let data = temp.map((item) => {
        item.icon = `https://akamaividz.zee5.com/resources/${item.id}/list/170x120/${item.list_image}`;
        return item;
      });
      response.data = {};
      response.data["items"] = data;
    } else if (dataKey === "channelList") {
      const day = this.queryParam.day ? this.queryParam.day : 0;

      let data = [];
      const temp = get(response.data, "items");
      data = temp.map((item) => {
        item.programUrl = `https://catalogapi.zee5.com/v1/epg?channels=${item.id}&start=${day}&end=${day}&time_offset=%2B05%3A30&page_size=25&translation=en&country=IN`;
        return item;
      });
      response.data = {};
      response.data["data"] = data;
    } else if (dataKey === "mobileProgramList" || (dataKey && typeof(dataKey) === "string" && dataKey.includes("channels"))) {
      let result = response.data.items[0].items;
      let finalArr = [];

      for (let i = 0; i < result.length; i++) {
        let currItem = result[i];
        let prevItem = i > 0 ? result[i - 1] : undefined;
        let start = new Date(currItem["start_time"]);
        if (prevItem) {
          let prevEndTime = new Date(prevItem["end_time"]);

          if (start > prevEndTime) {
            let noInfo = {
              title: "No Information Available",
              start_time: prevItem["end_time"],
              end_time: currItem["start_time"],
              description: ""
            };
            finalArr.push(noInfo);
            finalArr.push(currItem);
          } else {
            finalArr.push(currItem);
          }
        } else {
          finalArr.push(currItem);
        }
      }
      response.data = {};
      response.data["0"] = finalArr;
    }
  }

  /**
   * API request is sent here.
   */
  relayDataRequest() {
    this.dataRequest.serviceURL = this.getCompDataURL(
      this.dataRequest.serviceURL
    );
    this.dataRequest.mergeData = { contentType: "movie" };
    this.onDataResolved(this.dataRequest, this);
  }
}
