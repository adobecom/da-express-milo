import { getLibs } from '../utils.js';

// Shared constants and configurations for frictionless quick actions
const JPG = 'jpg';
const JPEG = 'jpeg';
const PNG = 'png';
const WEBP = 'webp';

const VIDEO_FORMATS = [
  'mov',
  'mp4',
  'crm',
  'avi',
  'm2ts',
  '3gp',
  'f4v',
  'mpeg',
  'm2t',
  'm2p',
  'm1v',
  'mpg',
  'wmv',
  'tts',
  '264',
];

const VIDEO_MIME_TYPES = {
  mov: 'video/quicktime',
  mp4: 'video/mp4',
  crm: 'video/x-ms-crm',
  avi: 'video/x-msvideo',
  m2ts: 'video/mp2t',
  '3gp': 'video/3gpp',
  f4v: 'video/x-f4v',
  mpeg: 'video/mpeg',
  m2t: 'video/mp2t',
  m2p: 'video/mp2p',
  m1v: 'video/mpeg',
  mpg: 'video/mpeg',
  wmv: 'video/x-ms-wmv',
  tts: 'video/tts',
  // eslint-disable-next-line quote-props
  264: 'video/h264',
};

// Configuration functions
const getBaseImgCfg = (...types) => ({
  group: 'image',
  max_size: 40 * 1024 * 1024,
  accept: types.map((type) => `.${type}`).join(', '),
  input_check: (input) => types.map((type) => `image/${type}`).includes(input),
});

const getBaseVideoCfg = (...types) => {
  const formats = Array.isArray(types[0]) ? types[0] : types;
  return {
    group: 'video',
    max_size: 1024 * 1024 * 1024,
    accept: formats.map((type) => `.${type}`).join(', '),
    input_check: (input) => {
      const supportedMimeTypes = formats
        .map((type) => VIDEO_MIME_TYPES[type])
        .filter(Boolean);
      return supportedMimeTypes.includes(input);
    },
  };
};

const getMergeVideosCfg = () => ({
  group: 'video',
  max_size: 1024 * 1024 * 1024, // Use video max size (1GB)
  accept: [...VIDEO_FORMATS, JPG, JPEG, PNG]
    .map((type) => `.${type}`)
    .join(', '),
  input_check: (input) => {
    const videoMimeTypes = VIDEO_FORMATS.map(
      (type) => VIDEO_MIME_TYPES[type],
    ).filter(Boolean);
    const imageTypes = [JPG, JPEG, PNG].map((type) => `image/${type}`);
    return [...videoMimeTypes, ...imageTypes].includes(input);
  },
});

// Shared QA configurations
export const QA_CONFIGS = {
  'convert-to-jpg': { ...getBaseImgCfg(PNG, WEBP) },
  'convert-to-png': { ...getBaseImgCfg(JPG, JPEG, WEBP) },
  'convert-to-svg': { ...getBaseImgCfg(JPG, JPEG, PNG) },
  'crop-image': { ...getBaseImgCfg(JPG, JPEG, PNG) },
  'resize-image': { ...getBaseImgCfg(JPG, JPEG, PNG, WEBP) },
  'remove-background': { ...getBaseImgCfg(JPG, JPEG, PNG) },
  'generate-qr-code': {
    ...getBaseImgCfg(JPG, JPEG, PNG),
    input_check: () => true,
  },
  'qa-in-product-variant1': { ...getBaseImgCfg(JPG, JPEG, PNG) },
  'qa-in-product-variant2': { ...getBaseImgCfg(JPG, JPEG, PNG) },
  'qa-in-product-control': { ...getBaseImgCfg(JPG, JPEG, PNG) },
  'qa-nba': { ...getBaseImgCfg(JPG, JPEG, PNG) },
  'convert-to-gif': { ...getBaseVideoCfg(VIDEO_FORMATS) },
  'crop-video': { ...getBaseVideoCfg(VIDEO_FORMATS) },
  'trim-video': { ...getBaseVideoCfg(VIDEO_FORMATS) },
  'resize-video': { ...getBaseVideoCfg(VIDEO_FORMATS) },
  'merge-videos': getMergeVideosCfg(),
  'convert-to-mp4': { ...getBaseVideoCfg(VIDEO_FORMATS) },
  'caption-video': { ...getBaseVideoCfg(VIDEO_FORMATS) },
  'edit-video': { ...getBaseVideoCfg(VIDEO_FORMATS) },
  'edit-image': { ...getBaseImgCfg(JPG, JPEG, PNG, WEBP) },
};

// Experimental variants
export const EXPERIMENTAL_VARIANTS = [
  'qa-in-product-variant1',
  'qa-in-product-variant2',
  'qa-nba',
  'qa-in-product-control',
];

// Quick actions allowed in frictionless upload feature
export const FRICTIONLESS_UPLOAD_QUICK_ACTIONS = {
  videoEditor: 'edit-video',
  imageEditor: 'edit-image',
};

// Shared utility functions
export function selectElementByTagPrefix(p) {
  const allEls = document.body.querySelectorAll(':scope > *');
  return Array.from(allEls).find((e) => e.tagName.toLowerCase().startsWith(p.toLowerCase()));
}

export function fadeIn(element) {
  element.classList.remove('hidden');
  setTimeout(() => {
    element.classList.remove('transparent');
  }, 10);
}

export function fadeOut(element) {
  element.classList.add('transparent');
  setTimeout(() => {
    element.classList.add('hidden');
  }, 200);
}

// Common document configurations
export function createDocConfig(data, type = 'image') {
  const dataType = type === 'video' ? 'blob' : 'base64';
  return {
    asset: {
      data,
      dataType,
      type,
      name: data.name,
    },
  };
}

export function createMergeVideosDocConfig(data) {
  const assets = [];
  for (const file of data) {
    assets.push({
      data: file,
      dataType: 'blob',
      type: 'video',
      name: file.name,
    });
  }
  return {
    assets,
  };
}

// Common container configuration
export function createContainerConfig(quickAction) {
  return {
    mode: 'inline',
    parentElementId: `${quickAction}-container`,
    backgroundColor: 'transparent',
    hideCloseButton: true,
    padding: 0,
  };
}

export function createDefaultExportConfig() {
  return [
    {
      id: 'downloadExportOption',
      // label: 'Download',
      action: { target: 'download' },
      style: { uiType: 'button' },
      buttonStyle: {
        variant: 'secondary',
        treatment: 'fill',
        size: 'xl',
      },
    },
    {
      id: 'edit-in-express',
      // label: 'Edit in Adobe Express for free',
      action: { target: 'express' },
      style: { uiType: 'button' },
      buttonStyle: {
        variant: 'primary',
        treatment: 'fill',
        size: 'xl',
      },
    },
  ];
}

export async function createMobileExportConfig(
  quickAction,
  downloadText,
  editText,
) {
  const exportConfig = createDefaultExportConfig();
  return [
    {
      ...exportConfig[0],
      ...(QA_CONFIGS[quickAction].group === 'video'
        ? {}
        : { label: downloadText }),
    },
    {
      ...exportConfig[1],
      ...(QA_CONFIGS[quickAction].group === 'video' ? {} : { label: editText }),
    },
  ];
}

// Helper function to execute quick actions with common parameters
export function executeQuickAction(
  ccEverywhere,
  quickActionId,
  docConfig,
  appConfig,
  exportConfig,
  contConfig,
  videoDocConfig,
) {
  const quickActionMap = {
    'convert-to-jpg': () => ccEverywhere.quickAction.convertToJPEG(
      docConfig,
      appConfig,
      exportConfig,
      contConfig,
    ),
    'convert-to-png': () => ccEverywhere.quickAction.convertToPNG(
      docConfig,
      appConfig,
      exportConfig,
      contConfig,
    ),
    'convert-to-svg': () => {
      exportConfig.pop();
      ccEverywhere.quickAction.convertToSVG(
        docConfig,
        appConfig,
        exportConfig,
        contConfig,
      );
    },
    'crop-image': () => ccEverywhere.quickAction.cropImage(
      docConfig,
      appConfig,
      exportConfig,
      contConfig,
    ),
    'resize-image': () => ccEverywhere.quickAction.resizeImage(
      docConfig,
      appConfig,
      exportConfig,
      contConfig,
    ),
    'remove-background': () => ccEverywhere.quickAction.removeBackground(
      docConfig,
      appConfig,
      exportConfig,
      contConfig,
    ),
    'generate-qr-code': () => ccEverywhere.quickAction.generateQRCode(
      {},
      appConfig,
      exportConfig,
      contConfig,
    ),
    'convert-to-gif': () => ccEverywhere.quickAction.convertToGIF(
      videoDocConfig,
      appConfig,
      exportConfig,
      contConfig,
    ),
    'crop-video': () => ccEverywhere.quickAction.cropVideo(
      videoDocConfig,
      appConfig,
      exportConfig,
      contConfig,
    ),
    'trim-video': () => ccEverywhere.quickAction.trimVideo(
      videoDocConfig,
      appConfig,
      exportConfig,
      contConfig,
    ),
    'resize-video': () => ccEverywhere.quickAction.resizeVideo(
      videoDocConfig,
      appConfig,
      exportConfig,
      contConfig,
    ),
    'merge-videos': () => ccEverywhere.quickAction.mergeVideos(
      videoDocConfig,
      appConfig,
      exportConfig,
      contConfig,
    ),
    'convert-to-mp4': () => ccEverywhere.quickAction.convertToMP4(
      videoDocConfig,
      appConfig,
      exportConfig,
      contConfig,
    ),
    'caption-video': () => ccEverywhere.quickAction.captionVideo(
      videoDocConfig,
      appConfig,
      exportConfig,
      contConfig,
    ),
  };

  const action = quickActionMap[quickActionId];
  if (action) {
    action();
  }
}

export async function getErrorMsg(files, quickAction, replaceKey, getConfig) {
  let msg;
  const isNotValid = Array.from(files).some(
    (file) => !QA_CONFIGS[quickAction].input_check(file.type),
  );
  if (isNotValid) {
    msg = await replaceKey('file-type-not-supported', getConfig());
  } else {
    msg = await replaceKey('file-size-not-supported', getConfig());
  }
  return msg;
}

export async function processFileForQuickAction(
  file,
  quickAction,
) {
  const maxSize = QA_CONFIGS[quickAction].max_size ?? 40 * 1024 * 1024;

  if (QA_CONFIGS[quickAction].input_check(file.type) && file.size <= maxSize) {
    const isVideo = QA_CONFIGS[quickAction].group === 'video';
    if (isVideo) {
      window.history.pushState({ hideFrictionlessQa: true }, '', '');
      return file;
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        window.history.pushState({ hideFrictionlessQa: true }, '', '');
        resolve(reader.result);
      };
      reader.readAsDataURL(file);
    });
  }
  return undefined;
}

export async function processFilesForQuickAction(files, quickAction) {
  const data = await Promise.all(
    Array.from(files).map((file) => processFileForQuickAction(file, quickAction)),
  );
  return data;
}

export function createSDKConfig(getConfig, urlParams) {
  let { ietf } = getConfig().locale;
  const country = urlParams.get('country');
  if (country) ietf = getConfig().locales[country]?.ietf;
  if (ietf === 'zh-Hant-TW') ietf = 'tw-TW';
  else if (ietf === 'zh-Hans-CN') ietf = 'cn-CN';
  // query parameter URL for overriding the cc everywhere
  // iframe source URL, used for testing new experiences
  const isStageEnv = urlParams.get('hzenv') === 'stage';

  return {
    hostInfo: {
      clientId: 'AdobeExpressWeb',
      appName: 'express',
    },
    configParams: {
      locale: ietf?.replace('-', '_'),
      env: isStageEnv ? 'stage' : 'prod',
    },
    authOption: () => ({ mode: 'delayed' }),
  };
}

export async function loadAndInitializeCCEverywhere(getConfig) {
  const urlParams = new URLSearchParams(window.location.search);
  const urlOverride = urlParams.get('sdk-override');
  let valid = false;
  if (urlOverride) {
    try {
      if (new URL(urlOverride).host === 'dev.cc-embed.adobe.com') valid = true;
    } catch (e) {
      window.lana.log('Invalid SDK URL');
    }
  }
  const CDN_URL = valid
    ? urlOverride
    : 'https://cc-embed.adobe.com/sdk/1p/v4/CCEverywhere.js';

  const { loadScript } = await import(`${getLibs()}/utils/utils.js`);
  await loadScript(CDN_URL);

  if (!window.CCEverywhere) {
    return undefined;
  }

  const ccEverywhereConfig = createSDKConfig(getConfig, urlParams);
  return window.CCEverywhere.initialize(...Object.values(ccEverywhereConfig));
}

export async function initProgressBar(replaceKey, getConfig) {
  const { default: ProgressBar } = await import('./createProgressBar.js');
  const progressBar = new ProgressBar();
  const uploadLabel = await replaceKey('uploading-media', getConfig());
  progressBar.setAttribute('label', `<b>Adobe Express</b> ${uploadLabel}`);
  progressBar.setAttribute('aria-label', uploadLabel);
  progressBar.setAttribute('width', '400px');
  progressBar.setAttribute('show-percentage', 'false');
  progressBar.setAttribute('progress', '2');
  return progressBar;
}
