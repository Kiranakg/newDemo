import BaseShell from "../../core/baseShell.js";
import * as url from "../../core/controller/urlConfig.js";
import ZeeDataConnector from "./dataConnector/ZeeDataConnector.js";
// import PlayerDelegate from "./delegates/playerDelegate.js";
// import './styles/styles.css';

class AppShell extends BaseShell {
  constructor() {
    super();
    this.modelDelegates = {
      dataConnector: new ZeeDataConnector()
      // playerDelegate: new PlayerDelegate()
    };
  }
  init() {
    super.init(`${url.baseURL}/masterConfig.json`, this.modelDelegates);
  }
}
const instance = new AppShell();
instance.init();
