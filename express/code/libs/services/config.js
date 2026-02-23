import { getLibs } from '../../scripts/utils.js';
import { ConfigError } from './core/Errors.js';

export async function getEnvironment() {
  const libs = getLibs();
  if (!libs) {
    throw new ConfigError(
      'Milo libs are not configured. Call setLibs() before resolving service config.',
      { serviceName: 'config', configKey: 'libs' },
    );
  }

  const { getConfig } = await import(`${libs}/utils/utils.js`);
  return getConfig().env.name;
}

const PROD_CONFIG = {
  environment: 'production',
  services: {
    kuler: {
      baseSearchUrl: 'https://search.adobe.io/api/v2',
      exploreBaseUrl: 'https://themesb3.adobe.io',
      themeBaseUrl: 'https://themes.adobe.io',
      likeBaseUrl: 'https://asset.adobe.io',
      gradientBaseUrl: 'https://gradient.adobe.io',
      apiKey: 'KulerBackendClientId',
      endpoints: {
        search: '/search',
        api: '/api/v2',
        themePath: '/themes',
        gradientPath: '/gradient',
        tagsPath: '/tags',
      },
    },
    stock: {
      baseUrl: 'https://stock.adobe.io/Rest/Media/1',
      apiKey: 'ColorWeb',
      productId: 'AdobeColor/4.0',
      endpoints: {
        search: '/Search/Files',
        redirect: 'https://stock.adobe.com',
        contributor: '/contributor',
      },
    },
    behance: {
      baseUrl: 'https://cc-api-behance.adobe.io/v2',
      graphqlUrl: 'https://cc-api-behance.adobe.io/v3/graphql',
      apiKey: 'ColorWeb',
      endpoints: {
        projects: '/projects',
        galleries: '/galleries',
      },
    },
    cclibrary: {
      baseUrl: 'https://cc-api-assets.adobe.io',
      melvilleBasePath: 'https://libraries.adobe.io/api/v1',
      melvilleDomainPath: 'https://libraries.adobe.io',
      apiKey: 'ColorWeb',
      assetAclDirectoryKey: 'http://ns.adobe.com/adobecloud/rel/directory',
      middleware: ['error', 'logging', { name: 'auth', topics: ['cclibrary.theme.*'] }],
      endpoints: {
        libraries: '/libraries',
        themes: '/elements',
        metadata: '/metadata',
      },
    },
    curated: {
      baseUrl: 'https://d2ulm998byv1ft.cloudfront.net/curaredData.json',
      endpoints: {},
    },
    universal: {
      baseUrl: 'https://adobesearch.adobe.io/universal-search/v2',
      apiKey: 'ColorWeb',
      xProduct: 'Color',
      xProductLocation: 'Color Website',
      endpoints: {
        similarity: '/similarity-search',
        anonymousImageSearch: 'https://search.adobe.io/imageSearch',
      },
    },
    autotag: {
      baseUrl: 'https://kulerautotag.adobe.io',
      endpoints: {
        autotag: '/autotag',
      },
    },
    vader: {
      baseUrl: 'https://t7peykbaei.execute-api.us-east-1.amazonaws.com',
      serviceId: 'color',
      applicationId: 'color_web',
      endpoints: {
        api: '/prod',
      },
    },
  },
};

const STAGE_CONFIG = {
  ...PROD_CONFIG,
  environment: 'stage',
  services: {
    ...PROD_CONFIG.services,
    kuler: {
      ...PROD_CONFIG.services.kuler,
      baseSearchUrl: 'https://search-stage.adobe.io/api/v2',
      exploreBaseUrl: 'https://themesb3-stage.adobe.io',
      themeBaseUrl: 'https://themes-stage.adobe.io',
      likeBaseUrl: 'https://asset-stage.adobe.io',
      gradientBaseUrl: 'https://gradient-stage.adobe.io',
    },
    stock: {
      ...PROD_CONFIG.services.stock,
      baseUrl: 'https://stock-stage.adobe.io/Rest/Media/1',
      endpoints: {
        ...PROD_CONFIG.services.stock.endpoints,
        redirect: 'https://primary.stock.stage.adobe.com',
      },
    },
    behance: {
      ...PROD_CONFIG.services.behance,
      baseUrl: 'https://cc-api-behance-stage.adobe.io/v2',
      graphqlUrl: 'https://cc-api-behance-stage.adobe.io/v3/graphql',
    },
    cclibrary: {
      ...PROD_CONFIG.services.cclibrary,
      baseUrl: 'https://cc-api-assets-stage.adobe.io',
      melvilleBasePath: 'https://ccx-melville-stage.adobe.io/api/v1',
      melvilleDomainPath: 'https://ccx-melville-stage.adobe.io',
    },
    universal: {
      ...PROD_CONFIG.services.universal,
      baseUrl: 'https://adobesearch-stage.adobe.io/universal-search/v2',
      endpoints: {
        ...PROD_CONFIG.services.universal.endpoints,
        anonymousImageSearch: 'https://search-stage.adobe.io/imageSearch',
      },
    },
    autotag: {
      ...PROD_CONFIG.services.autotag,
      baseUrl: 'https://kulerautotag-stage.adobe.io',
    },
    vader: {
      ...PROD_CONFIG.services.vader,
      baseUrl: 'https://d005vu55s3.execute-api.us-east-1.amazonaws.com',
      endpoints: {
        api: '/stage',
      },
    },
  },
};

function getServiceConfigForEnvironment(env) {
  if (env !== 'prod') {
    return STAGE_CONFIG.services;
  }
  return PROD_CONFIG.services;
}

export async function getServiceConfig() {
  const env = await getEnvironment();
  return getServiceConfigForEnvironment(env);
}

const config = {

  features: {
    /** Plugins */
    ENABLE_KULER: true,
    ENABLE_CURATED: true,
    ENABLE_CCLIBRARY: true,

    /** Middlewares */
    ENABLE_ERROR: true,
    ENABLE_LOGGING: true,
    ENABLE_AUTH: true,
  },

  middleware: ['error', 'logging'],

  services: PROD_CONFIG.services,

  get environment() {
    return 'prod';
  },
};

export async function getResolvedConfig() {
  const environment = await getEnvironment();
  const services = getServiceConfigForEnvironment(environment);

  return {
    ...config,
    services,
    environment,
  };
}

export default config;
