import { getLibs } from '../../scripts/utils.js';
import { QA_CONFIGS } from '../../scripts/utils/frictionless-utils.js';

const ICONS_BASE = '/express/code/icons';

export const ACTION_TYPES = {
  QUICK_ACTION: 'quick-action', // launches SDK inline with the uploaded file
  APP_INSTALL: 'app-install', // navigates to app install URL (same tab)
};

// Max duration in seconds per quick action (source: Adobe Express help docs)
const MAX_DURATION = {
  'convert-to-gif': 60, // 1 minute
  'caption-video': 300, // 5 minutes
};

let replaceKey;
let getConfig;

export async function loadPlaceholders() {
  const [utils, placeholders] = await Promise.all([
    import(`${getLibs()}/utils/utils.js`),
    import(`${getLibs()}/features/placeholders.js`),
  ]);
  ({ getConfig } = utils);
  ({ replaceKey } = placeholders);
}

async function resolveKey(key, fallback) {
  const resolved = await replaceKey(key, getConfig());
  if (resolved === key.replaceAll('-', ' ')) return fallback;
  return resolved;
}

export async function getLocalizedStrings() {
  const keys = [
    ['edit-video', 'Edit video'],
    ['ios-app-only', 'iOS App only'],
    ['convert-video-to-gif', 'Convert video to GIF'],
    ['crop-video', 'Crop video'],
    ['trim-video', 'Trim video'],
    ['resize-video', 'Resize video'],
    ['convert-video-to-mp4', 'Convert video to MP4'],
    ['caption-video', 'Caption video'],
    ['opening-preview', 'Opening preview'],
    ['uploaded-video', 'Uploaded video'],
    ['start-from-your-video', 'Start from your video'],
    ['close-dialog', 'Close dialog'],
  ];
  const [
    editVideo,
    appOnly,
    convertVideoToGif,
    cropVideo,
    trimVideo,
    resizeVideo,
    convertVideoToMp4,
    captionVideo,
    openingPreview,
    uploadedVideo,
    startFromYourVideo,
    closeDialog,
  ] = await Promise.all(keys.map(([key, fb]) => resolveKey(key, fb)));
  return {
    editVideo,
    appOnly,
    convertVideoToGif,
    cropVideo,
    trimVideo,
    resizeVideo,
    convertVideoToMp4,
    captionVideo,
    openingPreview,
    uploadedVideo,
    startFromYourVideo,
    closeDialog,
  };
}

export function getVideoActions(strings, videoFile, videoDuration) {
  const actions = [
    {
      id: 'edit-video',
      label: strings.editVideo,
      badge: strings.appOnly,
      type: ACTION_TYPES.APP_INSTALL,
      iconPath: `${ICONS_BASE}/edit-video.svg`,
    },
    {
      id: 'convert-to-gif',
      label: strings.convertVideoToGif,
      type: ACTION_TYPES.QUICK_ACTION,
      iconPath: `${ICONS_BASE}/ax-convert-to-gif-22.svg`,
    },
    {
      id: 'crop-video',
      label: strings.cropVideo,
      type: ACTION_TYPES.QUICK_ACTION,
      iconPath: `${ICONS_BASE}/vqa-crop-video.svg`,
    },
    {
      id: 'trim-video',
      label: strings.trimVideo,
      type: ACTION_TYPES.QUICK_ACTION,
      iconPath: `${ICONS_BASE}/vqa-trim-video.svg`,
    },
    {
      id: 'resize-video',
      label: strings.resizeVideo,
      type: ACTION_TYPES.QUICK_ACTION,
      iconPath: `${ICONS_BASE}/vqa-resize-video.svg`,
    },
    {
      id: 'convert-to-mp4',
      label: strings.convertVideoToMp4,
      type: ACTION_TYPES.QUICK_ACTION,
      iconPath: `${ICONS_BASE}/convert-to-mp4.svg`,
    },
    {
      id: 'caption-video',
      label: strings.captionVideo,
      type: ACTION_TYPES.QUICK_ACTION,
      iconPath: `${ICONS_BASE}/ax-caption-video-22.svg`,
    },
  ];

  return actions.filter((action) => {
    // No point offering convert-to-mp4 if the file is already an MP4
    if (action.id === 'convert-to-mp4' && videoFile.type === 'video/mp4') return false;
    const config = QA_CONFIGS[action.id];
    if (!config) return false;
    if (!config.input_check(videoFile.type)) return false;
    if (videoFile.size > config.max_size) return false;
    const maxDuration = MAX_DURATION[action.id];
    if (maxDuration && videoDuration > maxDuration) return false;
    return true;
  });
}
