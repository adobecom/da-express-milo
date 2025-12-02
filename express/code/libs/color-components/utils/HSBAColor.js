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
    rgbToHSB, hexToRGB, hsbToRGB, hsbToHSL, hslToHSB, hsbToHEX, hsbaToHEXA
} from './ColorConversions.js';
import { isFalsy } from './util.js';

class HSBAColor {
    constructor(hue = 0, saturation = 0, brightness = 0, alpha = 1) {
        this.hue = hue;
        this.saturation = saturation;
        this.brightness = brightness;
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

                parsedColor = rgbToHSB(parsedColor.red / 255, parsedColor.green / 255, parsedColor.blue / 255);

                return new HSBAColor(parsedColor.hue, parsedColor.saturation, parsedColor.brightness, alpha);
            case 'hsl':
                parsedColor = hslToHSB(value.hue, value.saturation, value.lightness);

                return new HSBAColor(parsedColor.hue, parsedColor.saturation, parsedColor.brightness, this.alpha);
            case 'rgb':
            default:
                let { red, green, blue } = value;

                red = red / 255;
                green = green / 255;
                blue = blue / 255;

                parsedColor = rgbToHSB(red, green, blue);

                return new HSBAColor(parsedColor.hue, parsedColor.saturation, parsedColor.brightness, this.alpha);
        }
    }

    toFormat(format = 'rgba') {
        switch (format.toLowerCase()) {
            case 'hsl':
                return hsbToHSL(this.hue, this.saturation, this.brightness);
            case 'hex':
                return hsbToHEX(this.hue / 360, this.saturation / 100, this.brightness / 100);
            case 'hexa':
                return hsbaToHEXA(this.hue / 360, this.saturation / 100, this.brightness / 100, this.alpha);
            case 'rgb':
                return hsbToRGB(this.hue / 360, this.saturation / 100, this.brightness / 100);
            case 'rgba':
            default:
                const rgba = hsbToRGB(this.hue / 360, this.saturation / 100, this.brightness / 100);

                return { red: rgba.red, green: rgba.green, blue: rgba.blue, alpha: this.alpha };
        }
    }

    toString(format) {
        switch (format) {
            case 'hsl':
                const color = hsbToHSL(this.hue, this.saturation, this.brightness);

                return `hsl(${color.hue}, ${color.saturation}%, ${color.lightness}%)`;
            case 'hex':
                return hsbToHEX(this.hue / 360, this.saturation / 100, this.brightness / 100);
            case 'hexa':
                return hsbaToHEXA(this.hue / 360, this.saturation / 100, this.brightness / 100, this.alpha);
            case 'rgb':
                const rgb = hsbToRGB(this.hue / 360, this.saturation / 100, this.brightness / 100);

                return `rgb(${rgb.red}, ${rgb.green}, ${rgb.blue})`;
            case 'rgba':
                const rgba = hsbToRGB(this.hue / 360, this.saturation / 100, this.brightness / 100);

                return `rgba(${rgba.red}, ${rgba.green}, ${rgba.blue}, ${this.alpha})`;
            case 'hsb':
                return `hsb(${this.hue}, ${this.saturation}%, ${this.brightness}%)`;
            default:
                return `hsv(${this.hue}, ${this.saturation}%, ${this.brightness}%)`;
        }
    }

    clone() {
        return new HSBAColor(this.hue, this.saturation, this.brightness, this.alpha);
    }

    updateAlpha(newAlpha) {
        this.alpha = newAlpha;

        return this.clone();
    }

    updateBrightness(newBrightness) {
        this.brightness = newBrightness;

        return this.clone();
    }

    toArray(mode = 'rgba') {
        const color = this.toFormat(mode);

        return Object.values(color);
    }
}

export default HSBAColor;
