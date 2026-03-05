/**
 * Download/export utilities for color palettes.
 */

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}

function textColor(hex) {
  const { r, g, b } = hexToRgb(hex);
  return (r * 0.299 + g * 0.587 + b * 0.114) > 150 ? '#000000' : '#FFFFFF';
}

/**
 * Download palette as a JPEG image with swatch strips and hex/RGB labels.
 */
export function downloadAsJPEG(swatches, themeName = 'Color Palette') {
  const count = swatches.length;
  const width = 1200;
  const swatchHeight = 240;
  const infoHeight = 80;
  const headerHeight = 60;
  const footerHeight = 40;
  const height = headerHeight + swatchHeight + infoHeight + footerHeight;
  const colWidth = width / count;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#131313';
  ctx.font = 'bold 22px "Adobe Clean", Helvetica, Arial, sans-serif';
  ctx.fillText(themeName, 24, 40);

  swatches.forEach((swatch, i) => {
    const hex = swatch.hex || swatch;
    const x = i * colWidth;
    ctx.fillStyle = hex;
    ctx.fillRect(x, headerHeight, colWidth, swatchHeight);

    const { r, g, b } = hexToRgb(hex);
    const tc = textColor(hex);
    const infoY = headerHeight + swatchHeight;

    ctx.fillStyle = '#F5F5F5';
    ctx.fillRect(x, infoY, colWidth, infoHeight);

    ctx.fillStyle = '#131313';
    ctx.font = 'bold 16px "Adobe Clean", Helvetica, Arial, sans-serif';
    ctx.fillText(hex.toUpperCase(), x + 12, infoY + 28);

    ctx.fillStyle = '#505050';
    ctx.font = '13px "Adobe Clean", Helvetica, Arial, sans-serif';
    ctx.fillText(`RGB ${r}, ${g}, ${b}`, x + 12, infoY + 52);
  });

  ctx.fillStyle = '#909090';
  ctx.font = '12px "Adobe Clean", Helvetica, Arial, sans-serif';
  ctx.fillText('Created with Adobe Express', 24, height - 14);

  canvas.toBlob((blob) => {
    if (blob) triggerDownload(blob, `${themeName.replace(/\s+/g, '_')}.jpg`);
  }, 'image/jpeg', 0.95);
}

/**
 * Download palette as an Adobe Swatch Exchange (.ase) file.
 * ASE is a binary format used by Photoshop, Illustrator, etc.
 */
export function downloadAsASE(swatches, themeName = 'Color Palette') {
  const colors = swatches.map((s) => {
    const hex = s.hex || s;
    const { r, g, b } = hexToRgb(hex);
    return { name: hex.toUpperCase(), r: r / 255, g: g / 255, b: b / 255 };
  });

  const groupName = themeName;
  const enc = new TextEncoder();

  function writeString(view, offset, str) {
    const encoded = enc.encode(str);
    for (let i = 0; i < encoded.length; i += 1) {
      view.setUint8(offset + i, encoded[i]);
    }
  }

  function colorBlockSize(name) {
    return 2 + (name.length + 1) * 2 + 4 + 4 * 3 + 2;
  }

  function groupStartSize(name) {
    return 2 + (name.length + 1) * 2;
  }

  const groupEndSize = 0;

  let totalSize = 12;
  totalSize += 6 + groupStartSize(groupName);
  colors.forEach((c) => { totalSize += 6 + colorBlockSize(c.name); });
  totalSize += 6 + groupEndSize;

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  let offset = 0;

  // Header: "ASEF"
  view.setUint8(offset, 0x41); offset += 1; // A
  view.setUint8(offset, 0x53); offset += 1; // S
  view.setUint8(offset, 0x45); offset += 1; // E
  view.setUint8(offset, 0x46); offset += 1; // F
  // Version 1.0
  view.setUint16(offset, 1); offset += 2;
  view.setUint16(offset, 0); offset += 2;
  // Block count
  view.setUint32(offset, colors.length + 2); offset += 4;

  // Group start
  view.setUint16(offset, 0xC001); offset += 2;
  const gsSize = groupStartSize(groupName);
  view.setUint32(offset, gsSize); offset += 4;
  view.setUint16(offset, groupName.length + 1); offset += 2;
  for (let i = 0; i < groupName.length; i += 1) {
    view.setUint16(offset, groupName.charCodeAt(i)); offset += 2;
  }
  view.setUint16(offset, 0); offset += 2;

  // Color blocks
  colors.forEach((c) => {
    view.setUint16(offset, 0x0001); offset += 2;
    const cbSize = colorBlockSize(c.name);
    view.setUint32(offset, cbSize); offset += 4;
    view.setUint16(offset, c.name.length + 1); offset += 2;
    for (let i = 0; i < c.name.length; i += 1) {
      view.setUint16(offset, c.name.charCodeAt(i)); offset += 2;
    }
    view.setUint16(offset, 0); offset += 2;
    // Color model "RGB "
    view.setUint8(offset, 0x52); offset += 1; // R
    view.setUint8(offset, 0x47); offset += 1; // G
    view.setUint8(offset, 0x42); offset += 1; // B
    view.setUint8(offset, 0x20); offset += 1; // space
    // Float values
    view.setFloat32(offset, c.r); offset += 4;
    view.setFloat32(offset, c.g); offset += 4;
    view.setFloat32(offset, c.b); offset += 4;
    // Color type: 0 = Global
    view.setUint16(offset, 0); offset += 2;
  });

  // Group end
  view.setUint16(offset, 0xC002); offset += 2;
  view.setUint32(offset, groupEndSize); offset += 4;

  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  triggerDownload(blob, `${themeName.replace(/\s+/g, '_')}.ase`);
}

/**
 * Copy palette as CSS custom properties.
 */
export function copyAsCSS(swatches) {
  const lines = swatches.map((s, i) => {
    const hex = (s.hex || s).toUpperCase();
    return `  --color-${i + 1}: ${hex};`;
  });
  const css = `:root {\n${lines.join('\n')}\n}`;
  return navigator.clipboard?.writeText(css).then(() => css) ?? Promise.resolve(css);
}

/**
 * Copy palette as SASS variables.
 */
export function copyAsSASS(swatches) {
  const lines = swatches.map((s, i) => {
    const hex = (s.hex || s).toUpperCase();
    return `$color-${i + 1}: ${hex};`;
  });
  const sass = lines.join('\n');
  return navigator.clipboard?.writeText(sass).then(() => sass) ?? Promise.resolve(sass);
}
