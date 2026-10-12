export const MAX_FILE_BYTES = 40 * 1024 * 1024;
export const MAX_PIXELS = 16000000;
const PROFILE_LIMIT = 4 * 1024 * 1024;
const TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const text = (bytes, start, length) => (
  String.fromCharCode(...bytes.subarray(start, start + length))
);
const uint32 = (bytes, offset, little = false) => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return view.getUint32(offset, little);
};

export function validateDimensions(width, height, textureLimit = Infinity) {
  if (!Number.isInteger(width) || !Number.isInteger(height)
    || width <= 0 || height <= 0 || width * height > MAX_PIXELS
    || width > textureLimit || height > textureLimit) throw new Error('imageTooLarge');
}

export function identifyICC(bytes) {
  if (bytes.length < 132 || bytes.length > PROFILE_LIMIT
    || text(bytes, 36, 4) !== 'acsp' || text(bytes, 16, 4) !== 'RGB '
    || text(bytes, 20, 4) !== 'XYZ ') throw new Error('unsupportedProfile');
  const declaredSize = uint32(bytes, 0);
  if (declaredSize < 132 || declaredSize > bytes.length) throw new Error('unsupportedProfile');
  const count = uint32(bytes, 128);
  if (132 + count * 12 > declaredSize) throw new Error('unsupportedProfile');
  const primaries = [];
  ['rXYZ', 'gXYZ', 'bXYZ'].forEach((tag) => {
    for (let i = 0; i < count; i += 1) {
      const entry = 132 + i * 12;
      if (text(bytes, entry, 4) === tag) {
        const offset = uint32(bytes, entry + 4);
        const size = uint32(bytes, entry + 8);
        if (size < 20 || offset + size > declaredSize || text(bytes, offset, 4) !== 'XYZ ') {
          throw new Error('unsupportedProfile');
        }
        const view = new DataView(bytes.buffer, bytes.byteOffset + offset, size);
        primaries.push([8, 12, 16].map((index) => view.getInt32(index) / 65536));
        break;
      }
    }
  });
  const matrices = {
    srgb: [[0.436075, 0.222505, 0.013932], [0.385065, 0.716879, 0.097105],
      [0.14308, 0.060617, 0.714173]],
    'display-p3': [[0.515102, 0.241182, -0.001049], [0.291965, 0.692236, 0.041882],
      [0.157153, 0.066581, 0.784378]],
  };
  const match = Object.entries(matrices).find(([, matrix]) => primaries.length === 3
    && primaries.every((primary, index) => primary.every(
      (value, channel) => Math.abs(value - matrix[index][channel]) < 0.003,
    )));
  if (!match) throw new Error('unsupportedProfile');
  return match[0];
}

async function inflateProfile(bytes) {
  const reader = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate')).getReader();
  const chunks = [];
  let length = 0;
  try {
    let chunk = await reader.read();
    while (!chunk.done) {
      const { value } = chunk;
      length += value.length;
      if (length > PROFILE_LIMIT) {
        await reader.cancel();
        throw new Error('unsupportedProfile');
      }
      chunks.push(value);
      chunk = await reader.read();
    }
  } catch (cause) {
    throw new Error('unsupportedProfile', { cause });
  } finally {
    reader.releaseLock();
  }
  const result = new Uint8Array(length);
  let offset = 0;
  chunks.forEach((chunk) => {
    result.set(chunk, offset);
    offset += chunk.length;
  });
  return identifyICC(result);
}

export async function inspectImage(bytes, type) {
  let space = 'srgb';
  let dimensions;
  let embeddedSpace;
  const profiles = new Set();
  const profile = (tag, detectedSpace) => {
    if (profiles.has(tag) || (embeddedSpace && embeddedSpace !== detectedSpace)) {
      throw new Error('unsupportedProfile');
    }
    profiles.add(tag);
    embeddedSpace = detectedSpace;
    space = detectedSpace;
  };
  if (type === 'image/png') {
    if (![137, 80, 78, 71, 13, 10, 26, 10].every((value, i) => bytes[i] === value)) {
      throw new Error('unsupportedFile');
    }
    for (let offset = 8; offset + 12 <= bytes.length;) {
      const length = uint32(bytes, offset);
      const end = offset + 12 + length;
      if (end > bytes.length) throw new Error('unsupportedFile');
      const tag = text(bytes, offset + 4, 4);
      const data = bytes.subarray(offset + 8, end - 4);
      if (tag === 'IHDR') {
        if (dimensions || length !== 13) throw new Error('unsupportedFile');
        dimensions = [uint32(data, 0), uint32(data, 4)];
      }
      if (tag === 'iCCP') {
        const separator = data.indexOf(0);
        if (separator < 1 || data[separator + 1] !== 0) throw new Error('unsupportedProfile');
        profile(tag, await inflateProfile(data.subarray(separator + 2)));
      }
      if (tag === 'cICP') {
        if (data.length !== 4 || ![1, 12].includes(data[0])
          || data[1] !== 13 || data[2] !== 0 || data[3] !== 1) {
          throw new Error('unsupportedProfile');
        }
        profile(tag, data[0] === 12 ? 'display-p3' : 'srgb');
      }
      offset = end;
      if (tag === 'IEND') break;
    }
  } else if (type === 'image/jpeg') {
    if (bytes[0] !== 255 || bytes[1] !== 216) throw new Error('unsupportedFile');
    const segments = new Map();
    let segmentCount = 0;
    for (let offset = 2; offset < bytes.length;) {
      if (bytes[offset] !== 255) throw new Error('unsupportedFile');
      while (bytes[offset] === 255) offset += 1;
      const marker = bytes[offset];
      offset += 1;
      if (marker === 218 || marker === 217) break;
      if (marker !== 1 && !(marker >= 208 && marker <= 215)) {
        if (!marker || marker === 216 || offset + 2 > bytes.length) {
          throw new Error('unsupportedFile');
        }
        const length = bytes[offset] * 256 + bytes[offset + 1];
        if (length < 2 || offset + length > bytes.length) throw new Error('unsupportedFile');
        const data = bytes.subarray(offset + 2, offset + length);
        if ([192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207].includes(marker)) {
          if (data.length < 6) throw new Error('unsupportedFile');
          dimensions = [data[3] * 256 + data[4], data[1] * 256 + data[2]];
        }
        if (marker === 226 && text(data, 0, 12) === 'ICC_PROFILE\0') {
          if (!data[12] || !data[13] || data[12] > data[13]
            || segments.has(data[12]) || (segmentCount && segmentCount !== data[13])) {
            throw new Error('unsupportedProfile');
          }
          [, segmentCount] = data.subarray(12, 14);
          segments.set(data[12], data.subarray(14));
        }
        offset += length;
      }
    }
    if (segmentCount) {
      if (segments.size !== segmentCount) throw new Error('unsupportedProfile');
      const length = [...segments.values()].reduce((sum, chunk) => sum + chunk.length, 0);
      if (length > PROFILE_LIMIT) throw new Error('unsupportedProfile');
      const iccBytes = new Uint8Array(length);
      let offset = 0;
      for (let i = 1; i <= segmentCount; i += 1) {
        iccBytes.set(segments.get(i), offset);
        offset += segments.get(i).length;
      }
      space = identifyICC(iccBytes);
    }
  } else if (type === 'image/webp') {
    if (text(bytes, 0, 4) !== 'RIFF' || text(bytes, 8, 4) !== 'WEBP') {
      throw new Error('unsupportedFile');
    }
    for (let offset = 12; offset + 8 <= bytes.length;) {
      const tag = text(bytes, offset, 4);
      const length = uint32(bytes, offset + 4, true);
      if (offset + 8 + length > bytes.length) throw new Error('unsupportedFile');
      const data = bytes.subarray(offset + 8, offset + 8 + length);
      if (tag === 'ICCP') profile(tag, identifyICC(data));
      if (tag === 'VP8X' && length >= 10) {
        const read24 = (i) => 1 + data[i] + data[i + 1] * 256 + data[i + 2] * 65536;
        dimensions = [read24(4), read24(7)];
      } else if (tag === 'VP8L' && length >= 5 && data[0] === 47) {
        const packed = uint32(data, 1, true);
        dimensions = [1 + (packed % 16384), 1 + (Math.floor(packed / 16384) % 16384)];
      } else if (tag === 'VP8 ' && length >= 10) {
        dimensions = [(data[6] + data[7] * 256) % 16384, (data[8] + data[9] * 256) % 16384];
      }
      offset += 8 + length + (length % 2);
    }
  } else throw new Error('unsupportedFile');
  if (!dimensions) throw new Error('unsupportedFile');
  return { colorSpace: space, width: dimensions[0], height: dimensions[1] };
}

export async function decodeImage(file, textureLimit = Infinity) {
  const type = file?.type?.split(';')[0].trim().toLowerCase();
  if (!file || !TYPES.includes(type)) throw new Error('unsupportedFile');
  if (file.size > MAX_FILE_BYTES) throw new Error('fileTooLarge');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { colorSpace, width, height } = await inspectImage(bytes, type);
  validateDimensions(width, height, textureLimit);
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    validateDimensions(image.naturalWidth, image.naturalHeight, textureLimit);
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d', { colorSpace, willReadFrequently: true });
    if (!context || (colorSpace === 'display-p3'
      && context.getContextAttributes()?.colorSpace !== colorSpace)) {
      throw new Error('p3Unavailable');
    }
    context.drawImage(image, 0, 0);
    const data = context.getImageData(0, 0, canvas.width, canvas.height, { colorSpace });
    if (colorSpace === 'display-p3' && data.colorSpace !== colorSpace) {
      throw new Error('p3Unavailable');
    }
    return {
      url,
      image,
      colorSpace,
      width: canvas.width,
      height: canvas.height,
      pixels: data.data,
      destroy: () => URL.revokeObjectURL(url),
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}
