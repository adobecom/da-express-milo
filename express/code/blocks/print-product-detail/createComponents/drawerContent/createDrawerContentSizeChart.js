import { getLibs } from '../../../../scripts/utils.js';
import { createDrawerHead } from './createDrawerContent.js';

let createTag;

export default async function createDrawerContentSizeChart(
  productDetails,
  drawerContainer,
) {
  ({ createTag } = await import(`${getLibs()}/utils/utils.js`));
  const drawerHead = createDrawerHead('Printing Process');
  const drawerBody = createTag('div', { class: 'pdpx-drawer-body' });
  const sizeChartContainer = createTag('div', {
    class: 'pdpx-size-chart-container',
  });
  sizeChartContainer.innerHTML = `
<h2 class="size-chart-product-name">Bella+Canvas Tri-blend T-Shirt</h2>
<div class="size-chart-table-container">
    <div class="size-chart-tables">
        <div class="size-chart-table-section">
            <table class="size-chart-table">
                <thead>
                    <tr>
                        <th class="size-chart-table-header">Body (IN)</th>
                        <th>Chest</th>
                        <th>Waist</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Adult S</td>
                        <td>34-37</td>
                        <td>30-32</td>
                    </tr>

                    <tr>
                        <td>Adult M</td>
                        <td>38-41</td>
                        <td>32-34</td>
                    </tr>

                    <tr>
                        <td>Adult L</td>
                        <td>42-45</td>
                        <td>34-36</td>
                    </tr>

                    <tr>
                        <td>Adult XL</td>
                        <td>46-49</td>
                        <td>36-38</td>
                    </tr>

                    <tr>
                        <td>Adult 2XL</td>
                        <td>50-53</td>
                        <td>38-40</td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div class="size-chart-table-section">
            <table class="size-chart-table">
                <thead>
                    <tr>
                        <th class="size-chart-table-header">Garment (IN)</th>
                        <th>Chest</th>
                        <th>Waist</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Adult S</td>
                        <td>18</td>
                        <td>28</td>
                    </tr>

                    <tr>
                        <td>Adult M</td>
                        <td>20</td>
                        <td>29</td>
                    </tr>

                    <tr>
                        <td>Adult L</td>
                        <td>22</td>
                        <td>30</td>
                    </tr>

                    <tr>
                        <td>Adult XL</td>
                        <td>24</td>
                        <td>31</td>
                    </tr>

                    <tr>
                        <td>Adult 2XL</td>
                        <td>26</td>
                        <td>32</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</div>
<div class="size-chart-instructions">
    <div class="size-chart-instruction-section">
        <h3>Body</h3>
        <p class="size-chart-instruction-text">
            Measure under your arms around the fullest part of your chest
        </p>
        <p class="size-chart-instruction-text">
            Measure around your natural waistline at the narrowest point
        </p>
    </div>
    <div class="size-chart-instruction-section">
        <h3>Garment</h3>
        <p class="size-chart-instruction-text">
            Measure garment from arm hole to arm hole
        </p>
        <p class="size-chart-instruction-text">
            Measure garment from the seam at the neck to the bottom of the
            garment
        </p>
    </div>
    <div class="size-chart-instruction-section">
        <h3>Fit</h3>
        <p class="size-chart-instruction-text">Standard</p>
    </div>
</div>
  `;
  drawerBody.appendChild(sizeChartContainer);
  drawerContainer.append(drawerHead, drawerBody);
}
