export function profile(space, { curveType = 'curv', gamma = 563 / 256 } = {}) {
  const adobe = space === 'adobe-rgb';
  const tags = adobe
    ? ['rXYZ', 'gXYZ', 'bXYZ', 'wtpt', 'rTRC', 'gTRC', 'bTRC']
    : ['rXYZ', 'gXYZ', 'bXYZ'];
  const tableEnd = 132 + tags.length * 12;
  const bytes = new Uint8Array(tableEnd + (adobe ? 128 : 60));
  const view = new DataView(bytes.buffer);
  const write = (offset, text) => [...text].forEach((char, i) => {
    bytes[offset + i] = char.charCodeAt(0);
  });
  view.setUint32(0, bytes.length);
  view.setUint32(8, curveType === 'para' ? 0x04300000 : 0x02400000);
  write(12, 'mntr');
  write(16, 'RGB ');
  write(20, 'XYZ ');
  write(36, 'acsp');
  [0.9642, 1, 0.8249].forEach((value, i) => view.setInt32(68 + i * 4, Math.round(value * 65536)));
  view.setUint32(128, tags.length);
  const matrices = {
    srgb: [[0.436075, 0.222505, 0.013932], [0.385065, 0.716879, 0.097105],
      [0.14308, 0.060617, 0.714173]],
    p3: [[0.515102, 0.241182, -0.001049], [0.291965, 0.692236, 0.041882],
      [0.157153, 0.066581, 0.784378]],
    'adobe-rgb': [[0.6097559, 0.3111242, 0.0194811], [0.2052401, 0.6256560, 0.0608902],
      [0.1492240, 0.0632197, 0.7448387]],
  };
  let offset = tableEnd;
  tags.forEach((tag, index) => {
    const curve = tag.endsWith('TRC');
    const size = curve ? 16 : 20;
    write(132 + index * 12, tag);
    view.setUint32(136 + index * 12, offset);
    view.setUint32(140 + index * 12, size);
    write(offset, curve ? curveType : 'XYZ ');
    if (curve) {
      if (curveType === 'curv') {
        view.setUint32(offset + 8, 1);
        view.setUint16(offset + 12, Math.round(gamma * 256));
      } else {
        view.setInt32(offset + 12, Math.round(gamma * 65536));
      }
    } else {
      const values = tag === 'wtpt' ? [0.9642, 1, 0.8249] : matrices[space][index];
      values.forEach((value, channel) => {
        view.setInt32(offset + 8 + channel * 4, Math.round(value * 65536));
      });
    }
    offset += size;
  });
  return bytes;
}

function xor(left, right) {
  let value = 0;
  for (let bit = 1; bit <= 0x80000000; bit *= 2) {
    if (Math.floor(left / bit) % 2 !== Math.floor(right / bit) % 2) value += bit;
  }
  return value;
}

export function pngChunk(tag, data) {
  const bytes = new Uint8Array(data.length + 12);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, data.length);
  [...tag].forEach((char, index) => { bytes[index + 4] = char.charCodeAt(0); });
  bytes.set(data, 8);
  let crc = 0xffffffff;
  bytes.subarray(4, bytes.length - 4).forEach((value) => {
    crc = xor(crc, value);
    for (let i = 0; i < 8; i += 1) {
      crc = xor(Math.floor(crc / 2), crc % 2 ? 0xedb88320 : 0);
    }
  });
  view.setUint32(bytes.length - 4, 0xffffffff - crc);
  return bytes;
}

export function metadataPNG(chunks) {
  const header = new Uint8Array(13);
  const view = new DataView(header.buffer);
  view.setUint32(0, 11);
  view.setUint32(4, 7);
  const pieces = [
    new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', header), ...chunks, pngChunk('IEND', new Uint8Array()),
  ];
  const bytes = new Uint8Array(pieces.reduce((sum, piece) => sum + piece.length, 0));
  let offset = 0;
  pieces.forEach((piece) => {
    bytes.set(piece, offset);
    offset += piece.length;
  });
  return bytes;
}

export async function compressedICC(icc) {
  const stream = new Blob([icc]).stream().pipeThrough(new CompressionStream('deflate'));
  const compressed = new Uint8Array(await new Response(stream).arrayBuffer());
  const bytes = new Uint8Array(compressed.length + 3);
  bytes[0] = 112;
  bytes.set(compressed, 3);
  return pngChunk('iCCP', bytes);
}

export async function taggedImage(blob, space = 'adobe-rgb') {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const view = new DataView(bytes.buffer);
  const icc = profile(space);
  const parts = [];
  if (blob.type === 'image/png') {
    parts.push(bytes.subarray(0, 8));
    for (let offset = 8; offset + 12 <= bytes.length;) {
      const length = view.getUint32(offset);
      const tag = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
      if (!['iCCP', 'cICP', 'sRGB', 'gAMA', 'cHRM'].includes(tag)) {
        parts.push(bytes.subarray(offset, offset + length + 12));
      }
      if (tag === 'IHDR') {
        parts.push(await compressedICC(icc));
        const gamma = new Uint8Array(4);
        new DataView(gamma.buffer).setUint32(0, 45455);
        parts.push(pngChunk('gAMA', gamma));
      }
      offset += length + 12;
    }
  } else if (blob.type === 'image/jpeg') {
    const signature = new TextEncoder().encode('ICC_PROFILE\0');
    const middle = Math.floor(icc.length / 2);
    parts.push(bytes.subarray(0, 2));
    [icc.subarray(0, middle), icc.subarray(middle)].forEach((data, index) => {
      const chunk = new Uint8Array(data.length + 19);
      chunk.set([255, 255, 226], 0);
      new DataView(chunk.buffer).setUint16(3, data.length + 16);
      chunk.set(signature, 5);
      chunk.set([index + 1, 2], 17);
      chunk.set(data, 19);
      parts.push(chunk);
    });
    for (let offset = 2; offset < bytes.length;) {
      const start = offset;
      while (bytes[offset] === 255) offset += 1;
      const marker = bytes[offset];
      offset += 1;
      if (marker === 218 || marker === 217) {
        parts.push(bytes.subarray(start));
        break;
      }
      if (marker === 1 || (marker >= 208 && marker <= 215)) {
        parts.push(bytes.subarray(start, offset));
      } else {
        const length = view.getUint16(offset);
        if (marker !== 226 || !signature.every((value, i) => bytes[offset + 2 + i] === value)) {
          parts.push(bytes.subarray(start, offset + length));
        }
        offset += length;
      }
    }
  } else if (blob.type === 'image/webp') {
    const header = bytes.slice(0, 12);
    const extended = new Uint8Array(18);
    extended.set(new TextEncoder().encode('VP8X'));
    new DataView(extended.buffer).setUint32(4, 10, true);
    extended[8] = 32;
    let hasExtended = false;
    let width;
    let height;
    const chunks = [];
    for (let offset = 12; offset + 8 <= bytes.length;) {
      const tag = String.fromCharCode(...bytes.subarray(offset, offset + 4));
      const length = view.getUint32(offset + 4, true);
      const end = offset + 8 + length + (length % 2);
      const chunk = bytes.slice(offset, end);
      if (tag === 'VP8X') {
        if (!(Math.floor(chunk[8] / 32) % 2)) chunk[8] += 32;
        parts.push(chunk);
        hasExtended = true;
      } else if (tag !== 'ICCP') chunks.push(chunk);
      if (tag === 'VP8 ') {
        width = view.getUint16(offset + 14, true) % 16384;
        height = view.getUint16(offset + 16, true) % 16384;
      } else if (tag === 'VP8L') {
        const packed = view.getUint32(offset + 9, true);
        width = 1 + (packed % 16384);
        height = 1 + (Math.floor(packed / 16384) % 16384);
        if (Math.floor(packed / 0x10000000) % 2) extended[8] += 16;
      }
      offset = end;
    }
    if (!hasExtended) {
      [width, height].forEach((value, index) => {
        for (let channel = 0; channel < 3; channel += 1) {
          extended[12 + index * 3 + channel] = Math.floor((value - 1) / (256 ** channel)) % 256;
        }
      });
      parts.push(extended);
    }
    const iccChunk = new Uint8Array(8 + icc.length + (icc.length % 2));
    iccChunk.set(new TextEncoder().encode('ICCP'));
    new DataView(iccChunk.buffer).setUint32(4, icc.length, true);
    iccChunk.set(icc, 8);
    parts.push(iccChunk, ...chunks);
    const size = 4 + parts.reduce((sum, part) => sum + part.length, 0);
    new DataView(header.buffer).setUint32(4, size, true);
    parts.unshift(header);
  } else throw new Error('Unsupported fixture type');
  return new Blob(parts, { type: blob.type });
}
