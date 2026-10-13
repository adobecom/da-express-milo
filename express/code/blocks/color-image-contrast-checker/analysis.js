import { ADOBE_RGB_GAMMA, validateDimensions } from './image.js';

export const LUMINANCE = Object.freeze({
  srgb: [0.2126, 0.7152, 0.0722],
  'display-p3': [0.2289745641, 0.6917385218, 0.0792869141],
  'adobe-rgb': [591459 / 1989134, 6239551 / 9945670, 374412 / 4972835],
});

export function linearize(channel, colorSpace = 'srgb') {
  if (colorSpace === 'adobe-rgb') return channel ** ADOBE_RGB_GAMMA;
  return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

export function luminance(rgb, colorSpace) {
  if (!LUMINANCE[colorSpace]) throw new Error('unsupportedProfile');
  const values = rgb.slice(0, 3).map((channel) => linearize(channel / 255, colorSpace));
  return values.reduce((sum, value, index) => sum + value * LUMINANCE[colorSpace][index], 0);
}

export function contrast(first, second) {
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

export function classify(ratio) {
  if (ratio >= 4.5) return [0, 255, 0];
  if (ratio >= 3) return [0, 128, 242];
  return [0, 0, 0];
}

const VERTEX = `
attribute vec2 position;
varying vec2 uv;
void main() {
  uv = vec2((position.x + 1.0) / 2.0, (1.0 - position.y) / 2.0);
  gl_Position = vec4(position, 0.0, 1.0);
}`;
const FRAGMENT = `
precision highp float;
uniform sampler2D image;
uniform vec2 dimensions;
uniform vec3 weights;
uniform float exponent;
varying vec2 uv;
float linear(float value) {
  if (exponent > 0.0) return pow(value, exponent);
  return value <= 0.03928 ? value / 12.92 : pow((value + 0.055) / 1.055, 2.4);
}
float brightness(vec2 point) {
  vec3 pixel = texture2D(image, point).rgb;
  return dot(vec3(linear(pixel.r), linear(pixel.g), linear(pixel.b)), weights);
}
void main() {
  float current = brightness(uv);
  float greatest = 1.0;
  for (int y = 0; y < 3; y++) {
    for (int x = 0; x < 3; x++) {
      float neighbor = brightness(uv - vec2(float(x), float(y)) / dimensions);
      greatest = max(greatest, (max(current, neighbor) + 0.05)
        / (min(current, neighbor) + 0.05));
    }
  }
  vec3 result = greatest >= 4.5 ? vec3(0.0, 1.0, 0.0)
    : greatest >= 3.0 ? vec3(0.0, 0.5, 0.95) : vec3(0.0);
  gl_FragColor = vec4(result, 1.0);
}`;

export default function createRenderer(canvas) {
  const gl = canvas.getContext('webgl', { alpha: false, preserveDrawingBuffer: true });
  if (!gl) throw new Error('analysisError');
  const shaders = [];
  const program = gl.createProgram();
  const buffer = gl.createBuffer();
  const texture = gl.createTexture();
  const destroy = () => {
    shaders.forEach((shader) => gl.deleteShader(shader));
    gl.deleteProgram(program);
    gl.deleteBuffer(buffer);
    gl.deleteTexture(texture);
  };
  try {
    [[gl.VERTEX_SHADER, VERTEX], [gl.FRAGMENT_SHADER, FRAGMENT]].forEach(([type, source]) => {
      const shader = gl.createShader(type);
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error('analysisError', { cause: new Error(gl.getShaderInfoLog(shader)) });
      }
      gl.attachShader(program, shader);
    });
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error('analysisError', { cause: new Error(gl.getProgramInfoLog(program)) });
    }
  } catch (error) {
    destroy();
    throw error;
  }
  const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  return {
    maxTextureSize,
    destroy,
    render(source, colorSpace) {
      validateDimensions(source.width, source.height, maxTextureSize);
      if (!LUMINANCE[colorSpace]) throw new Error('unsupportedProfile');
      if (source.pixels.length !== source.width * source.height * 4) {
        throw new Error('analysisError');
      }
      if (gl.isContextLost()) throw new Error('analysisError');
      canvas.width = source.width;
      canvas.height = source.height;
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
      ]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, 'position');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        source.width,
        source.height,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        source.pixels,
      );
      gl.uniform1i(gl.getUniformLocation(program, 'image'), 0);
      gl.uniform2f(gl.getUniformLocation(program, 'dimensions'), source.width, source.height);
      gl.uniform3fv(gl.getUniformLocation(program, 'weights'), LUMINANCE[colorSpace]);
      gl.uniform1f(
        gl.getUniformLocation(program, 'exponent'),
        colorSpace === 'adobe-rgb' ? ADOBE_RGB_GAMMA : 0,
      );
      gl.viewport(0, 0, source.width, source.height);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (gl.getError() !== gl.NO_ERROR) throw new Error('analysisError');
    },
  };
}
