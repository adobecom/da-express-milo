/*************************************************************************
* ADOBE CONFIDENTIAL
* ___________________
*
* Copyright 2021 Adobe
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

import { toFixedNumber } from './util.js';

export const rgbToHSL = (red, green, blue) => {
        let max = Math.max(red, green, blue),
            min = Math.min(red, green, blue),
            l = (max + min) / 2,
            d = max - min;

        let h, s;

        if (max === min) { // Achromatic
            h = 0;
            s = 0;
        } else {
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case red:
                    h = (green - blue) / d + (green < blue ? 6 : 0);
                    break;
                case green:
                    h = (blue - red) / d + 2;
                    break;
                case blue:
                    h = (red - green) / d + 4;
                    break;
                default:
                    h = 0;
            }

            h /= 6;
        }

        return { hue: toFixedNumber(h * 360, 2), saturation: toFixedNumber(s * 100, 2), lightness: toFixedNumber(l * 100, 2) };
    },
    /**
    * Converts an HSL color value to RGB. Conversion formula
    * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
    * Assumes h, s, and l are contained in the set [0, 1] and
    * returns red, green, and blue in the set [0, 255].
    *
    * @param   {number}  hue                The hue
    * @param   {number}  saturation         The saturation
    * @param   {number}  lightness          The lightness
    * @return  {Object}                     The RGB representation
    */
    hslToRGB = (hue, saturation, lightness) => {
        let red, green, blue;

        if (saturation == 0) {
            red = green = blue = lightness; // achromatic
        } else {
            let q = lightness < 0.5 ? lightness * (1 + saturation) : lightness + saturation - lightness * saturation,
                p = 2 * lightness - q;

            red = hueToRGB(p, q, hue + 1 / 3);
            green = hueToRGB(p, q, hue);
            blue = hueToRGB(p, q, hue - 1 / 3);
        }

        return {red: Math.round(red * 255), green: Math.round(green * 255), blue: Math.round(blue * 255)};
    },
    hueToRGB = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    },
    validateHEX = hex => {
        // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])([a-f\d])?$/i,
            newHex = hex.replace(shorthandRegex, (m, r, g, b, a) => {
                let fullHex = '#' + r + r + g + g + b + b;

                if (a) {
                    fullHex += a + a;
                }
                return fullHex;
            }),
            result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(newHex); // eslint-disable-line

        if (result && !/^#/.test(result[0])) {
            // If not, append # to the beginning of the string
            result[0] = '#' + result[0];
        }

        return result;
    },
    removeTransparencyFromHEX = hex => {
        const expandedHEX = validateHEX(hex);

        return `#${expandedHEX[1]}${expandedHEX[2]}${expandedHEX[3]}`;
        
    },
    hexToRGB = hex => {
        const result = validateHEX(hex);

        return result ? {
            red: parseInt(result[1], 16),
            green: parseInt(result[2], 16),
            blue: parseInt(result[3], 16),
            alpha: toFixedNumber(parseInt(result[4], 16) / 255, 4)
        } : null;
    },
    hexToRGBString = hex => {
        const rgb = hexToRGB(hex);

        return rgb ? `rgb(${rgb.red}, ${rgb.green}, ${rgb.blue})` : '';
    },
    hexToHSL = hex => {
        const rgb = hexToRGB(hex);
        return rgb ? rgbToHSL(rgb.red/255, rgb.green/255, rgb.blue/255) : null;
    },
    hexToHSB = hex => {
        const rgb = hexToRGB(hex);
        return rgb ? rgbToHSB(rgb.red/255, rgb.green/255, rgb.blue/255) : null;
    },
    hexToHue = hex => {
        return hexToHSL(hex)?.hue ?? 0;
    },
    hexToAlpha = hex => {
        const result = validateHEX(hex);

        return result && result[4] ? toFixedNumber(parseInt(result[4], 16) / 255, 2) : 1;
    },
    hexAlphaToHexa = (hex, alpha) => {
        // If hex already has alpha, remove it first
        return removeTransparencyFromHEX(hex) + toHEX(Math.round(alpha * 255));
    },
    hslToHEX = (hue, saturation, lightness) => {
        const rgb = hslToRGB(hue, saturation, lightness);

        return rgbToHex(rgb);
    },
    hslaToHEXA = (hue, saturation, lightness, alpha) => {
        const rgb = hslToRGB(hue, saturation, lightness),
            hex = rgbToHex(rgb) + toHEX(toFixedNumber(alpha * 255, 0));

        return hex;
    },
    hsbToHEX = (hue, saturation, brightness) => {
        const rgb = hsbToRGB(hue, saturation, brightness);

        return rgbToHex(rgb);
    },
    hsbaToHEXA = (hue, saturation, brightness, alpha) => {
        const rgb = hsbToRGB(hue, saturation, brightness),
            hex = rgbToHex(rgb) + toHEX(toFixedNumber(alpha * 255, 0));

        return hex;
    },
    rgbStringToHex = (colorString) => {
        if(colorString.match('^rgb')){
            const color = colorString.split('(')[1].split(')')[0].split(',');
            const rgb = {
                red : Number(color[0]),
                green : Number(color[1]),
                blue : Number(color[2]),
            }
            return rgbToHex(rgb);
        }
        return colorString;
    },
    rgbToHex = ({red, green, blue}) => {
        return `#${toHEX(red)}${toHEX(green)}${toHEX(blue)}`;
    },
    toHEX = number => {
        const hex = number.toString(16).toUpperCase();

        return (hex.length === 1 ? '0' : '') + hex;
    },
    rgbToHSB = (red, green, blue) => {
        let hue = 0;

        // Faster version of Math.min(r, g, b);
        /* eslint-disable no-extra-parens */
        const min = (red < green && red < blue) ? red : (green < blue) ? green : blue,
            brightness = (red > green && red > blue) ? red : (green > blue) ? green : blue,
            // Faster version of Math.max(r, g, b)
            saturation = (brightness === 0) ? 0 : (brightness - min) / brightness,
            delta = (saturation === 0) ? 0.00001 : brightness - min;
        /* eslint-enable no-extra-parens */

        switch (brightness) {
            case red: {
                hue = (green - blue) / delta;
                break;
            }
            case green: {
                hue = 2 + (blue - red) / delta;
                break;
            }
            case blue: {
                hue = 4 + (red - green) / delta;
                break;
            }
            default: {
                break;
            }
        }
        return {
            hue: toFixedNumber(((1000 + hue / 6) % 1) * 360, 2),
            saturation: toFixedNumber(saturation * 100, 2),
            brightness: toFixedNumber(brightness * 100, 2)
        };
    },
    hsbToRGB = (hue, saturation, brightness) => {
        let red, green, blue, i, f, p, q, t;

        // Keep in positive 0-1 range.
        i = Math.floor(hue * 6);
        f = hue * 6 - i;
        p = brightness * (1 - saturation);
        q = brightness * (1 - f * saturation);
        t = brightness * (1 - (1 - f) * saturation);

        switch (i % 6) {
            case 0: red = brightness, green = t, blue = p; break;
            case 1: red = q, green = brightness, blue = p; break;
            case 2: red = p, green = brightness, blue = t; break;
            case 3: red = p, green = q, blue = brightness; break;
            case 4: red = t, green = p, blue = brightness; break;
            case 5: red = brightness, green = p, blue = q; break;
        }
        return {
            red: Math.round(red * 255),
            green: Math.round(green * 255),
            blue: Math.round(blue * 255)
        };
    },
    /**
    * Convert a HSL color to HSV. Adapted from https://en.wikipedia.org/wiki/HSL_and_HSV#HSV_to_HSL
    * @param {Number} hue - Hue Angle (0 - 360)
    * @param {Number} saturation - Saturation (0 - 100)
    * @param {Number} lightness - Lightness (0 - 100)
    * @return {hue: Number, saturation: Number, lightness: Number}
    * @example hslToHSB(234, 100, 50)
    */
    hslToHSB = (hue, saturation, lightness)  => {
        saturation = saturation / 100;
        lightness = lightness / 100;

        const brightness = lightness + saturation * Math.min(lightness, 1 - lightness),
            hsbSaturation = brightness === 0 ? 0 : 2 * (1 - lightness / brightness);

        return { hue, saturation: toFixedNumber(hsbSaturation * 100, 2), brightness: toFixedNumber(brightness * 100, 2) };
    },
    /**
    * Convert a HSV color to HSL. Adapted from https://en.wikipedia.org/wiki/HSL_and_HSV#HSV_to_HSL
    * @param {Number} hue - Hue Angle (0 - 360)
    * @param {Number} saturation - Saturation (0 - 100)
    * @param {Number} brightness - Lightness (0 - 100)
    * @return {hue: Number, saturation: Number, brightness: Number}
    * @example hsbToHSL(234, 100, 50)
    */
    hsbToHSL = (hue, saturation, brightness) => {
        saturation = saturation / 100;
        brightness = brightness / 100;

        const lightness = brightness * (1 - saturation / 2),
            hslSaturation = lightness === 0 || lightness === 1 ? 0 : ((brightness - lightness) / Math.min(lightness, 1 - lightness));

        return { hue, saturation: toFixedNumber(hslSaturation * 100, 2), lightness: toFixedNumber(lightness * 100, 2) };
    },
    /**
    * Convert a HSV/HSB color to HSL. Adapted from https://en.wikipedia.org/wiki/HSL_and_HSV#HSV_to_HSL
    * @param {Number} h - Hue Angle (0 - 360)
    * @param {Number} s - Saturation (0 - 1)
    * @param {Number} v - Value (0 - 1)
    * @return {h: Number, s: Number, l: Number}
    * @example hsvToHsl(234, 1, 0.5)
    */
    hsvToHsl = (h, s, v) => {
        let saturation = s;
        const l = (2 - s) * v / 2;

        if (l !== 0) {
            if (l === 1) {
                saturation = 0;
            } else if (l < 0.5) {
                saturation = s * v / (l * 2);
            } else {
                saturation = s * v / (2 - l * 2);
            }
        }

        return { h, s, l };
    },
    xyToPolar = (x, y) => {
        const r = Math.sqrt(x * x + y * y),
            phi = Math.atan2(y, x);

        return [r, phi];
    },
    polarToXy = (r, phi) => {
        const x = r * Math.cos(phi),
            y = r * Math.sin(phi);

        return [x, y];
    },
    degToRad = deg => deg * Math.PI / 180 - Math.PI;
