import BasePlugin from '../../core/BasePlugin.js';
import { FileDownloadActions, ExportActions } from './actions/DownloadActions.js';
import { DownloadActionGroups } from './topics.js';

export default class DownloadPlugin extends BasePlugin {
  /** @returns {string} */
  static get serviceName() {
    return 'Download';
  }

  /**
   * @param {Object} [options]
   * @param {Object} [options.serviceConfig]
   * @param {Object} [options.appConfig]
   */
  constructor({ serviceConfig = {}, appConfig = {} } = {}) {
    super({ serviceConfig, appConfig });
    this.registerActionGroups();
  }

  /**
   * @param {Object} appConfigParam
   * @returns {boolean}
   */
  // eslint-disable-next-line class-methods-use-this
  isActivated(appConfigParam) {
    return appConfigParam?.features?.ENABLE_DOWNLOAD !== false;
  }

  /** @returns {void} */
  registerActionGroups() {
    this.registerActionGroup(DownloadActionGroups.FILE, new FileDownloadActions(this));
    this.registerActionGroup(DownloadActionGroups.EXPORT, new ExportActions(this));
  }
}
