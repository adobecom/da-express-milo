export type PDPState = {
    /**
     * All data needed to render the product attribute UI (titles, selectors, values, etc.).
     */
    attributes: Attribute[];
    /**
     * The components that make up the product description, one for each attribute with a description.
     */
    descriptionComponents: DescriptionComponent[];
    /**
     * The `?productSettings` string to add to the Express URL, which facilitates state transfer to the add-on.
     */
    expressProductSettings: string;
    /**
     * Pricing info for the currently selected options and quantity.
     */
    pricing: PricingInfo;
    /**
     * The Zazzle-centric product type (e.g. `zazzle_shirt`).
     */
    productType: AdobeKnownZazzleProductType;
    /**
     * The currently selected quantity.
     */
    quantity: number;
    /**
     * The list of quantity options to show in the quantity selector.
     */
    quantityOptions: QuantityOption[];
    /**
     * All views (known to Zazzle as realviews) showcasing the product. Images and videos may be present.
     * @see selectedRealview
     * @see selectRealview
     */
    realviews: Realview[];
    /**
     * Overall reviews statistics.
     */
    reviewsStats?: ReviewsStats | undefined;
    /**
     * The currently selected realview.
     * @see realviews
     * @see selectRealview
     */
    selectedRealview: Realview;
    /**
     * The range of possible worst-case delivery dates (e.g. 'Nov 23 - 27')
     */
    shippingEstimate: string;
    /**
     * The title of the product.
     */
    title: string;
    /**
     * The unit label that's applicable to the current quantity (e.g. 'shirt' or 'shirts').
     * @see quantity
     */
    unitLabel: string;
};
export type Attribute = {
    /**
     * When present, render a help link alongside the attribute title, which will show more info when clicked.
     */
    helpLink: AttributeHelpLink | undefined;
    /**
     * The attribute's internal name (e.g. 'color').
     * Use this as the first parameter when selecting an option.
     *
     * @see selectOption
     */
    name: string;
    /** The currently selected option's value, or internal name (e.g. 'red'). */
    selectedOptionValue: string;
    /** The human readable title of the currently selected option (e.g. 'Red'). */
    selectedOptionTitle: string;
    /**
     * Data powering the actual UI selector (thumbnails, radio buttons, dropdown, etc.).
     * Each selector type has its own data structure. See the associated types for details.
     */
    selector: AttributeSelectorThumbnails | AttributeSelectorRadio | AttributeSelectorCheckbox | AttributeSelectorDropdown;
    /** The human readable title of the attribute (e.g. 'Color'). */
    title: string;
};
export type AttributeHelpLink = {
    /**
     * For now, size chart is the only supported help link dialog type.
     * @see fetchSizeChart
     */
    dialogType: 'sizeChart';
    /** The label of the link that should open the dialog. */
    label: string;
    type: 'dialog';
};
/** This selector type doesn't appear to currently be in use :/ */
export type AttributeSelectorCheckbox = {
    /**
     * The value, or internal name, of the option that represents the checked state.
     * (Under the hood, a checkbox is really a semantic UI element that selects between two underlying options.)
     * Use this as the second parameter when selecting an option.
     * @see selectOption
     */
    checkedValue: string;
    /** Will only be set when configured to show and non-zero. */
    priceDelta?: string;
    /** The human readable title of the checkbox (e.g. 'High Definition'). */
    title: string;
    type: 'checkbox';
    /**
     * The value, or internal name, of the option that represents the unchecked state.
     * (Under the hood, a checkbox is really a semantic UI element that selects between two underlying options.)
     * Use this as the second parameter when selecting an option.
     * @see selectOption
     */
    uncheckedValue: string;
};
export type AttributeSelectorDropdown = {
    /** An optional message to display beneath the dropdown (e.g. 'Unisex sizing') */
    message?: string;
    options: {
        /** Will only be set when configured to show and non-zero. */
        priceDelta?: string;
        /** The human readable title of the option (e.g. 'Red'). */
        title: string;
        /**
         * The value, or internal name, of the option.
         * Use this as the second parameter when selecting an option.
         * @see selectOption
         */
        value: string;
    }[];
    type: 'dropdown';
};
export type AttributeSelectorRadio = {
    options: {
        /** Will only be set when configured to show and non-zero. */
        priceDelta?: string;
        /** The human readable title of the option (e.g. 'Red'). */
        title: string;
        /**
         * The value, or internal name, of the option.
         * Use this as the second parameter when selecting an option.
         * @see selectOption
         */
        value: string;
    }[];
    type: 'radio';
};
export type AttributeSelectorThumbnails = {
    /**
     * In most cases, there will be only one group.
     * But in cases like shirts, there will be multiple, with unique labels.
     */
    optionGroups: {
        options: {
            /** Replace the `max_dim` param value with whatever resolution you'd like to use. */
            imageUrl: string;
            /** Will only be set when configured to show and non-zero. */
            priceDelta?: string;
            /** The human readable title of the option (e.g. 'Red'). */
            title: string;
            /**
             * The value, or internal name, of the option.
             * Use this as the second parameter when selecting an option.
             * @see selectOption
             */
            value: string;
        }[];
        /** The human readable title of the option group (e.g. 'Classic printing: no underbase'). */
        title?: string;
    }[];
    /**
     * When present, show a larger preview of the currently selected option, along with a description of the option.
     */
    preview?: {
        /** Will likely contain HTML elements, like `<li>`. */
        descriptionHTML: string;
        /** Replace the `max_dim` param value with whatever resolution you'd like to use. */
        imageUrl: string;
        /**
         * The human readable title of the option, primarily for a11y (equivalent to `attribute.selectedOptionTitle`).
         */
        optionTitle: string;
    };
    type: 'thumbnails';
};
export type DescriptionComponent = {
    /** The human readable title of the attribute (e.g. 'Color'). */
    attributeTitle: string;
    /**
     * The description contextual to the currently selected option.
     * Will likely contain HTML elements, like `<li>`.
     */
    descriptionHTML: string;
    /** The human readable title of the currently selected option (e.g. 'Red'). */
    selectedValueTitle: string;
};
export type QuantityOption = {
    /**
     * Will only be set when the discount on this quantity is better than the currently applied discount (e.g. '50%').
     */
    discount: string | undefined;
    /** The label for the quantity option (e.g. '1 shirt') */
    label: string;
    quantity: number;
};
export type PricingInfo = {
    /**
     * The label for the currently applied discount. For example,
     * 'You save 40% (LETZCELEBRATE)' or 'You save 55% (Volume Discount)'
     */
    discountLabel: string | undefined;
    /** The total price (respecting quantity), before any discounts */
    originalTotalPrice: string;
    /** The unit price, before any discounts */
    originalUnitPrice: string;
    /** The currently active promo code, iff that's what driving the current price */
    promoCode: string | undefined;
    /** Whether to show the "Comp Value" UI */
    showCompValue: boolean;
    /** The total price (respecting quantity), including any discounts */
    totalPrice: string;
    /** The unit price, including any discounts */
    unitPrice: string;
};
export type Realview = RealviewImage | RealviewVideo;
export type RealviewBase = {
    /** The unique identifier for the realview. Use this for determining which realview is selected. */
    id: string;
    title: string;
    /**
     * The URL for the image (or video thumbnnail).
     * Replace the `max_dim` param value with whatever resolution you'd like to use.
     */
    url: string;
};
export type RealviewImage = RealviewBase & {
    type: 'image';
};
export type RealviewVideo = RealviewBase & {
    /**
     * The source URL for the video in MP4 format (i.e. use `type="video/mp4"`).
     * For some video types, there will be a `max_dim` param in the URL. If so, replace that value with whatever resolution you'd like to use.
     */
    mp4Source: string;
    type: 'video';
};
export type ReviewsStats = {
    /** The total number of reviews for the product */
    count: number;
    /** The average rating for the product, from 1 to 5 */
    rating: number;
};
/**
 * Zazzle product types that the Adobe world knows about.
 */
export type AdobeKnownZazzleProductType = 'mojo_throwpillow' | 'zazzle_bag' | 'zazzle_businesscard' | 'zazzle_flyer' | 'zazzle_foldedthankyoucard' | 'zazzle_invitation3' | 'zazzle_mug' | 'zazzle_print' | 'zazzle_shirt' | 'zazzle_sticker';
export declare namespace SizeChart {
    interface ISizeChart {
        defaultToMetric?: boolean;
        fitStyle?: string;
        imageRealViewUrl?: string;
        isUnisex: boolean;
        modelInfo?: SizeChart.ISizeMeasurement[];
        sizeChart?: SizeChart.IChart;
        title?: string;
    }
    interface IModelInfo {
        bodyMeasurements: ISizeMeasurement[];
        wearingMeasurements: ISizeMeasurement[];
    }
    interface IChart {
        /** an array of measurement types in the size chart, defining the order of columns from left to right */
        measurementTypes: IMeasurementType[];
        /** an array of attribute value rows */
        attributeValues: IAttributeValueSizeMeasurement[];
    }
    interface IMeasurementType {
        label: string;
        key: TMeasurementKey;
        extraDescription: string;
    }
    type TMeasurementKey = 'bodyChest' | 'bodyWaist' | 'bodyHip' | 'bodyWeight' | 'bodyAge' | 'garmentWidth' | 'garmentHeight' | 'inseam';
    type TMeasurementTypeCategory = 'body' | 'garment';
    interface IAttributeValueSizeMeasurement {
        attributeValueLabel: string;
        measurements: {
            [key in TMeasurementKey]: ISizeMeasurement;
        };
    }
    interface ISizeMeasurement {
        label?: string;
        metric: string;
        imperial: string;
    }
}
/**
 * # createZazzlePDPStore
 *
 * Creates a Zazzle PDP store, which has several key responsibilities:
 * 1) Abstract away Zazzle API calls, so you only have to deal with high-level methods like `fetchProduct` and `selectOption`.
 * 2) Maintain an immutable data store representing the current state of the PDP.
 * 3) Translate raw API data into a more convenient format for rendering the PDP.
 *
 * ## Usage
 *
 * 1) Create a store instance.
 *    ```ts
 *    const store = createZazzlePDPStore({ region: 'us', language: 'en' });
 *    ```
 * 2) Fetch product data.
 *    ```ts
 *    await store.fetchProduct('template123');
 *    ```
 * 3) Subscribe to data changes so you can update your UI. (Unsubscribe by calling the function returned from `subscribe`.)
 *    ```ts
 *    const unsubscribe = store.subscribe(() => {
 *      const newState = store.getSnapshot();
 *      // Update your UI based on the new state
 *    });
 *    ```
 *
 * ## Reactive optimistic data model
 *
 * The store interaction/update loop assumes that the UI is fully driven by the state. User input responsiveness is solved with optimistic updates.
 * As such, the UI should not be remembering any of the state on its own, and should instead fully defer to the state.
 *
 * For example, calling `selectOption('color', 'red')` will result in several state updates, all of which will trigger the subscription callback. This is the flow.
 * 1) Update the state immediately with the newly selected color option (`attributes` will change).
 * 2) Fetch the new state of the attributes from the API and update the state again (`attributes` will change, potentially with a different set of options).
 * 3) Fetch new pricing and shipping estimate data concurrently, and update the state when each one returns.
 *
 * This approach results in immediate optimistic user feedback and async state updates as new data is received, just like on zazzle.com.
 *
 * ## Immutability
 *
 * The state is maintained immutably, so you can use `===` to compare previous and current state (at any level of the tree) to optimize re-renders.
 * ```ts
 * const shouldRerenderAttributesUi = previousState.attributes !== currentState.attributes;
 * ```
 *
 * ## useSyncExternalStore support
 *
 * This store directly integrates with the `useSyncExternalStore` API in UI frameworks like React and Preact.
 * ```ts
 * const [zazzlePDP] = useState(() => createZazzlePDPStore({ language: 'en', region: 'us' }));
 * const pdpState = useSyncExternalStore(zazzlePDP.subscribe, zazzlePDP.getSnapshot);
 * ```
 */
export declare function createZazzlePDPStore(options: {
    /**
     * ISO 639-1 language code
     * @example "en"
     *
     * If not provided, we use the default language for the given `region`.
     */
    language?: string;
    /**
     * ISO 3166-1 country code
     * @example "us"
     */
    region: string;
}): {
    /** Constants */
    env: {
        /**
         * ISO 4217 currency code
         * @example "USD"
         */
        currency: ZUIBase.ZCurrency;
        /**
         * ISO 639-1 language code
         * @example "en"
         *
         * If not provided, we use the default language for the given `region`.
         */
        language: "en" | "de" | "es" | "fr" | "ja" | "ko" | "nl" | "pt" | "sv";
        /**
         * ISO 3166-1 country code
         * @example "us"
         */
        region: "at" | "br" | "us" | "au" | "ca" | "gb" | "nz" | "de" | "ch" | "es" | "fr" | "be" | "jp" | "kr" | "nl" | "pt" | "se";
    };
    /**
     * Subscribes to changes in the data
     * @param callback Function that will be called when the data changes
     * @returns A function to unsubscribe the callback
     */
    subscribe: (callback: () => void) => () => void;
    /**
     * Gets the current state (you likely want to call this inside a subscription callback)
     * @see subscribe
     */
    getSnapshot: () => Readonly<PDPState | undefined>;
    /**
     * Fetches product (and accompanying) data for the given `templateId`.
     * This should be called once during page init, and then likely never again.
     */
    fetchProduct(templateId: string): Promise<void>;
    /**
     * Fetches size chart data for the current product state.
     * (This data is not stored in the state, since it's only needed on user action, and will be stale with any option change.)
     * @see AttributeHelpLink
     */
    fetchSizeChart(): Promise<SizeChart.ISizeChart>;
    /**
     * Optimistically updates the selected option, then syncs with the API.
     */
    selectOption(attributeName: string, value: string): Promise<void>;
    /**
     * Optimistically updates the quantity, then syncs with the API.
     */
    selectQuantity(quantity: number): Promise<void>;
    /**
     * Optimistically updates the selected realview, then syncs with the API.
     */
    selectRealview(realviewId: string): Promise<void>;
};
export default createZazzlePDPStore;
