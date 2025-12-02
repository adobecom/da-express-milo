/*************************************************************************
* ADOBE CONFIDENTIAL
* ___________________
*
* Copyright 2023 Adobe
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

/* eslint-disable no-else-return */
export const mapRange = (x, a, b, c, d) => c + (x - a) * ((d - c) / (b - a)),
    artisticToScientificSmooth = angle => {
        if (angle < 60.0) {
            // Map [0,60] to [0,35]
            return angle * (35.0 / 60.0);
        } else if (angle < 122.0) {
            // Map [60,122] to [35,60]
            return mapRange(angle, 60, 122, 35, 60);
        } else if (angle < 165.0) {
            // Map [122,165] to [60,120]
            return mapRange(angle, 122, 165, 60, 120);
        } else if (angle < 218.0) {
            // Map [165,218] to [120,180]
            return mapRange(angle, 165, 218, 120, 180);
        } else if (angle < 275.0) {
            // Map [218,275] to [180,240]
            return mapRange(angle, 218, 275, 180, 240);
        } else if (angle < 330.0) {
            // Map [275,330] to [240,300]
            return mapRange(angle, 275, 330, 240, 300);
        }

        // Map [330,360] to [300,360]
        return mapRange(angle, 330, 360, 300, 360);
    },
    scientificToArtisticSmooth = angle => {
        if (angle < 35.0) {
            // Map [0,35] to [0,60]
            return angle * (60.0 / 35.0);
        } else if (angle < 60.0) {
            // Map [35,60] to [60,122]
            return mapRange(angle, 35, 60, 60, 122);
        } else if (angle < 120.0) {
            // Map [60,120] to [122,165]
            return mapRange(angle, 60, 120, 122, 165);
        } else if (angle < 180.0) {
            // Map [120,180] to [165,218]
            return mapRange(angle, 120, 180, 165, 218);
        } else if (angle < 240.0) {
            // Map [180,240] to [218,275]
            return mapRange(angle, 180, 240, 218, 275);
        } else if (angle < 300.0) {
            // Map [240,300] to [275,330]
            return mapRange(angle, 240, 300, 275, 330);
        }

        // Map [300,360] to [330,360]
        return mapRange(angle, 300, 360, 330, 360);
    };
