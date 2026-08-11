import type { GmcLocale } from './gmcLocales';

const ZAZZLE_API = 'https://www.zazzle.com/svc/partner/adobeexpress/v1';

export interface ZazzleProduct {
  id: string;
  rootRawTitle: string;
  description: string;
  initialPrettyPreferredViewUrl: string;
  departmentName: string;
  productType: string;
  quantities: number[];
  pluralUnitLabel: string;
  singularUnitLabel: string;
  /** Raw query-string-shaped configured variant, e.g. "style=...&color=...&adobeproductid=...". Feeds fetchProductPricing. */
  productOption: string;
}

export async function fetchProductFromTemplate(productId: string): Promise<ZazzleProduct | null> {
  const url = `${ZAZZLE_API}/getproductfromtemplate?templateId=${encodeURIComponent(productId)}`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const json = await resp.json() as { success: boolean; data?: { product?: ZazzleProduct } };
    return json.data?.product ?? null;
  } catch {
    return null;
  }
}

const templateCache = new Map<string, ZazzleProduct>();

/**
 * Session-scoped memoized wrapper over {@link fetchProductFromTemplate}, keyed by product URN.
 * The template response (title, description, image URL, productOption) is stable for a given
 * product, so it's safe to reuse across the whole session — both the identity backfill and GMC
 * row assembly hit this. Price is deliberately NOT cached here: it's fetched fresh at submit time
 * via {@link fetchProductPricing} (see GMC-Status-Sync-PRD.md §4).
 *
 * Pass `{ force: true }` to bypass and refresh the cached entry — used by the per-row
 * "Refetch Zazzle info" action to re-pull after an edit on Zazzle's side or a transient failure.
 *
 * Only successful lookups are cached. A `null` — product genuinely not found, OR an
 * unreachable/CORS-blocked request that {@link fetchProductFromTemplate} swallowed to `null` — is
 * deliberately NOT cached, so a retry re-hits the network instead of returning a stale failure, and
 * a failed Document Manager backfill can't poison Generate-tab validation for the same URN.
 */
export async function lookupProductFromTemplate(
  productId: string,
  { force = false }: { force?: boolean } = {},
): Promise<ZazzleProduct | null> {
  if (!force && templateCache.has(productId)) return templateCache.get(productId) ?? null;
  const product = await fetchProductFromTemplate(productId);
  if (product) templateCache.set(productId, product);
  return product;
}

export interface ZazzlePricing {
  unitPrice: number;
  /** `discountProductItems[0].priceAdjusted` — present only when that entry's `discountEnd` is
   * still in the future (an expired/absent discount means no sale, per pdp-gmc-sync's own
   * `mapProduct.js` contract, which this mirrors so the dialog stays WYSIWYG with what's submitted). */
  salePrice?: number;
  /** Raw `discountEnd` ISO string, passed through as `sale_price_end_date`. Only set alongside `salePrice`. */
  saleEndDate?: string;
}

/**
 * Fetches the real unit price for the exact configured variant (`product.id` + `product.productOption`
 * from fetchProductFromTemplate) — more accurate than the flat `product.pricing.unitPrice` on the
 * template response, which reflects whatever default option combo that call resolves to, not
 * necessarily this row's actual configured variant. `quantity` has no observed effect on `unitPrice`
 * (verified empirically) so it's omitted; GMC always gets the base/unit price.
 *
 * Also surfaces an active sale price: `discountProductItems` is an array (Zazzle can return more
 * than one concurrently-active discount, e.g. different discount codes) — per decision, only the
 * first entry is ever considered; if it's absent there is no sale.
 */
export async function fetchProductPricing(
  numericProductId: string,
  productOption: string,
  locale: GmcLocale,
): Promise<ZazzlePricing | null> {
  const params = new URLSearchParams({
    zcur: locale.zcur,
    lang: locale.lang,
    region: locale.region,
    productId: numericProductId,
    productOptions: productOption,
    client: 'js',
  });
  const url = `${ZAZZLE_API}/getproductpricing?${params.toString()}`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const json = await resp.json() as {
      success: boolean;
      data?: {
        unitPrice?: number;
        discountProductItems?: { priceAdjusted?: number; discountEnd?: string }[];
      };
    };
    const data = json.data;
    if (data?.unitPrice == null) return null;
    const pricing: ZazzlePricing = { unitPrice: data.unitPrice };
    const discount = data.discountProductItems?.[0];
    if (discount?.priceAdjusted != null && discount.discountEnd && new Date(discount.discountEnd).getTime() > Date.now()) {
      pricing.salePrice = discount.priceAdjusted;
      pricing.saleEndDate = discount.discountEnd;
    }
    return pricing;
  } catch {
    return null;
  }
}
