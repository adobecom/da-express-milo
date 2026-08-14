/* eslint-disable max-classes-per-file */
import BaseActionGroup from '../../../core/BaseActionGroup.js';
import { ValidationError } from '../../../core/Errors.js';
import { DownloadTopics } from '../topics.js';
import {
  ASSET_IMAGE_DOWNLOAD_SIZE,
  ASSET_SVG_SIZE,
  MIME_TYPES,
} from '../constants.js';
import {
  buildLinearGradientSVG,
  buildVariableSwatches,
  denormRGB,
  doesThemeHavePantoneColorCodes,
  formatSwatchInMode,
  getClassName,
  getDownloadedImageName,
  getLinearGradientColorStops,
  getLinearGradientCSS,
  performDownload,
  renderPantoneJPEG,
  renderThemeJPEG,
  safeClipboardWrite,
  validateSwatches,
  writeASE,
} from './helpers.js';

export class FileDownloadActions extends BaseActionGroup {
  /** @returns {Object<string, Function>} */
  getHandlers() {
    return {
      [DownloadTopics.FILE.ASE]: this.downloadAsASE.bind(this),
      [DownloadTopics.FILE.JPEG]: this.downloadAsJPEG.bind(this),
      [DownloadTopics.FILE.PANTONE_JPEG]: this.downloadAsPantoneJPEG.bind(this),
      [DownloadTopics.FILE.PNG]: this.downloadAsPNG.bind(this),
      [DownloadTopics.FILE.SVG]: this.downloadAsSVG.bind(this),
      [DownloadTopics.FILE.RECOLOR_SVG]: this.downloadRecolorSVG.bind(this),
    };
  }

  // eslint-disable-next-line class-methods-use-this
  #downloadJPEGVariant(themeData, topic, renderFn, filePrefix) {
    validateSwatches(themeData, topic);
    const dataUrl = renderFn(themeData);
    const fileName = `${filePrefix}${themeData.name}.jpeg`;
    performDownload(dataUrl, fileName, MIME_TYPES.JPEG);
    return { fileName };
  }

  /**
   * @param {import('./helpers.js').ThemeData} themeData
   * @returns {Promise<{fileName: string, size: number}>}
   * @throws {ValidationError}
   */
  // eslint-disable-next-line class-methods-use-this
  async downloadAsASE(themeData) {
    validateSwatches(themeData, DownloadTopics.FILE.ASE);

    const data = writeASE(themeData);
    const buffer = new Uint8Array(data);
    const content = new Blob([buffer], { type: MIME_TYPES.ASE });
    const isPantone = doesThemeHavePantoneColorCodes(themeData.swatches);
    const fileName = isPantone
      ? `AdobeColorPantone ${themeData.name}.ase`
      : `AdobeColor ${themeData.name}.ase`;

    performDownload(content, fileName);
    return { fileName, size: buffer.length };
  }

  /**
   * @param {import('./helpers.js').ThemeData} themeData
   * @returns {Promise<{fileName: string}>}
   * @throws {ValidationError}
   */
  async downloadAsJPEG(themeData) {
    return this.#downloadJPEGVariant(
      themeData,
      DownloadTopics.FILE.JPEG,
      renderThemeJPEG,
      'AdobeColor-',
    );
  }

  /**
   * @param {import('./helpers.js').ThemeData} themeData
   * @returns {Promise<{fileName: string}>}
   * @throws {ValidationError}
   */
  async downloadAsPantoneJPEG(themeData) {
    return this.#downloadJPEGVariant(
      themeData,
      DownloadTopics.FILE.PANTONE_JPEG,
      renderPantoneJPEG,
      'AdobeColorPantone ',
    );
  }

  /**
   * @param {import('./helpers.js').ThemeData} themeData
   * @returns {Promise<{fileName: string}>}
   * @throws {ValidationError}
   */
  // eslint-disable-next-line class-methods-use-this
  async downloadAsPNG(themeData) {
    validateSwatches(themeData, DownloadTopics.FILE.PNG);

    const { width, height } = ASSET_IMAGE_DOWNLOAD_SIZE;
    const colorStops = getLinearGradientColorStops(themeData.swatches);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;

    const linearGradient = ctx.createLinearGradient(0, 0, width, 0);
    colorStops.forEach((stop) => {
      linearGradient.addColorStop(stop.offset, `rgb(${stop.R}, ${stop.G}, ${stop.B})`);
    });

    ctx.fillStyle = linearGradient;
    ctx.fillRect(0, 0, width, height);

    const pngDataUrl = canvas.toDataURL(MIME_TYPES.PNG);
    const fileName = `AdobeColorGradient ${themeData.name}.png`;
    performDownload(pngDataUrl, fileName, MIME_TYPES.PNG);
    return { fileName };
  }

  /**
   * @param {import('./helpers.js').ThemeData} themeData
   * @returns {Promise<{fileName: string}>}
   * @throws {ValidationError}
   */
  // eslint-disable-next-line class-methods-use-this
  async downloadAsSVG(themeData) {
    validateSwatches(themeData, DownloadTopics.FILE.SVG);

    const svgSize = themeData.svgSize || ASSET_SVG_SIZE;
    const svgData = buildLinearGradientSVG(themeData.swatches, svgSize);
    const blob = new Blob([svgData], { type: MIME_TYPES.SVG });
    const fileName = `AdobeColorGradient ${themeData.name}.svg`;
    performDownload(blob, fileName);
    return { fileName };
  }

  /**
   * @param {{ svgString: string, name?: string }} data
   * @returns {Promise<{fileName: string}>}
   * @throws {ValidationError}
   */
  // eslint-disable-next-line class-methods-use-this
  async downloadRecolorSVG(data) {
    if (!data?.svgString) {
      throw new ValidationError('Recolored SVG string is required', {
        field: 'data.svgString', serviceName: 'Download', topic: DownloadTopics.FILE.RECOLOR_SVG,
      });
    }

    const blob = new Blob([data.svgString], { type: MIME_TYPES.SVG_PLAIN });
    const fileName = getDownloadedImageName(
      `${data.name || 'AdobeColor'}_recolored`,
      MIME_TYPES.SVG_PLAIN,
    );

    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = fileName;
    document.body.append(anchor);
    anchor.onclick = () => {
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
    };
    anchor.click();

    return { fileName };
  }
}

export class ExportActions extends BaseActionGroup {
  /** @returns {Object<string, Function>} */
  getHandlers() {
    return {
      [DownloadTopics.EXPORT.CSS]: this.exportAsCSS.bind(this),
      [DownloadTopics.EXPORT.SCSS]: this.exportAsSCSS.bind(this),
      [DownloadTopics.EXPORT.LESS]: this.exportAsLESS.bind(this),
      [DownloadTopics.EXPORT.XML]: this.exportAsXML.bind(this),
    };
  }

  /**
   * @param {import('./helpers.js').ThemeData} themeData
   * @param {'HEX'|'RGB'|'HSB'|'Lab'} [mode='RGB'] - the currently-selected
   *   Color mode; only this mode's values are emitted (see formatSwatchInMode)
   * @returns {Promise<{format: string, output: string}>}
   * @throws {ValidationError}
   */
  // eslint-disable-next-line class-methods-use-this
  async exportAsCSS(themeData, mode = 'RGB') {
    validateSwatches(themeData, DownloadTopics.EXPORT.CSS);

    let output = '';

    if (themeData.assetType === 'gradient') {
      const gradientCSS = getLinearGradientCSS(themeData.swatches);
      // HSB itself has no valid CSS gradient-stop syntax (no hsb()/hsv()
      // function), so its stops use hsl() instead — same as colorweb's own
      // "Copy as CSS".
      const dataByMode = {
        HEX: gradientCSS.linearGradientDataHEX,
        RGB: gradientCSS.linearGradientDataRGBA,
        Lab: gradientCSS.linearGradientDataLAB,
        HSB: gradientCSS.linearGradientDataHSL,
      };
      output += `linear-gradient(to right, ${dataByMode[mode] ?? dataByMode.RGB});\n`;
    } else {
      const cls = getClassName(themeData.name);
      themeData.swatches.forEach((swatch, i) => {
        const { suffix, value, isFunctionalColor } = formatSwatchInMode(swatch, mode);
        const prop = isFunctionalColor ? 'color' : '--hsb';
        output += `.${cls}-${i + 1}-${suffix} { ${prop}: ${value}; }\n`;
      });
    }

    const clipboardSuccess = await safeClipboardWrite(output, 'CSS');
    return { format: 'CSS', output, clipboardSuccess };
  }

  /**
   * @param {import('./helpers.js').ThemeData} themeData
   * @param {'HEX'|'RGB'|'HSB'|'Lab'} [mode='RGB']
   * @returns {Promise<{format: string, output: string}>}
   * @throws {ValidationError}
   */
  // eslint-disable-next-line class-methods-use-this
  async exportAsSCSS(themeData, mode = 'RGB') {
    validateSwatches(themeData, DownloadTopics.EXPORT.SCSS);
    const output = buildVariableSwatches(themeData.swatches, themeData.name, '$', mode);
    const clipboardSuccess = await safeClipboardWrite(output, 'SCSS');
    return { format: 'SCSS', output, clipboardSuccess };
  }

  /**
   * @param {import('./helpers.js').ThemeData} themeData
   * @param {'HEX'|'RGB'|'HSB'|'Lab'} [mode='RGB']
   * @returns {Promise<{format: string, output: string}>}
   * @throws {ValidationError}
   */
  // eslint-disable-next-line class-methods-use-this
  async exportAsLESS(themeData, mode = 'RGB') {
    validateSwatches(themeData, DownloadTopics.EXPORT.LESS);
    const output = buildVariableSwatches(themeData.swatches, themeData.name, '@', mode);
    const clipboardSuccess = await safeClipboardWrite(output, 'LESS');
    return { format: 'LESS', output, clipboardSuccess };
  }

  /**
   * @param {import('./helpers.js').ThemeData} themeData
   * @param {'HEX'|'RGB'} [mode='RGB'] - only HEX/RGB are valid (no XML
   *   representation exists for HSB/Lab, so those are excluded from the
   *   Codes menu entirely — see createColorModesHeader.js)
   * @returns {Promise<{format: string, output: string}>}
   * @throws {ValidationError}
   */
  // eslint-disable-next-line class-methods-use-this
  async exportAsXML(themeData, mode = 'RGB') {
    validateSwatches(themeData, DownloadTopics.EXPORT.XML);

    const cls = getClassName(themeData.name);
    let output = '<palette>\n';

    themeData.swatches.forEach((swatch, i) => {
      const { r, g, b } = denormRGB(swatch);
      const name = `${cls}-${i + 1}`;
      if (mode === 'HEX') {
        const hex = [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
        output += `<color name='${name}' hex='${hex}' />\n`;
      } else {
        output += `<color name='${name}' r='${r}' g='${g}' b='${b}' />\n`;
      }
    });

    output += '</palette>';

    const clipboardSuccess = await safeClipboardWrite(output, 'XML');
    return { format: 'XML', output, clipboardSuccess };
  }
}
