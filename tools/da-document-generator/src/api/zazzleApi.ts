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
