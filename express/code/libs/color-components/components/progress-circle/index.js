/*************************************************************************
 *
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 *  Copyright 2022 Adobe
 *  All Rights Reserved.
 *
 *  NOTICE:  All information contained herein is, and remains
 *  the property of Adobe and its suppliers, if any. The intellectual
 *  and technical concepts contained herein are proprietary to Adobe
 *  and its suppliers and are protected by all applicable intellectual
 *  property laws, including trade secret and copyright laws.
 *  Dissemination of this information or reproduction of this material
 *  is strictly forbidden unless prior written permission is obtained
 *  from Adobe.
 **************************************************************************/


import { LitElement, html } from '../../../../deps/lit.js';
import { customElement } from 'lit/decorators.js';

import { style } from './styles.css';

@customElement('progress-circle')
class ProgressCircle extends LitElement {

    static styles = [style];

    render() {
        return html`
            <div class="progress-circle" label="A large representation of an unclear amount of work" dir="ltr" role="progressbar" aria-label="A large representation of an unclear amount of work">
                <div class="track"></div>
                <div class="fills">
                    <div class="fillMask1">
                        <div class="fillSubMask1">
                            <div class="fill"></div>
                        </div>
                    </div>
                    <div class="fillMask2">
                        <div class="fillSubMask2">
                            <div class="fill"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

}

export default ProgressCircle;
