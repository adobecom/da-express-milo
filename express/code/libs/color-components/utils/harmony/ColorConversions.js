/*************************************************************************
* ADOBE CONFIDENTIAL
* ___________________
*
* Copyright 2019 Adobe
* All Rights Reserved.
*
* NOTICE: All information contained herein is, and remains
* the property of Adobe and its suppliers, if any. The intellectual
* and technical concepts contained herein are proprietary to Adobe
* and its suppliers and are protected by all applicable intellectual
* property laws, including trade secret and copyright laws.
* Dissemination of this information or reproduction of this material
* is strictly forbidden unless prior written permission is obtained
* from Adobe.
**************************************************************************/

export const hexToString = value => {
        let hex = value.toString(16);

        hex = '000000'.substr(0, 6 - hex.length) + hex;
        return hex;
    },
    rgbToHsv = rgb => {
        let h = 0;

        const r = rgb.r,
            g = rgb.g,
            b = rgb.b,
            // Faster version of Math.min(r, g, b);
            /* eslint-disable no-extra-parens */
            min = (r < g && r < b) ? r : (g < b) ? g : b,
            v = (r > g && r > b) ? r : (g > b) ? g : b,
            // Faster version of Math.max(r, g, b)
            s = (v === 0) ? 0 : (v - min) / v,
            delta = (s === 0) ? 0.00001 : v - min;
        /* eslint-enable no-extra-parens */

        switch (v) {
            case r: {
                h = (g - b) / delta;
                break;
            }
            case g: {
                h = 2 + (b - r) / delta;
                break;
            }
            case b: {
                h = 4 + (r - g) / delta;
                break;
            }
            default: {
                break;
            }
        }
        return {
            h: (1000 + h / 6) % 1,
            s: s,
            v: v
        };
    },
    hsvToRgb = hsv => {
        let h = hsv.h,
            r = 0,
            g = 0,
            b = 0;

        const s = hsv.s,
            v = hsv.v,
            // Keep in positive 0-1 range.
            i = h * 6 >> 0,
            f = h * 6 - i,
            p = v * (1 - s),
            q = v * (1 - s * f),
            t = v * (1 - s * (1 - f));

        h = (h + 1000) % 1;

        switch (i) {
            case 0: {
                r = v;
                g = t;
                b = p;
                break;
            }
            case 1: {
                r = q;
                g = v;
                b = p;
                break;
            }
            case 2: {
                r = p;
                g = v;
                b = t;
                break;
            }
            case 3: {
                r = p;
                g = q;
                b = v;
                break;
            }
            case 4: {
                r = t;
                g = p;
                b = v;
                break;
            }
            case 5: {
                r = v;
                g = p;
                b = q;
                break;
            }
            default: {
                break;
            }
        }
        return { r, g, b };
    },
    rgbToCmyk = rgb => {
        let c = 1 - rgb.r,
            m = 1 - rgb.g,
            y = 1 - rgb.b;
        // Faster version of Math.min(c, m, y);
        /* eslint-disable no-extra-parens */
        const k = (c < m && c < y) ? c : (m < y) ? m : y;
        /* eslint-enable no-extra-parens */

        if (k === 1) {
            /* eslint-disable no-multi-assign */
            c = m = y = 0;
            /* eslint-enable no-multi-assign */
        } else {
            c = (c - k) / (1 - k);
            m = (m - k) / (1 - k);
            y = (y - k) / (1 - k);
        }
        return { c, m, y, k };
    },
    cmykToRgb = cmyk => {
        const k = cmyk.k;

        return {
            r: 1 - (cmyk.c * (1 - k) + k),
            g: 1 - (cmyk.m * (1 - k) + k),
            b: 1 - (cmyk.y * (1 - k) + k)
        };
    },
    rgbToXyz = rgb => {
        let r = rgb.r,
            g = rgb.g,
            b = rgb.b;

        r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
        g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
        b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
        const x = (0.4124 * r + 0.3576 * g + 0.1805 * b) * 100 / 95.047,
            y = 0.2126 * r + 0.7152 * g + 0.0722 * b,
            z = (0.0193 * r + 0.1192 * g + 0.9505 * b) * 100 / 108.883;

        return { x, y, z };
    },
    xyzToRgb = xyz => {
        let x = xyz.x,
            z = xyz.z;

        const y = xyz.y;

        // Multiply by white point, 2 degree D65
        x *= 95.047 / 100;
        z *= 108.883 / 100;

        let r = 3.24063 * x - 1.53721 * y - 0.498629 * z,
            g = -0.968931 * x + 1.87576 * y + 0.0415175 * z,
            b = 0.0557101 * x - 0.204021 * y + 1.057 * z;

        r = r > 0.0031308 ? 1.055 * Math.pow(r, 0.4167) - 0.055 : 12.92 * r;
        g = g > 0.0031308 ? 1.055 * Math.pow(g, 0.4167) - 0.055 : 12.92 * g;
        b = b > 0.0031308 ? 1.055 * Math.pow(b, 0.4167) - 0.055 : 12.92 * b;

        /* eslint-disable arrow-body-style */
        const limit01 = val => {
            return val < 0 ? 0 : val > 1 ? 1 : val;
        };
        /* eslint-enable arrow-body-style */

        r = limit01(r);
        g = limit01(g);
        b = limit01(b);

        return { r, g, b };
    },
    rgbToLab = rgb => {
        const xyz = rgbToXyz(rgb),
            x = xyz.x,
            y = xyz.y,
            z = xyz.z,
            fx = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 0.1379,
            fy = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 0.1379,
            fz = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 0.1379;

        return {
            l: (116 * fy - 16) / 100.00,
            a: (500 * (fx - fy) + 0x80) / 0xFF,
            b: (200 * (fy - fz) + 0x80) / 0xFF
        };
    },
    labToRgb = lab => {
        const y = (lab.l * 100 + 16) / 116,
            x = y + (lab.a * 0xFF - 0x80) / 500,
            z = y - (lab.b * 0xFF - 0x80) / 200;

        return xyzToRgb({
            x: x > 0.2069 ? x * x * x : 0.1284 * (x - 0.1379),
            y: y > 0.2069 ? y * y * y : 0.1284 * (y - 0.1379),
            z: z > 0.2069 ? z * z * z : 0.1284 * (z - 0.1379)
        });
    },
    labToLABInverse = lab => {
        const op = [];

        op[0] = lab[0] / 100;
        op[1] = (lab[1] + 0x80) / 0xFF;
        op[2] = (lab[2] + 0x80) / 0xFF;
        return op;
    },
    valuesToRgb = (mode, values) => {
        let rgb, lab, cmyk, hsv;

        switch (mode) {
            case 'lab': {
                lab = {
                    l: values[0],
                    a: values[1],
                    b: values[2]
                };
                rgb = labToRgb(lab);
                break;
            }
            case 'rgb': {
                rgb = {
                    r: values[0],
                    g: values[1],
                    b: values[2]
                };
                break;
            }
            case 'cmyk': {
                cmyk = {
                    c: values[0],
                    m: values[1],
                    y: values[2],
                    k: values[3]
                };
                rgb = cmykToRgb(cmyk);
                break;
            }
            case 'hsv': {
                hsv = {
                    h: values[0],
                    s: values[1],
                    v: values[2]
                };
                rgb = hsvToRgb(hsv);
                break;
            }
            default: {
                rgb = {
                    r: 0,
                    g: 0,
                    b: 0
                };
                break;
            }
        }
        /* eslint-disable arrow-body-style */
        const limit01 = val => {
            return val < 0 ? 0 : val > 1 ? 1 : val;
        };
        /* eslint-enable arrow-body-style */

        rgb = {
            r: limit01(rgb.r),
            g: limit01(rgb.g),
            b: limit01(rgb.b)
        };

        return rgb;
    },
    valuesToHex = (mode, values) => {
        const rgb = valuesToRgb(mode, values);

        /* eslint-disable no-bitwise */
        return hexToString((Math.round(rgb.r * 255) << 16 | Math.round(rgb
            .g * 255) << 8 | Math.round(rgb.b * 255)) >>> 0).toUpperCase();
        /* eslint-enable no-bitwise */
    },
    saturate = colors => {
        let { cmyk, hex, hsv, lab, rgb } = colors;

        cmyk = {
            c: Math.round(cmyk.c * 100),
            m: Math.round(cmyk.m * 100),
            y: Math.round(cmyk.y * 100),
            k: Math.round(cmyk.k * 100)
        };
        rgb = {
            r: Math.round(rgb.r * 255),
            g: Math.round(rgb.g * 255),
            b: Math.round(rgb.b * 255)
        };
        hsv = {
            h: Math.round(hsv.h * 360),
            s: Math.round(hsv.s * 100),
            v: Math.round(hsv.v * 100)
        };
        lab = {
            l: Math.round(lab.l * 100),
            a: Math.round(lab.a * 0xFF - 0x80),
            b: Math.round(lab.b * 0xFF - 0x80)
        };

        return { cmyk, hex, hsv, lab, rgb };
    },
    valuesToAllSpaces = (mode, values) => {
        let cmyk, hex, hsv, lab, rgb;

        switch (mode) {
            case 'rgb': {
                hex = valuesToHex(mode, values);
                rgb = {
                    r: values[0],
                    g: values[1],
                    b: values[2]
                };
                cmyk = rgbToCmyk(rgb);
                lab = rgbToLab(rgb);
                hsv = rgbToHsv(rgb);
                break;
            }
            case 'hsv': {
                hsv = {
                    h: values[0],
                    s: values[1],
                    v: values[2]
                };
                rgb = hsvToRgb(hsv);
                hex = valuesToHex('rgb', [rgb.r, rgb.g, rgb.b]);
                cmyk = rgbToCmyk(rgb);
                lab = rgbToLab(rgb);
                break;
            }
            case 'cmyk': {
                cmyk = {
                    c: values[0],
                    m: values[1],
                    y: values[2],
                    k: values[3]
                };
                rgb = cmykToRgb(cmyk);
                hex = valuesToHex('rgb', [rgb.r, rgb.g, rgb.b]);
                lab = rgbToLab(rgb);
                hsv = rgbToHsv(rgb);
                break;
            }
            case 'lab': {
                lab = {
                    l: values[0],
                    a: values[1],
                    b: values[2]
                };
                rgb = labToRgb(lab);
                hex = valuesToHex('rgb', [rgb.r, rgb.g, rgb.b]);
                cmyk = rgbToCmyk(rgb);
                hsv = rgbToHsv(rgb);
                break;
            }
            default: {
                hex = '';
                rgb = { r: 0, g: 0, b: 0 };
                cmyk = { c: 0, m: 0, y: 0, k: 0 };
                lab = { l: 0, a: 0, b: 0 };
                hsv = { h: 0, s: 0, v: 0 };
                break;
            }
        }

        return { hex, rgb, cmyk, lab, hsv };
    },
    denormalizedValuesToAllSpaces = colors => saturate(colors),
    normalizeRGB = color => Array.from(color).map(x => x / 255),
    normalizeHSV = color => [color[0] / 360, color[1] / 100, color[2] / 100],
    normalizeLAB = color => labToLABInverse(Array.from(color)),
    hsvToAllSpacesDenormalized = values => denormalizedValuesToAllSpaces(valuesToAllSpaces('hsv', normalizeHSV(values))),
    rgbToAllSpacesDenormalized = values => denormalizedValuesToAllSpaces(valuesToAllSpaces('rgb', normalizeRGB(values)));
