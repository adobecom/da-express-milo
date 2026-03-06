import {
  ASSET_IMAGE_DOWNLOAD_SIZE,
  DEFAULT_GRADIENT_MIDPOINT,
  GRID_ASSETS,
  MAX_FILENAME_LENGTH,
  MIME_TYPE_TO_EXTENSION,
  MIME_TYPES,
  MULTI_ROW_ASSET_IMAGE_DOWNLOAD_SIZE,
  PANTONE_JPEG_SPECS,
  ROW_ASSETS,
} from '../constants.js';
import { ValidationError } from '../../../core/Errors.js';

/**
 * @typedef {{ r: number, g: number, b: number }} RGBColor
 * @typedef {{ c: number, m: number, y: number, k: number }} CMYKColor
 * @typedef {{ l: number, a: number, b: number }} LABColor
 * @typedef {{ h: number, s: number, l: number }} HSLColor
 *
 * @typedef {Object} Swatch
 * @property {RGBColor} rgb
 * @property {CMYKColor} [cmyk]
 * @property {LABColor} [lab]
 * @property {string} [pantone]
 * @property {boolean} [isSpotColor]
 * @property {number} [offset]
 * @property {number} [midpoint]
 *
 * @typedef {Object} ThemeData
 * @property {string} name
 * @property {Swatch[]} swatches
 * @property {string} [colorMode]
 * @property {number[]} [order]
 * @property {{ width: number, height: number }} [svgSize]
 * @property {string} [assetType]
 *
 * @typedef {Object} ColorStop
 * @property {number|string} offset
 * @property {number} R
 * @property {number} G
 * @property {number} B
 *
 * @typedef {Object} ResolvedSwatchColor
 * @property {string} colorModeForAse
 * @property {number} numChannels
 * @property {number[]} channels
 *
 * @typedef {Object} GradientCSS
 * @property {string} linearGradientDataRGBA
 * @property {string} linearGradientDataHEX
 */

// ── Download / file helpers ─────────────────────────────────────────

/**
 * @param {Blob|string} content
 * @param {string} fileName
 * @param {string} [mimeType]
 */
export function performDownload(content, fileName, mimeType) {
  const urlObject = window.URL || window.webkitURL || window;
  const anchor = document.createElement('a');
  anchor.href = mimeType === undefined
    ? urlObject.createObjectURL(content)
    : content;
  anchor.download = fileName;
  anchor.dispatchEvent(new MouseEvent('click', { cancelable: true }));
  urlObject.revokeObjectURL(anchor.href);
}

/**
 * @param {string} description
 * @param {string} mimeType
 * @returns {string}
 */
export function getDownloadedImageName(description, mimeType) {
  const extension = MIME_TYPE_TO_EXTENSION[mimeType];
  let name = `AdobeColor_${description}`.slice(0, MAX_FILENAME_LENGTH);
  name = name.replaceAll(/[^\w\s-]/g, '');
  return `${name}.${extension}`;
}

// ── Color conversion / formatting helpers ───────────────────────────

/**
 * @param {RGBColor} rgb
 * @returns {HSLColor}
 */
export function rgbToHsl(rgb) {
  const { r, g, b } = rgb;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
      default: break;
    }
  }

  return { h, s, l };
}

/**
 * @param {string} [name]
 * @returns {string}
 */
export function getClassName(name) {
  return name?.replaceAll(' ', '-') || 'colortheme-color';
}

/**
 * @param {Swatch} swatch
 * @returns {{ r: number, g: number, b: number }}
 */
export function denormRGB(swatch) {
  return {
    r: Math.round(swatch.rgb.r * 255),
    g: Math.round(swatch.rgb.g * 255),
    b: Math.round(swatch.rgb.b * 255),
  };
}

// ── Validation helpers ──────────────────────────────────────────────

/**
 * @param {ThemeData} themeData
 * @param {string} topic
 * @throws {ValidationError}
 */
export function validateSwatches(themeData, topic) {
  if (!themeData?.swatches?.length) {
    throw new ValidationError('Theme data with swatches is required', {
      field: 'themeData.swatches', serviceName: 'Download', topic,
    });
  }
}

// ── Swatch export helpers ───────────────────────────────────────────

/**
 * @param {Swatch[]} swatches
 * @param {string} themeName
 * @param {string} prefix - Variable prefix (e.g. '$' for SCSS, '@' for LESS)
 * @returns {string}
 */
export function buildVariableSwatches(swatches, themeName, prefix) {
  const cls = getClassName(themeName);
  let output = '';

  output += '/* Color Theme Swatches in Hex */\n';
  swatches.forEach((swatch, i) => {
    const { r, g, b } = denormRGB(swatch);
    const hex = [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
    output += `${prefix}${cls}-${i + 1}-hex: #${hex};\n`;
  });

  output += '\n/* Color Theme Swatches in RGBA */\n';
  swatches.forEach((swatch, i) => {
    const { r, g, b } = denormRGB(swatch);
    output += `${prefix}${cls}-${i + 1}-rgba: rgba(${r}, ${g}, ${b}, 1);\n`;
  });

  output += '\n/* Color Theme Swatches in HSLA */\n';
  swatches.forEach((swatch, i) => {
    const hsl = rgbToHsl(swatch.rgb);
    const h = Math.round(hsl.h * 360);
    const s = Math.round(hsl.s * 100);
    const l = Math.round(hsl.l * 100);
    output += `${prefix}${cls}-${i + 1}-hsla: hsla(${h}, ${s}%, ${l}%, 1);\n`;
  });

  return output;
}

// ── Pantone helpers ─────────────────────────────────────────────────

/**
 * @param {Swatch} swatch
 * @returns {boolean}
 */
export function doesSwatchHavePantoneColorCode(swatch) {
  return swatch.pantone != null && swatch.pantone !== '';
}

/**
 * @param {Swatch[]} swatches
 * @returns {boolean}
 */
export function doesThemeHavePantoneColorCodes(swatches) {
  return swatches.every((swatch) => doesSwatchHavePantoneColorCode(swatch));
}

// ── ASE binary format helpers ───────────────────────────────────────

/**
 * @param {DataView} dView
 * @param {number} index
 * @param {string} str
 * @returns {number}
 */
export function writeUTF16(dView, index, str) {
  let pos = index;
  dView.setUint16(pos, str.length + 1);
  pos += 2;
  for (let i = 0; i < str.length; i += 1) {
    dView.setInt16(pos, str.codePointAt(i));
    pos += 2;
  }
  dView.setInt16(pos, 0);
  pos += 2;
  return pos;
}

/**
 * @param {DataView} dView
 * @param {number} count
 * @returns {number}
 */
export function writeASEHeader(dView, count) {
  const aseType = 'ASEF';
  let index = 0;

  for (let i = 0; i < aseType.length; i += 1) {
    dView.setInt8(index, aseType.codePointAt(i));
    index += 1;
  }

  dView.setInt32(index, 1 << 16); // eslint-disable-line no-bitwise
  index += 4;

  dView.setUint32(index, count);
  index += 4;

  return index;
}

/**
 * @param {Swatch} swatch
 * @param {string} colorMode
 * @returns {ResolvedSwatchColor}
 */
export function resolveSwatchColor(swatch, colorMode) {
  const channels = [0, 0, 0, 0];

  switch (colorMode.toLowerCase()) {
    case 'hsv':
    case 'rgb':
      channels[0] = swatch.rgb.r;
      channels[1] = swatch.rgb.g;
      channels[2] = swatch.rgb.b;
      return { colorModeForAse: 'RGB ', numChannels: 3, channels };
    case 'cmyk':
      channels[0] = swatch.cmyk.c;
      channels[1] = swatch.cmyk.m;
      channels[2] = swatch.cmyk.y;
      channels[3] = swatch.cmyk.k;
      return { colorModeForAse: 'CMYK', numChannels: 4, channels };
    case 'lab':
      channels[0] = swatch.lab.l;
      channels[1] = swatch.lab.a * 0xFF - 0x80;
      channels[2] = swatch.lab.b * 0xFF - 0x80;
      return { colorModeForAse: 'LAB ', numChannels: 3, channels };
    default:
      return { colorModeForAse: 'RGB ', numChannels: 3, channels };
  }
}

/**
 * @param {DataView} dView
 * @param {number} index
 * @param {string} name
 * @returns {number}
 */
export function writeASEGroupStart(dView, index, name) {
  let pos = index;

  dView.setUint16(pos, 0xC001);
  pos += 2;

  dView.setInt32(pos, 0);
  pos += 4;
  const groupStartIndex = pos;

  pos = writeUTF16(dView, pos, name);

  dView.setInt32(groupStartIndex - 4, pos - groupStartIndex);

  return pos;
}

/**
 * @param {DataView} dView
 * @param {number} index
 * @param {Swatch} swatch
 * @param {string} colorMode
 * @returns {number}
 */
export function writeASESwatch(dView, index, swatch, colorMode) {
  let pos = index;

  dView.setUint16(pos, 1);
  pos += 2;

  dView.setInt32(pos, 0);
  pos += 4;
  const swatchStartIndex = pos;

  if (doesSwatchHavePantoneColorCode(swatch)) {
    const swatchName = swatch.pantone.substr(0, 8) === 'PANTONE '
      ? swatch.pantone
      : `PANTONE ${swatch.pantone}`;
    pos = writeUTF16(dView, pos, swatchName);
  } else {
    pos = writeUTF16(dView, pos, '');
  }

  const { colorModeForAse, numChannels, channels } = resolveSwatchColor(swatch, colorMode);

  for (let i = 0; i < colorModeForAse.length; i += 1) {
    dView.setInt8(pos, colorModeForAse.codePointAt(i));
    pos += 1;
  }

  for (let i = 0; i < numChannels; i += 1) {
    dView.setFloat32(pos, channels[i]);
    pos += 4;
  }

  if (doesSwatchHavePantoneColorCode(swatch)) {
    dView.setUint16(pos, swatch.isSpotColor ? 1 : 0);
  } else {
    dView.setUint16(pos, 2);
  }
  pos += 2;

  dView.setInt32(swatchStartIndex - 4, pos - swatchStartIndex);

  return pos;
}

/**
 * @param {DataView} dView
 * @param {number} index
 */
export function writeASEGroupEnd(dView, index) {
  let pos = index;
  dView.setUint16(pos, 0xC002);
  pos += 2;
  dView.setInt32(pos, 0);
}

/**
 * @param {string} name
 * @param {Swatch[]} swatches
 * @param {string} colorMode
 * @returns {number}
 */
export function getASEExpectedLength(name, swatches, colorMode) {
  let length = 12;
  let numChannels = 3;
  const minSwatchLength = 6;
  const emptyStringLength = 4;

  if (colorMode.toLowerCase() === 'cmyk') numChannels = 4;

  let swatchNameLength = emptyStringLength;
  swatches.forEach((swatch) => {
    if (doesSwatchHavePantoneColorCode(swatch)) {
      swatchNameLength += ('PANTONE '.length + swatch.pantone.length) * 2;
    }
  });

  const maxColorSwatchData = 4 + numChannels * 4 + 2 + swatchNameLength;

  length += minSwatchLength;
  length += emptyStringLength + name.length * 2;
  length += (minSwatchLength + maxColorSwatchData) * swatches.length;
  length += minSwatchLength;

  return length;
}

/**
 * @param {ThemeData} themeData
 * @returns {ArrayBuffer}
 */
export function writeASE({ name, swatches, colorMode }) {
  const expectedLength = getASEExpectedLength(name, swatches, colorMode);
  const aseContent = new ArrayBuffer(expectedLength);
  const dView = new DataView(aseContent);
  const count = swatches.length + 2;

  let index = writeASEHeader(dView, count);
  index = writeASEGroupStart(dView, index, name);

  for (const swatch of swatches) {
    index = writeASESwatch(dView, index, swatch, colorMode);
  }

  writeASEGroupEnd(dView, index);

  return aseContent;
}

// ── Gradient helpers ────────────────────────────────────────────────

/**
 * @param {Swatch[]} stops
 * @returns {ColorStop[]}
 */
export function getLinearGradientColorStops(stops) {
  const colorStops = [];
  let prevStop = {};

  stops.forEach((currentStop, index) => {
    const stop = {
      offset: currentStop.offset,
      R: Number.parseInt(currentStop.rgb.r * 255, 10),
      G: Number.parseInt(currentStop.rgb.g * 255, 10),
      B: Number.parseInt(currentStop.rgb.b * 255, 10),
    };

    if (index === 0) {
      prevStop = stop;
    } else {
      if (currentStop.midpoint !== DEFAULT_GRADIENT_MIDPOINT) {
        colorStops.push({
          offset: String(
            prevStop.offset + (currentStop.offset - prevStop.offset) * currentStop.midpoint,
          ),
          R: Math.round((prevStop.R + stop.R) / 2),
          G: Math.round((prevStop.G + stop.G) / 2),
          B: Math.round((prevStop.B + stop.B) / 2),
        });
      }
      prevStop = stop;
    }
    colorStops.push(stop);
  });

  return colorStops;
}

/**
 * @param {Swatch[]} stops
 * @returns {GradientCSS}
 */
export function getLinearGradientCSS(stops) {
  let linearGradientDataRGBA = '';
  let linearGradientDataHEX = '';
  let prevOffset = 0;

  stops.forEach((stop, index) => {
    const r = Math.round(stop.rgb.r * 255);
    const g = Math.round(stop.rgb.g * 255);
    const b = Math.round(stop.rgb.b * 255);
    const hex = [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
    const rgba = `rgba(${r}, ${g}, ${b}, 1)`;
    const pct = stop.offset * 100;

    if (index === 0) {
      linearGradientDataRGBA += `${rgba} ${pct}%`;
      linearGradientDataHEX += `#${hex} ${pct}%`;
    } else {
      const distance = pct - prevOffset;
      const midpointPos = prevOffset + distance * stop.midpoint;
      linearGradientDataRGBA += `, ${midpointPos}%, ${rgba} ${pct}%`;
      linearGradientDataHEX += `, ${midpointPos}%, #${hex} ${pct}%`;
    }
    prevOffset = pct;
  });

  return { linearGradientDataRGBA, linearGradientDataHEX };
}

/**
 * @param {Swatch[]} stops
 * @param {{ width: number, height: number }} svgSize
 * @returns {string}
 */
export function buildLinearGradientSVG(stops, svgSize) {
  const colorStops = getLinearGradientColorStops(stops);

  let svg = '<svg xmlns="http://www.w3.org/2000/svg"';
  svg += 'xmlns:xlink="http://www.w3.org/1999/xlink"';
  svg += ` width="${svgSize.width}" height="${svgSize.height}">\n`;
  svg += '<defs>\n';
  svg += '<linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">';

  colorStops.forEach((stop) => {
    svg += `<stop offset="${stop.offset * 100}%"`;
    svg += ` style="stop-color:rgb(${stop.R},${stop.G},${stop.B});stop-opacity:1" /> `;
  });

  svg += '</linearGradient>\n</defs>\n';
  svg += `<rect width="${svgSize.width}" height="${svgSize.height}" fill="url(#gradient)"/>\n`;
  svg += '</svg>';

  return svg;
}

// ── Canvas rendering helpers ────────────────────────────────────────

/**
 * @param {number} count
 * @returns {number}
 */
export function getGridForSwatchCount(count) {
  const match = GRID_ASSETS.find((g) => g.members.includes(count));
  return match ? match.grid : 4;
}

/**
 * @param {number} count
 * @returns {number}
 */
export function getRowHeightForSwatchCount(count) {
  const match = ROW_ASSETS.find((r) => r.members.includes(count));
  return match ? match.height : 200;
}

/**
 * @param {ThemeData} themeData
 * @returns {string}
 */
export function renderThemeJPEG(themeData) {
  const { swatches, order } = themeData;
  const swatchCount = swatches.length;
  const isMultiRow = swatchCount > 4;
  const { width, height } = isMultiRow
    ? MULTI_ROW_ASSET_IMAGE_DOWNLOAD_SIZE
    : ASSET_IMAGE_DOWNLOAD_SIZE;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = width;
  canvas.height = height;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  const gridCols = getGridForSwatchCount(swatchCount);
  const rowHeight = getRowHeightForSwatchCount(swatchCount);
  const padding = 30;
  const gap = 20;
  const swatchWidth = (width - 2 * padding - (gridCols - 1) * gap) / gridCols;

  let col = 0;
  let row = 0;

  for (let i = 0; i < swatchCount; i += 1) {
    const swatch = order ? swatches[order[i]] : swatches[i];
    const x = padding + col * (swatchWidth + gap);
    const y = padding + row * (rowHeight + gap);

    const r = Math.round(swatch.rgb.r * 255);
    const g = Math.round(swatch.rgb.g * 255);
    const b = Math.round(swatch.rgb.b * 255);
    const hex = [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();

    if (hex === 'FFFFFF') {
      ctx.strokeStyle = '#e1e1e1';
      ctx.strokeRect(x, y, swatchWidth, rowHeight);
    } else {
      ctx.fillStyle = `#${hex}`;
      ctx.fillRect(x, y, swatchWidth, rowHeight);
    }

    const labelY = y + rowHeight + 35;
    ctx.fillStyle = '#2c2c2c';
    ctx.font = '700 35px/45px adobe-clean, sans-serif';
    ctx.fillText(`#${hex}`, x + 20, labelY);

    ctx.font = '400 20px/25px adobe-clean, sans-serif';
    ctx.fillStyle = '#2c2c2c';
    ctx.fillText('RGB', x + 20, labelY + 30);
    ctx.font = '700 20px/25px adobe-clean, sans-serif';
    ctx.fillText(`${r}, ${g}, ${b}`, x + 60, labelY + 30);

    col += 1;
    if (col >= gridCols) {
      col = 0;
      row += 1;
    }
  }

  ctx.fillStyle = '#f7f7f7';
  ctx.fillRect(0, height - 70, width, 70);
  ctx.fillStyle = '#404040';
  ctx.font = '400 16px/20px adobe-clean, sans-serif';
  ctx.fillText('color.adobe.com', 51, height - 27);

  return canvas.toDataURL(MIME_TYPES.JPEG);
}

/**
 * @param {ThemeData} themeData
 * @returns {string}
 */
export function renderPantoneJPEG(themeData) {
  const specs = PANTONE_JPEG_SPECS;
  const { swatches } = themeData;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = specs.PAGE_WIDTH;
  canvas.height = specs.PAGE_HEIGHT;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, specs.PAGE_WIDTH, specs.PAGE_HEIGHT);

  const cardWidth = (specs.PAGE_WIDTH - 2 * specs.FILE_MARGIN_LEFT_RIGHT
    - (swatches.length - 1) * specs.DISTANCE_BETWEEN_CARDS) / swatches.length;

  swatches.forEach((swatch, i) => {
    const x = specs.FILE_MARGIN_LEFT_RIGHT + i * (cardWidth + specs.DISTANCE_BETWEEN_CARDS);
    const y = specs.FILE_MARGIN_TOP;

    const r = Math.round(swatch.rgb.r * 255);
    const g = Math.round(swatch.rgb.g * 255);
    const b = Math.round(swatch.rgb.b * 255);

    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(x, y, specs.SWATCH_DIMENSION, specs.SWATCH_DIMENSION);

    ctx.strokeStyle = '#e0e0e0';
    ctx.strokeRect(
      x,
      y + specs.SWATCH_DIMENSION,
      specs.SWATCH_DIMENSION,
      specs.CARD_HEIGHT - specs.SWATCH_DIMENSION,
    );

    if (swatch.pantone) {
      ctx.fillStyle = '#000000';
      ctx.font = '700 24px/30px Helvetica Neue, sans-serif';
      ctx.fillText(
        swatch.pantone,
        x + specs.PANTONE_LOGO_MARGIN_LEFT,
        y + specs.SWATCH_DIMENSION + specs.PANTONE_COLOR_CODE_MARGIN_TOP + 60,
      );
    }
  });

  ctx.fillStyle = '#404040';
  ctx.font = '400 16px/20px adobe-clean, sans-serif';
  ctx.fillText('color.adobe.com', 51, specs.COLOR_BRANDING_TEXT_MARGIN_TOP);

  return canvas.toDataURL(MIME_TYPES.JPEG, 1);
}
