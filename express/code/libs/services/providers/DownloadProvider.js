import BaseProvider from './BaseProvider.js';
import { DownloadTopics, DownloadActionGroups } from '../plugins/download/topics.js';

export default class DownloadProvider extends BaseProvider {
  #actions = {};

  constructor(plugin) {
    super(plugin);
    this.#initActions();
  }

  #initActions() {
    const { FILE, EXPORT } = DownloadActionGroups;

    this.#actions = {
      downloadASE: this.plugin.useAction(FILE, DownloadTopics.FILE.ASE),
      downloadJPEG: this.plugin.useAction(FILE, DownloadTopics.FILE.JPEG),
      downloadPantoneJPEG: this.plugin.useAction(FILE, DownloadTopics.FILE.PANTONE_JPEG),
      downloadPNG: this.plugin.useAction(FILE, DownloadTopics.FILE.PNG),
      downloadSVG: this.plugin.useAction(FILE, DownloadTopics.FILE.SVG),
      downloadRecolorSVG: this.plugin.useAction(FILE, DownloadTopics.FILE.RECOLOR_SVG),
      exportCSS: this.plugin.useAction(EXPORT, DownloadTopics.EXPORT.CSS),
      exportSCSS: this.plugin.useAction(EXPORT, DownloadTopics.EXPORT.SCSS),
      exportLESS: this.plugin.useAction(EXPORT, DownloadTopics.EXPORT.LESS),
      exportXML: this.plugin.useAction(EXPORT, DownloadTopics.EXPORT.XML),
    };
  }

  /** @param {Object} themeData */
  async downloadASE(themeData) {
    return this.safeExecute(() => this.#actions.downloadASE(themeData));
  }

  /** @param {Object} themeData */
  async downloadJPEG(themeData) {
    return this.safeExecute(() => this.#actions.downloadJPEG(themeData));
  }

  /** @param {Object} themeData */
  async downloadPantoneJPEG(themeData) {
    return this.safeExecute(() => this.#actions.downloadPantoneJPEG(themeData));
  }

  /** @param {Object} themeData */
  async downloadPNG(themeData) {
    return this.safeExecute(() => this.#actions.downloadPNG(themeData));
  }

  /** @param {Object} themeData */
  async downloadSVG(themeData) {
    return this.safeExecute(() => this.#actions.downloadSVG(themeData));
  }

  /** @param {Object} data */
  async downloadRecolorSVG(data) {
    return this.safeExecute(() => this.#actions.downloadRecolorSVG(data));
  }

  /** @param {Object} themeData */
  async exportCSS(themeData) {
    return this.safeExecute(() => this.#actions.exportCSS(themeData));
  }

  /** @param {Object} themeData */
  async exportSCSS(themeData) {
    return this.safeExecute(() => this.#actions.exportSCSS(themeData));
  }

  /** @param {Object} themeData */
  async exportLESS(themeData) {
    return this.safeExecute(() => this.#actions.exportLESS(themeData));
  }

  /** @param {Object} themeData */
  async exportXML(themeData) {
    return this.safeExecute(() => this.#actions.exportXML(themeData));
  }
}
