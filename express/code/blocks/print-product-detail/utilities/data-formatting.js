import { formatPriceZazzle, formatPaperThickness, formatPaperWeight } from './utility-functions.js';

export function formatProductDescriptions(attributes, selectedOptions = {}) {
  const productDescriptions = [];
  if (!attributes) {
    return productDescriptions;
  }
  Object.values(attributes).forEach((attribute) => {
    const { title } = attribute;
    const attributeName = attribute.name;
    let selectedValue = null;
    if (selectedOptions[attributeName] && attribute.values) {
      selectedValue = attribute.values.find((v) => v.name === selectedOptions[attributeName]);
    }
    if (!selectedValue && attribute.value && attribute.values) {
      selectedValue = attribute.values.find((v) => v.name === attribute.value);
    }
    if (!selectedValue && attribute.bestValue && attribute.values) {
      selectedValue = attribute.values.find((v) => v.name === attribute.bestValue);
    }
    if (!selectedValue && attribute.values) {
      [selectedValue] = attribute.values;
    }
    if (!title || !selectedValue) {
      return;
    }
    let description = selectedValue.descriptionShort
      || selectedValue.description
      || selectedValue.descriptionBrief
      || selectedValue.title
      || selectedValue.titleLong
      || '';
    if (description && description.includes('<')) {
      description = description
        .replace(/<p>/g, '')
        .replace(/<\/p>/g, '')
        .replace(/<ul>/g, '<ul class="pdpx-details-list">')
        .replace(/<li>/g, '<li class="pdpx-details-list-item">')
        .replace(/\r\n/g, '')
        .trim();
    }
    if (title && description) {
      productDescriptions.push({ title, description });
    }
  });
  return productDescriptions;
}

function buildImageUrl(realviewParams) {
  const params = new URLSearchParams();
  Object.entries(realviewParams).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.set(key, value);
    }
  });
  return `https://rlv.zcache.com/svc/view?${params.toString()}`;
}

async function convertAttributeToOptionsObject(productType, attribute) {
  const options = attribute.values;
  const optionsArray = [];
  for (let i = 0; i < options.length; i += 1) {
    let imageUrl;
    const option = options[i];
    if (productType === 'zazzle_businesscard' && attribute.name === 'media') {
      option.swatchParams.max_dim = '100';
      imageUrl = buildImageUrl(option.swatchParams);
    } else {
      option.firstProductRealviewParams.max_dim = '100';
      imageUrl = buildImageUrl(option.firstProductRealviewParams);
    }
    optionsArray.push({
      thumbnail: imageUrl,
      title: option.title,
      name: option.name,
      priceAdjustment: await formatPriceZazzle(option.priceDifferential, true),
      description: option.description,
    });
    if (productType === 'zazzle_businesscard' && attribute.name === 'media') {
      optionsArray[i].thickness = formatPaperThickness(option.properties.thickness);
      const { weight, gsm } = formatPaperWeight(option.properties.weight);
      optionsArray[i].weight = weight;
      optionsArray[i].gsm = gsm;
    }
    if (productType === 'zazzle_shirt' && attribute.name === 'color') {
      optionsArray[i].printingProcess = option.properties.tags?.includes('showswhite') ? 'vivid' : 'classic';
    }
  }
  return optionsArray;
}

function formatQuantityOptionsObject(quantities, pluralUnitLabel, singularUnitLabel) {
  const optionsArray = [];
  let singularUnitLabelFormatted = singularUnitLabel;
  if (singularUnitLabel === 'flyer') {
    singularUnitLabelFormatted = 'flyers';
  }
  for (let i = 0; i < quantities.length; i += 1) {
    const option = quantities[i];
    const label = (i === 0) ? `${option} ${singularUnitLabelFormatted}` : `${option} ${pluralUnitLabel}`;
    optionsArray.push({
      title: label,
      name: option,
    });
  }
  return optionsArray;
}

export function createEmptyDataObject(templateId, region) {
  const emptyDataObject = {
    id: '',
    templateId,
    heroImage: '',
    productTitle: '',
    unitPrice: '0',
    productPrice: '0',
    strikethroughPrice: '0',
    discountAvailable: '',
    discountString: '',
    deliveryEstimateStringText: '',
    deliveryEstimateMinDate: '',
    deliveryEstimateMaxDate: '',
    realViews: {},
    productType: 'default',
    pluralUnitLabel: '',
    singularUnitLabel: '',
    averageRating: '',
    totalReviews: '',
    tooltipTitle: '',
    tooltipDescription1: '',
    tooltipDescription2: '',
    attributes: { qty: [] },
    compareValueTooltipTitle: '',
    compareValueTooltipDescription1: '',
    compareValueTooltipDescription2: '',
    productDescriptions: [],
    region,
  };
  return emptyDataObject;
}

export async function updateDataObjectProductDetails(dataObject, productDetails) {
  dataObject.id = productDetails.product.id;
  dataObject.heroImage = productDetails.product.initialPrettyPreferredViewUrl;
  dataObject.productTitle = productDetails.product.rootRawTitle;
  dataObject.productType = productDetails.product.productType;
  const attributeOptions = productDetails.product.attributes;
  if (attributeOptions.addon) {
    delete attributeOptions.addon;
  }
  for (const attribute of Object.values(attributeOptions)) {
    dataObject.attributes[attribute.name] = await convertAttributeToOptionsObject(
      productDetails.product.productType,
      attribute,
    );
  }
  const quantitiesOptions = formatQuantityOptionsObject(
    productDetails.product.quantities,
    productDetails.product.pluralUnitLabel,
    productDetails.product.singularUnitLabel,
  );
  dataObject.attributes.qty = quantitiesOptions;
  dataObject.productDescriptions = formatProductDescriptions(productDetails.product.attributes);
  return dataObject;
}

export function updateDataObjectProductPrice(dataObject, productPrice, quantity) {
  let applicableDiscount = null;
  if (productPrice?.discountProductItems?.length > 0) {
    applicableDiscount = productPrice.discountProductItems.reduce(
      (max, item) => (item.discountPercent > max.discountPercent ? item : max),
      productPrice.discountProductItems[0],
    );
  }
  const discountAvailable = !!applicableDiscount;
  const calculatedProductPrice = (applicableDiscount
    ?.priceAdjusted ?? productPrice?.unitPrice ?? 0) * quantity;
  dataObject.productPrice = calculatedProductPrice;
  dataObject.strikethroughPrice = (productPrice?.unitPrice ?? 0) * quantity;
  dataObject.discountAvailable = discountAvailable;
  dataObject.discountString = applicableDiscount?.discountString;
  return dataObject;
}

export function updateDataObjectProductShippingEstimates(dataObject, productShippingEstimates) {
  dataObject.deliveryEstimateMinDate = productShippingEstimates.estimates[0].minDeliveryDate;
  dataObject.deliveryEstimateMaxDate = productShippingEstimates.estimates[0].maxDeliveryDate;
  return dataObject;
}

export function updateDataObjectProductReviews(dataObject, productReviews) {
  dataObject.averageRating = productReviews.reviews.stats.averageRating;
  dataObject.totalReviews = productReviews.reviews.stats.totalReviews;
  return dataObject;
}

export function updateDataObjectProductRenditions(dataObject, productRenditions) {
  dataObject.realViews = productRenditions.realviewUrls;
  return dataObject;
}

export function updateDataObjectUIStrings(dataObject, UIStrings) {
  dataObject.compareValueTooltipTitle = UIStrings
    .adobe_compareValueTooltipTitle;
  dataObject.compareValueTooltipDescription1 = UIStrings
    .zi_product_Price_CompValueTooltip1Adobe;
  dataObject.compareValueTooltipDescription2 = UIStrings
    .zi_product_Price_CompValueTooltip2Adobe;
  dataObject.deliveryEstimateStringText = UIStrings
    .adobe_deliveryEstimateStringText;
  dataObject.compareValueInfoIconLabel = UIStrings
    .zi_product_Price_CompValue;
  dataObject.classicPrintingTitle = UIStrings
    .zi_product_PDP_PrintingProcess_ClassicPrinting_Title;
  dataObject.classicPrintingDescription = UIStrings
    .zi_product_PDP_PrintingProcess_ClassicPrinting_Description;
  dataObject.classicPrintingSummary = UIStrings
    .zi_product_PDP_PrintingProcess_ClassicPrinting_Summary;
  dataObject.vividPrintingTitle = UIStrings
    .zi_product_PDP_PrintingProcess_VividPrinting_Title;
  dataObject.vividPrintingDescription = UIStrings
    .zi_product_PDP_PrintingProcess_VividPrinting_Description;
  dataObject.vividPrintingSummary = UIStrings
    .zi_product_PDP_PrintingProcess_VividPrinting_Summary;
  dataObject.sizeChart = UIStrings
    .adobe_sizeChartExample;
  return dataObject;
}

export async function normalizeProductDetailObject({
  productDetails,
  productPrice,
  productReviews,
  productRenditions,
  productShippingEstimates,
  quantity,
  templateId,
  UIStrings }) {
  let dataObject = createEmptyDataObject(templateId);
  dataObject = await updateDataObjectProductDetails(dataObject, productDetails);
  dataObject = await updateDataObjectProductPrice(dataObject, productPrice, quantity);
  dataObject = await updateDataObjectProductShippingEstimates(dataObject, productShippingEstimates);
  dataObject = await updateDataObjectProductReviews(dataObject, productReviews);
  dataObject = await updateDataObjectProductRenditions(dataObject, productRenditions);
  dataObject = await updateDataObjectUIStrings(dataObject, UIStrings);
  return dataObject;
}
