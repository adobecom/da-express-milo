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

import {
    rgbToHSL, hexToRGB, hslToRGB, hsbToHSL, hslToHSB, hslToHEX, hslaToHEXA
} from './ColorConversions.js';
import { isFalsy } from './util.js';

class HSLAColor {
    constructor(hue = 0, saturation = 0, lightness = 0, alpha = 1) {
        this.hue = hue;
        this.saturation = saturation;
        this.lightness = lightness;
        this.alpha = alpha;
    }

    parse(value, format = 'rgb') {
        let parsedColor = null;

        switch (format) {
            case 'hex':
                parsedColor = hexToRGB(value);

                // Set last used color in case of invalid hex
                if (!parsedColor) {
                    return this;
                }
                const alpha = isFalsy(parsedColor.alpha) ? this.alpha : parsedColor.alpha;

                parsedColor = rgbToHSL(parsedColor.red / 255, parsedColor.green / 255, parsedColor.blue / 255);

                return new HSLAColor(parsedColor.hue, parsedColor.saturation, parsedColor.lightness, alpha);
            case 'hsb':
                parsedColor = hsbToHSL(value.hue, value.saturation, value.brightness);

                return new HSLAColor(parsedColor.hue, parsedColor.saturation, parsedColor.lightness, this.alpha);
            case 'rgb':
            default:
                let { red, green, blue } = value;

                red = red / 255;
                green = green / 255;
                blue = blue / 255;

                parsedColor = rgbToHSL(red, green, blue);

                return new HSLAColor(parsedColor.hue, parsedColor.saturation, parsedColor.lightness, this.alpha);
        }
    }

    toFormat(format = 'rgba') {
        switch (format.toLowerCase()) {
            case 'hsb':
                return hslToHSB(this.hue, this.saturation, this.lightness);
            case 'hsba':
                const hsba = hslToHSB(this.hue, this.saturation, this.lightness);

                return { hue: hsba.hue, saturation: hsba.saturation, brightness: hsba.brightness, alpha: this.alpha };
            case 'hex':
                return hslToHEX(this.hue / 360, this.saturation / 100, this.lightness / 100);
            case 'hexa':
                return hslaToHEXA(this.hue / 360, this.saturation / 100, this.lightness / 100, this.alpha);
            case 'rgb':
                return hslToRGB(this.hue / 360, this.saturation / 100, this.lightness / 100);
            case 'rgba':
            default:
                const rgba = hslToRGB(this.hue / 360, this.saturation / 100, this.lightness / 100);

                return { red: rgba.red, green: rgba.green, blue: rgba.blue, alpha: this.alpha };
        }
    }

    toString(format = 'hsla') {
        switch (format) {
            case 'hsl':
                return `hsl(${this.hue}, ${this.saturation}%, ${this.lightness}%)`;
            case 'rgb':
                const rgb = hslToRGB(this.hue / 360, this.saturation / 100, this.lightness / 100);

                return `rgb(${rgb.red}, ${rgb.green}, ${rgb.blue})`;
            case 'rgba':
                const rgba = hslToRGB(this.hue / 360, this.saturation / 100, this.lightness / 100);

                return `rgba(${rgba.red}, ${rgba.green}, ${rgba.blue}, ${this.alpha})`;
            case 'hex':
                return hslToHEX(this.hue / 360, this.saturation / 100, this.lightness / 100);
            case 'hexa':
                return hslaToHEXA(this.hue / 360, this.saturation / 100, this.lightness / 100, this.alpha);
            default:
                return `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, ${this.alpha})`;
        }
    }

    clone() {
        return new HSLAColor(this.hue, this.saturation, this.lightness, this.alpha);
    }

    updateAlpha(newAlpha) {
        const color = this.clone();

        color.alpha = newAlpha;

        return color;
    }

    toArray(mode = 'rgba') {
        const color = this.toFormat(mode);

        return Object.values(color);
    }
}

export default HSLAColor;
