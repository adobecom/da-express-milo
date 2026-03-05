/* eslint-disable */
/**
 * Inline Web Worker for intelligent color extraction from images.
 * Ported from colorweb's imageExtraction.js — uses HSV histogram binning,
 * mood-weighted normalization, and energy-minimization color selection.
 */

const WORKER_SOURCE = `
var NUM_BINS_H = 64;
var NUM_BINS_S = 64;
var NUM_BINS_V = 10;
var HISTOGRAM_SIZE = NUM_BINS_H * NUM_BINS_S * NUM_BINS_V;

function emptyArray(length) {
  return self.Float64Array ? new Float64Array(length) : new Array(length).fill(0);
}

function copyArray(length, oldArray) {
  if (self.Float64Array) {
    var copy = new Float64Array(length);
    copy.set(oldArray);
    return copy;
  }
  var array = new Array(length);
  for (var i = 0; i < length; i++) array[i] = oldArray[i];
  return array;
}

function copyHistogram(old) { return copyArray(HISTOGRAM_SIZE, old); }

/* --- Color math --- */

var color = {
  hexToString: function(value) {
    var hex = value.toString(16);
    return '000000'.substr(0, 6 - hex.length) + hex;
  },
  rgbToHsv: function(rgb) {
    var h = 0, r = rgb.r, g = rgb.g, b = rgb.b;
    var min = (r < g && r < b) ? r : (g < b) ? g : b;
    var v = (r > g && r > b) ? r : (g > b) ? g : b;
    var s = v === 0 ? 0 : (v - min) / v;
    var delta = s === 0 ? 0.00001 : v - min;
    switch (v) {
      case r: h = (g - b) / delta; break;
      case g: h = 2 + (b - r) / delta; break;
      case b: h = 4 + (r - g) / delta; break;
    }
    return { h: (1000 + h / 6) % 1, s: s, v: v };
  },
  hsvToRgb: function(hsv) {
    var h = (hsv.h + 1000) % 1, s = hsv.s, v = hsv.v;
    var r = 0, g = 0, b = 0;
    var i = h * 6 >> 0, f = h * 6 - i;
    var p = v * (1 - s), q = v * (1 - s * f), t = v * (1 - s * (1 - f));
    switch (i) {
      case 0: r=v;g=t;b=p; break;
      case 1: r=q;g=v;b=p; break;
      case 2: r=p;g=v;b=t; break;
      case 3: r=p;g=q;b=v; break;
      case 4: r=t;g=p;b=v; break;
      case 5: r=v;g=p;b=q; break;
    }
    return { r: r, g: g, b: b };
  },
  rgbToXyz: function(rgb) {
    var r = rgb.r, g = rgb.g, b = rgb.b;
    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
    return {
      x: (0.4124*r + 0.3576*g + 0.1805*b) * 100 / 95.047,
      y: (0.2126*r + 0.7152*g + 0.0722*b),
      z: (0.0193*r + 0.1192*g + 0.9505*b) * 100 / 108.883
    };
  },
  rgbToLab: function(rgb) {
    var xyz = this.rgbToXyz(rgb);
    var fx = xyz.x > 0.008856 ? Math.pow(xyz.x, 1/3) : 7.787*xyz.x + 0.1379;
    var fy = xyz.y > 0.008856 ? Math.pow(xyz.y, 1/3) : 7.787*xyz.y + 0.1379;
    var fz = xyz.z > 0.008856 ? Math.pow(xyz.z, 1/3) : 7.787*xyz.z + 0.1379;
    return {
      l: (116*fy - 16) / 100.0,
      a: (500*(fx - fy) + 128) / 255,
      b: (200*(fy - fz) + 128) / 255
    };
  },
  valuesToHex: function(mode, values) {
    var rgb = this.hsvToRgb({ h: values[0], s: values[1], v: values[2] });
    function limit01(val) { return val < 0 ? 0 : val > 1 ? 1 : val; }
    rgb = { r: limit01(rgb.r), g: limit01(rgb.g), b: limit01(rgb.b) };
    return this.hexToString(
      (Math.round(rgb.r*255) << 16 | Math.round(rgb.g*255) << 8 | Math.round(rgb.b*255)) >>> 0
    ).toUpperCase();
  }
};

/* --- Harmony math --- */

var IHM = {};

IHM.weight = function(hue, saturation, value, cfEnh, shSupp) {
  var minWeight = 0.001;
  var w = IHM.suppression(IHM.colorfulness(hue, saturation, value), cfEnh) *
          IHM.suppression(value, shSupp) *
          IHM.tripleCubicSigmoid(saturation, 0.0, 30.0) *
          IHM.tripleCubicSigmoid(value, 0.0, 30.0);
  return w < minWeight ? minWeight : w;
};

IHM.colorfulness = function(hue, saturation, value) {
  var lab = color.rgbToLab(color.hsvToRgb({ h: hue/255, s: saturation/255, v: value/255 }));
  var a = lab.a * 2.0 - 1.0;
  var b = lab.b * 2.0 - 1.0;
  return 255.0 * Math.sqrt(0.5 * (a*a + b*b));
};

IHM.tripleCubicSigmoid = function(x, x1, x2) {
  var range = x2 - x1;
  return range > 0 ? IHM.cubicSigmoid((x - x1) / range) : 1.0;
};

IHM.suppression = function(value, amount) {
  if (amount < 0) { amount *= -1; value = 255 - value; }
  var s = value / 255;
  var f = amount < 0.5 ? 2 * amount : 1;
  var g = amount < 0.5 ? 0 : 2 * amount - 1;
  return Math.pow(f * IHM.cubicSigmoid(s) + (1 - f), 1 + g * 3);
};

IHM.cubicSigmoid = function(x) {
  if (x < 0) return 0;
  if (x > 1) return 1;
  var y = 2 * x - 1;
  return 0.5 * (1 + y * (1.5 - 0.5 * y * y));
};

IHM.hsvToLab = function(p) {
  p.rgb = color.hsvToRgb({ h: p.hsv.h, s: p.hsv.s, v: p.hsv.v });
  var lab = color.rgbToLab(p.rgb);
  lab.l *= 255; lab.a *= 255; lab.b *= 255;
  p.gregLab = lab;
};

IHM.weightedDistanceLab = function(p1, p2, gBB, gSS) {
  if (!p1.gregLab) IHM.hsvToLab(p1);
  if (!p2.gregLab) IHM.hsvToLab(p2);
  var dL = p1.gregLab.l - p2.gregLab.l;
  var da = p1.gregLab.a - p2.gregLab.a;
  var db = p1.gregLab.b - p2.gregLab.b;
  var s1 = Math.sqrt(p1.gregLab.a*p1.gregLab.a + p1.gregLab.b*p1.gregLab.b);
  var s2 = Math.sqrt(p2.gregLab.a*p2.gregLab.a + p2.gregLab.b*p2.gregLab.b);
  var dSat2 = (s1 - s2) * (s1 - s2);
  var dHue2 = da*da + db*db - dSat2;
  return Math.sqrt(gBB * dL*dL + gSS * dSat2 + dHue2);
};

/* --- Intersection energy --- */

var INF_ENERGY = 1.79769e+305;
var EPSILON = 1e-10;

function intersectionEnergy(p1, p2, hcRadius, cRepulsion, gBB, gSS) {
  if (p1.density < EPSILON || p2.density < EPSILON) return INF_ENERGY;
  var d = IHM.weightedDistanceLab(p1.color, p2.color, gBB, gSS);
  if (d < hcRadius) return INF_ENERGY * (1 - d / hcRadius);
  return cRepulsion * (1 / d - 1 / hcRadius);
}

/* --- ColorStyle (mood parameters) --- */

function ColorStyle(mood) {
  var ce = 0.5, sh = 0;
  switch ((mood || '').toLowerCase()) {
    case 'bright': ce = 0.88; sh = 0.75; break;
    case 'dark': ce = -0.8; sh = -0.8; break;
    case 'muted': ce = -0.8; sh = 0.6; break;
    case 'deep': ce = 0.6; sh = -0.7; break;
    case 'colorful': ce = 0.5; sh = 0; break;
    default: ce = 0.5; sh = 0;
  }
  this.gHH = 1.0;
  this.gSS = 0.23;
  this.gBB = 0.04;
  this.colorRepulsion = 2.5;
  this.hardCoreInteractionRadius = 4.0;
  this.colorfulnessEnhancement = ce;
  this.shadowHighlightSuppression = sh;
}

/* --- BitmapData --- */

function BitmapData(imageData, width, height) {
  this._data = imageData;
  this._width = width;
  this._height = height;
}

function getPixel(bd, x, y) {
  var i = (x + y * bd._width) * 4;
  return { r: bd._data.data[i], g: bd._data.data[i+1], b: bd._data.data[i+2] };
}

/* --- HarmonyPoint --- */

function HarmonyPoint(col, density) {
  this.color = col;
  this.density = density;
}

HarmonyPoint.sort = function(a, b) {
  var h1 = a.color.hsv, h2 = b.color.hsv;
  if (h1.h !== h2.h) return h2.h - h1.h;
  if (h1.s !== h2.s) return h2.s - h1.s;
  return h2.v - h1.v;
};

/* --- ImageHarmony (main extraction) --- */

function ImageHarmony() {
  this._colors = [];
  this.points = [];
  this.finalColor = [];
  this._harmonyPoints = [];
}

ImageHarmony.prototype.extract = function(bd, style, numColors) {
  this._bd = bd;
  this._style = style;
  this._numColors = numColors;
  this._histogram = emptyArray(HISTOGRAM_SIZE);
  this._genHistogram();
  this._weightHistogram();
  this._findBestColors();
  this._findBestPoints();
};

ImageHarmony.prototype._genHistogram = function() {
  var bd = this._bd, w = bd._width, h = bd._height;
  var hist = this._histogram;
  var ch = 255/256*NUM_BINS_H, cs = 255/256*NUM_BINS_S, cv = 255/256*NUM_BINS_V;
  for (var y = 0; y < h; y++) {
    for (var x = 0; x < w; x++) {
      var rgb = getPixel(bd, x, y);
      var hsv = color.rgbToHsv({ r: rgb.r/255, g: rgb.g/255, b: rgb.b/255 });
      var bh = ~~(hsv.h*ch), bs = ~~(hsv.s*cs), bv = ~~(hsv.v*cv);
      hist[(bh*NUM_BINS_S + bs)*NUM_BINS_V + bv]++;
    }
  }
};

ImageHarmony.prototype._weightHistogram = function() {
  var ce = this._style.colorfulnessEnhancement;
  var sh = this._style.shadowHighlightSuppression;
  var hist = copyHistogram(this._histogram);
  var maxD = 0, nh = NUM_BINS_H, ns = NUM_BINS_S, nv = NUM_BINS_V;

  for (var h = 0; h < nh; h++) {
    var hue = ~~((h*256 + nh/2) / nh);
    if (hue > 255) hue = 255;
    for (var s = 0; s < ns; s++) {
      var sat = ~~((s*256 + ns/2) / ns);
      if (sat > 255) sat = 255;
      for (var v = 0; v < nv; v++) {
        var idx = (h*NUM_BINS_S + s)*NUM_BINS_V + v;
        if (hist[idx] === 0) continue;
        var val = ~~(((v + 0.5)*256) / nv);
        var d = hist[idx] *= IHM.weight(hue, sat, val, ce, sh);
        if (d > maxD) maxD = d;
      }
    }
  }

  var minD = 0.01;
  var maxLog = maxD > minD ? Math.log(maxD / minD) : 0;
  if (maxLog > 0) {
    for (var h2 = 0; h2 < nh; h2++) {
      for (var s2 = 0; s2 < ns; s2++) {
        for (var v2 = 0; v2 < nv; v2++) {
          var idx2 = (h2*NUM_BINS_S + s2)*NUM_BINS_V + v2;
          if (hist[idx2] === 0) continue;
          hist[idx2] = hist[idx2] > minD ? Math.log(hist[idx2] / minD) / maxLog : 0;
        }
      }
    }
  }
  this._wHist = hist;
};

ImageHarmony.prototype._findBestColors = function() {
  var style = this._style, hist = this._wHist, n = this._numColors;
  var nh = NUM_BINS_H, ns = NUM_BINS_S, nv = NUM_BINS_V;
  var pts = [];

  for (var h = 0; h < nh; h++) {
    var hue = ~~(~~((h*256 + nh/2) / nh) * 1.411);
    for (var s = 0; s < ns; s++) {
      var sat = ~~((s*256 + ns/2) / ns * 0.392);
      if (sat > 100) sat = 100;
      for (var v = 0; v < nv; v++) {
        var idx = (h*NUM_BINS_S + s)*NUM_BINS_V + v;
        if (hist[idx] === 0) continue;
        var val = ~~(((v + 0.5)*256) / nv * 0.392);
        var col = { hsv: { h: hue/360, s: sat/100, v: val/100 } };
        pts.push(new HarmonyPoint(col, hist[idx]));
      }
    }
  }

  var hcR = style.hardCoreInteractionRadius, cR = style.colorRepulsion;
  var gBB = style.gBB, gSS = style.gSS;
  var best = [];

  for (var a = 0; a < n; a++) {
    var minE = 1e100, bestPt = pts[0];
    for (var i = 0; i < pts.length; i++) {
      var energy = 1 - pts[i].density;
      for (var j = 0; j < best.length; j++) {
        energy += intersectionEnergy(pts[i], best[j], hcR, cR, gBB, gSS);
      }
      if (energy < minE) { minE = energy; bestPt = pts[i]; }
    }
    best.push(bestPt);
  }
  this._harmonyPoints = best;
};

ImageHarmony.prototype._findBestPoints = function() {
  var hp = this._harmonyPoints;
  hp.sort(HarmonyPoint.sort);
  for (var i = 0; i < hp.length; i++) {
    this._colors.push(hp[i].color);
    this.points.push(this._findPixel(this._colors[i]));
  }
  this.finalColor = this._colors;
};

ImageHarmony.prototype._findPixel = function(col) {
  var bd = this._bd, w = bd._width, h = bd._height;
  var cr = col.rgb.r*255, cg = col.rgb.g*255, cb = col.rgb.b*255;
  var minDist = 1.79769e+305, rx = 0, ry = 0, done = false;
  for (var y = 0; !done && y < h; y++) {
    for (var x = 0; !done && x < w; x++) {
      var px = getPixel(bd, x, y);
      var dr = px.r - cr, dg = px.g - cg, db = px.b - cb;
      var dist = dr*dr + dg*dg + db*db;
      if (dist < minDist) {
        rx = x; ry = y; minDist = dist;
        if (dist <= 12) done = true;
      }
    }
  }
  return { x: rx, y: ry };
};

/* --- Worker message handler --- */

self.addEventListener('message', function(e) {
  var d = e.data;
  var harmony = new ImageHarmony();
  var bd = new BitmapData(d.imageData, d.width, d.height);
  var style = new ColorStyle(d.mood || 'colorful');
  harmony.extract(bd, style, d.swatchCount);

  var colors = harmony.finalColor.map(function(c) {
    return '#' + color.valuesToHex('hsv', [c.hsv.h, c.hsv.s, c.hsv.v]);
  });

  var points = harmony.points.map(function(p) {
    return { x: p.x / d.width, y: p.y / d.height };
  });

  self.postMessage({ colors: colors, points: points });
});
`;

let _worker = null;

function getWorker() {
  if (!_worker) {
    const blob = new Blob([WORKER_SOURCE], { type: 'application/javascript' });
    _worker = new Worker(URL.createObjectURL(blob));
  }
  return _worker;
}

/**
 * Extract colors from an image using HSV histogram analysis.
 * @param {ImageData} imageData - Canvas image data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {number} swatchCount - Number of colors to extract
 * @param {string} mood - Extraction mood (colorful, bright, muted, deep, dark)
 * @returns {Promise<{colors: string[], points: {x:number, y:number}[]}>}
 *   colors: hex strings; points: normalized 0-1 coordinates on the image
 */
export function extractColorsFromImage(imageData, width, height, swatchCount, mood = 'colorful') {
  return new Promise((resolve, reject) => {
    const worker = getWorker();

    const onMessage = (e) => {
      worker.removeEventListener('message', onMessage);
      worker.removeEventListener('error', onError);
      resolve(e.data);
    };

    const onError = (err) => {
      worker.removeEventListener('message', onMessage);
      worker.removeEventListener('error', onError);
      reject(err);
    };

    worker.addEventListener('message', onMessage);
    worker.addEventListener('error', onError);
    worker.postMessage({ imageData, width, height, swatchCount, mood });
  });
}

export function terminateWorker() {
  if (_worker) {
    _worker.terminate();
    _worker = null;
  }
}
