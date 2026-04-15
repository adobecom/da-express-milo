const SORT_TO_ORDER_BY = {
  'Most Relevant': '',
  'Most Viewed': '-remixCount',
  'Rare & Original': 'remixCount',
  'Newest to Oldest': '-createDate',
  'Oldest to Newest': 'createDate',
};

export function resolveTaasOrderBy(sortValue) {
  if (sortValue === undefined || sortValue === null) return null;

  const normalizedValue = String(sortValue).trim();
  if (normalizedValue in SORT_TO_ORDER_BY) {
    return SORT_TO_ORDER_BY[normalizedValue];
  }

  if (!normalizedValue) return '';

  const orderByMatch = normalizedValue.match(/^&?orderBy=(.+)$/);
  if (orderByMatch?.[1]) return orderByMatch[1];

  return null;
}

export function applyTaasToolbarOverrides(queryParams, props = {}) {
  if (props?.start) queryParams.set('start', props.start);

  if (props?.filters?.premium && props.filters.premium !== 'all') {
    queryParams.set('license', props.filters.premium.toLowerCase() === 'false' ? 'free' : 'premium');
  } else if (props?.filters?.premium === 'all') {
    queryParams.delete('license');
  }

  if (props?.filters?.animated && props.filters.animated !== 'all') {
    queryParams.set('behaviors', props.filters.animated.toLowerCase() === 'false' ? 'still' : 'animated');
  } else if (props?.filters?.animated === 'all') {
    queryParams.delete('behaviors');
  }

  const orderBy = resolveTaasOrderBy(props?.sort);
  if (orderBy === '') {
    queryParams.delete('orderBy');
  } else if (orderBy) {
    queryParams.set('orderBy', orderBy);
  }

  return queryParams;
}
