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
      baseUrl: 'https://search.adobe.io/api/v2',
      apiKey: 'KulerBackendClientId',
      endpoints: {
        search: '/search',
        api: '/api/v2',
        themePath: '/themes',
        gradientPath: '/gradient',
        themeBaseUrl: 'https://themes.adobe.io',
        likeBaseUrl: 'https://asset.adobe.io',
        gradientBaseUrl: 'https://gradient.adobe.io',
      },
    },
    stock: {
      baseUrl: 'https://stock.adobe.io/Rest/Media/1',
      apiKey: 'ColorWeb',
      endpoints: {
        search: '/Search/Files',
        redirect: 'https://stock.adobe.com',
        contributor: '/contributor',
      },
    },
    behance: {
      baseUrl: 'https://cc-api-behance.adobe.io/v2',
      apiKey: 'ColorWeb',
      endpoints: {
        projects: '/projects',
      },
    },
    cclibrary: {
      baseUrl: 'https://cc-api-assets.adobe.io',
      melvilleBasePath: 'https://libraries.adobe.io/api/v1',
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
      baseUrl: 'https://search-stage.adobe.io/api/v2',
      endpoints: {
        ...PROD_CONFIG.services.kuler.endpoints,
        themeBaseUrl: 'https://themes-stage.adobe.io',
        likeBaseUrl: 'https://asset-stage.adobe.io',
        gradientBaseUrl: 'https://gradient-stage.adobe.io',
      },
    },
    behance: {
      ...PROD_CONFIG.services.behance,
      baseUrl: 'https://cc-api-behance-stage.adobe.io/v2',
    },
    cclibrary: {
      ...PROD_CONFIG.services.cclibrary,
      melvilleBasePath: 'https://ccx-melville-stage.adobe.io/api/v1',
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

    ENABLE_KULER: true,
    ENABLE_CURATED: true,
    ENABLE_CCLIBRARY: true,

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
