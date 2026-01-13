/*************************************************************************
* ADOBE CONFIDENTIAL
* ___________________
*
* Copyright 2022 Adobe
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

export const toFixedNumber = (num, digits, base = 10) => {
        const pow = base ** digits;

        return Math.round(num * pow) / pow;
    },
    isFalsy = value => value === false || Number.isNaN(value) || typeof value === 'undefined' || value === null,
    isUndefinedOrNull = val => typeof val === 'undefined' || val === null,
    preventDefault = event => {
        if (!event) {
            return false;
        }

        if (typeof event.preventDefault === 'function') {
            event.preventDefault();
        } else {
            event.returnValue = false;
        }

        return false;
    },
    isRightMouseButtonClicked = event => {
        if (!event) {
            return false;
        }

        if ('which' in event) {
            return event.which === 3;
        }

        if ('button' in event) {
            return event.button === 2;
        }

        return false;
    },
    getLuminance = hex => {
        const rgb = hex.replace('#', '').match(/.{2}/g).map(c => parseInt(c, 16) / 255);
        const [r, g, b] = rgb.map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
        );


        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
