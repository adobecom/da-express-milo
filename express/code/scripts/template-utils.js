/* eslint-disable no-underscore-dangle */
export const base = 'https://www.adobe.com/express-search-api-v3';

export const defaultCollectionId = 'urn:aaid:sc:VA6C2:25a82757-01de-4dd9-b0ee-bde51dd3b418';
export const popularCollectionId = 'urn:aaid:sc:VA6C2:a6767752-9c76-493e-a9e8-49b54b3b9852';
// eg: music,geometric,gourmet,cactus,journal,60 AND sprinkles,fun,cakestand,paint paper,abstract
export const TOPICS_AND_SEPARATOR = ' AND '; // allows joining topics groups
export const TOPICS_OR_SEPARATOR = ',';

function handleCollections(params) {
  if (params.has('collection')) {
    if (params.get('collection') === 'default') {
      params.set('collectionId', `${defaultCollectionId}`);
    } else if (params.get('collection') === 'popular') {
      params.set('collectionId', `${popularCollectionId}`);
    }
    params.delete('collection');
  }
  if (!params.get('collectionId')) {
    params.set('collectionId', `${defaultCollectionId}`);
  }
}

function handleFilters(params) {
  if (params.get('license')) {
    params.append('filters', `licensingCategory==${params.get('license')}`);
    params.delete('license');
  }
  if (params.get('behaviors')) {
    params.append('filters', `behaviors==${params.get('behaviors')}`);
    params.delete('behaviors');
  }
  if (params.get('tasks')) {
    params.append('filters', `pages.task.name==${params.get('tasks')}`);
    params.delete('tasks');
  }
  if (params.get('topics')) {
    params.get('topics').split(TOPICS_AND_SEPARATOR).forEach((group) => {
      params.append('filters', `topics==${group}`);
    });
    params.delete('topics');
  }
  if (params.get('language')) {
    params.append('filters', `language==${params.get('language')}`);
    params.delete('language');
  }
}

function handleHeaders(params) {
  const headers = {};
  if (params.get('prefLang')) {
    headers['x-express-pref-lang'] = params.get('prefLang');
    params.delete('prefLang');
  }
  if (params.get('prefRegion')) {
    headers['x-express-pref-region-code'] = params.get('prefRegion');
    params.delete('prefRegion');
  }
  return headers;
}

// backup=[-q;prefLang=en-GB]
export function getBackupRecipe(oldParams, backupStr) {
  const diffs = /\[(.+)\]/.exec(backupStr)[1].split(';');
  const params = new URLSearchParams(oldParams);
  params.delete('limit');
  params.delete('start');
  diffs.forEach((diff) => {
    const minus = /^-(.+)/.exec(diff);
    if (minus) {
      params.delete(minus[1]);
      return;
    }
    const update = /^(.+)=(.+)/.exec(diff);
    if (update) {
      params.set(update[1], update[2]);
    }
  });
  return params.toString();
}

export function recipe2ApiQuery(recipe) {
  const query = {};
  const params = new URLSearchParams(recipe);

  params.set('queryType', 'search');

  handleCollections(params);
  if (params.has('backup')) {
    const backupStr = params.get('backup');
    params.delete('backup');
    query.backupQuery = {
      target: params.get('limit'),
      ...recipe2ApiQuery(getBackupRecipe(params, backupStr)),
    };
  }
  if (params.get('templateIds')) {
    params.append('filters', `id==${params.get('templateIds')}`);
    params.delete('templateIds');
    // ids are very specific so removing some interference
    params.delete('start');
    params.delete('orderBy');
  } else {
    handleFilters(params);
    query.headers = handleHeaders(params);
  }

  // workaround to prevent akamai prod cache pollution causing cors issues in aem envs
  const envParam = (new URL(base).host === window.location.host) ? '' : '&ax-env=stage';
  query.url = `${base}?${decodeURIComponent(params.toString())}${envParam}`;
  return query;
}

async function fetchData(url, headers) {
  const response = await fetch(url, { headers });
  const data = await response.json();
  return data;
}

function dedup(items) {
  const [set, arr] = [new Set(), []];
  items.forEach((item) => {
    if (!set.has(item.id)) {
      set.add(item.id);
      arr.push(item);
    }
  });
  return arr;
}

export async function fetchResults(recipe) {
  const { url, headers, backupQuery } = recipe2ApiQuery(recipe);
  if (!backupQuery || !backupQuery.target) {
    return fetchData(url, headers);
  }
  const [prefPromise, backupPromise] = [
    fetchData(url, headers),
    fetchData(backupQuery.url, backupQuery.headers)];
  const prefRes = await prefPromise;
  if (prefRes.items?.length >= backupQuery.target) {
    return prefRes;
  }

  const backupRes = await backupPromise;
  const mergedItems = dedup([...prefRes.items, ...backupRes.items])
    .slice(0, backupQuery.target);
  return {
    metadata: {
      totalHits: mergedItems.length,
      start: '0',
      limit: backupQuery.target,
    },
    items: mergedItems,
  };
}

export function getTemplateTitle(template) {
  if (template['dc:title']?.['i-default']) {
    return template['dc:title']['i-default'];
  }
  if (template.moods?.length && template.task?.name) {
    return `${template.moods.join(', ')} ${template.task.name}`;
  }
  return '';
}

export function extractRenditionLinkHref(template) {
  return template._links?.['http://ns.adobe.com/adobecloud/rel/rendition']?.href;
}

export function extractComponentLinkHref(template) {
  return template._links?.['http://ns.adobe.com/adobecloud/rel/component']?.href;
}

export function containsVideo(template) {
  return !!template?.pages.some((page) => page?.rendition?.video?.thumbnail?.componentId);
}

export function isValidTemplate(template) {
  return !!(template.status === 'approved'
      && template.customLinks?.branchUrl
      && (template.assetType === 'Webpage_Template' || template.pages?.[0]?.rendition?.image?.thumbnail?.componentId)
      && template._links?.['http://ns.adobe.com/adobecloud/rel/rendition']?.href?.replace
      && template._links?.['http://ns.adobe.com/adobecloud/rel/component']?.href?.replace
  );
}

function extractImageThumbnail(page) {
  return page?.rendition?.image?.thumbnail;
}

export function getImageThumbnailSrc(renditionLinkHref, componentLinkHref, page) {
  const thumbnail = extractImageThumbnail(page);
  if (!thumbnail) {
    // webpages
    return renditionLinkHref.replace('{&page,size,type,fragment}', '');
  }
  const {
    mediaType,
    componentId,
    width,
    height,
    hzRevision,
  } = thumbnail;
  if (mediaType === 'image/webp') {
    // webp only supported by componentLink
    return componentLinkHref.replace(
      '{&revision,component_id}',
      `&revision=${hzRevision || 0}&component_id=${componentId}`,
    );
  }

  return renditionLinkHref.replace(
    '{&page,size,type,fragment}',
    `&size=${Math.max(width, height)}&type=${mediaType}&fragment=id=${componentId}`,
  );
}

const videoMetadataType = 'application/vnd.adobe.ccv.videometadata';

export async function getVideoUrls(renditionLinkHref, componentLinkHref, page) {
  const videoThumbnail = page.rendition?.video?.thumbnail;
  const { componentId } = videoThumbnail;
  const preLink = renditionLinkHref.replace(
    '{&page,size,type,fragment}',
    `&type=${videoMetadataType}&fragment=id=${componentId}`,
  );
  const backupPosterSrc = getImageThumbnailSrc(renditionLinkHref, componentLinkHref, page);
  try {
    const response = await fetch(preLink);
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    const { renditionsStatus: { state }, posterframe, renditions } = await response.json();
    if (state !== 'COMPLETED') throw new Error('Video not ready');

    const mp4Rendition = renditions.find((r) => r.videoContainer === 'MP4');
    if (!mp4Rendition?.url) throw new Error('No MP4 rendition found');

    return { src: mp4Rendition.url, poster: posterframe?.url || backupPosterSrc };
  } catch (err) {
    // use componentLink as backup
    return {
      src: componentLinkHref.replace(
        '{&revision,component_id}',
        `&revision=0&component_id=${componentId}`,
      ),
      poster: backupPosterSrc,
    };
  }
}
