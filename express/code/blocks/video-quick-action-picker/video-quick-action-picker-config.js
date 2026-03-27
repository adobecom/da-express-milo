import { getLibs } from '../../scripts/utils.js';
import { QA_CONFIGS } from '../../scripts/utils/frictionless-utils.js';

export const ACTION_TYPES = {
  QUICK_ACTION: 'quick-action', // launches SDK inline with the uploaded file
  APP_INSTALL: 'app-install',   // navigates to app install URL (same tab)
};

// Max duration in seconds per quick action (source: Adobe Express help docs)
const MAX_DURATION = {
  'convert-to-gif': 60,    // 1 minute
  'caption-video': 300,    // 5 minutes
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
  return {
    editVideo: await resolveKey('edit-video', 'Edit video'),
    appOnly: await resolveKey('ios-app-only', 'iOS App only'),
    convertVideoToGif: await resolveKey('convert-video-to-gif', 'Convert video to GIF'),
    cropVideo: await resolveKey('crop-video', 'Crop video'),
    trimVideo: await resolveKey('trim-video', 'Trim video'),
    resizeVideo: await resolveKey('resize-video', 'Resize video'),
    convertVideoToMp4: await resolveKey('convert-video-to-mp4', 'Convert video to MP4'),
    captionVideo: await resolveKey('caption-video', 'Caption video'),
    openingPreview: await resolveKey('opening-preview', 'Opening preview'),
    uploadedVideo: await resolveKey('uploaded-video', 'Uploaded video'),
    previewUnavailable: await resolveKey('preview-unavailable', 'Preview unavailable'),
    startFromYourVideo: await resolveKey('start-from-your-video', 'Start from your video'),
    closeDialog: await resolveKey('close-dialog', 'Close dialog'),
  };
}

export function getVideoActions(strings, videoFile, videoDuration) {
  const actions = [
    {
      id: 'edit-video',
      label: strings.editVideo,
      badge: strings.appOnly,
      type: ACTION_TYPES.APP_INSTALL,
      icon: 'edit-video',
    },
    {
      id: 'convert-to-gif',
      label: strings.convertVideoToGif,
      type: ACTION_TYPES.QUICK_ACTION,
      icon: 'ax-convert-to-gif-22',
    },
    {
      id: 'crop-video',
      label: strings.cropVideo,
      type: ACTION_TYPES.QUICK_ACTION,
      icon: 'ax-crop-image-22', // TODO: replace with crop-video-22 icon when available
    },
    {
      id: 'trim-video',
      label: strings.trimVideo,
      type: ACTION_TYPES.QUICK_ACTION,
      icon: 'trim-video-22',
    },
    {
      id: 'resize-video',
      label: strings.resizeVideo,
      type: ACTION_TYPES.QUICK_ACTION,
      icon: 'ax-resize-video-22',
    },
    {
      id: 'convert-to-mp4',
      label: strings.convertVideoToMp4,
      type: ACTION_TYPES.QUICK_ACTION,
      icon: 'ax-convert-22', // TODO: replace with convert-video-to-mp4-22 icon when available
    },
    {
      id: 'caption-video',
      label: strings.captionVideo,
      type: ACTION_TYPES.QUICK_ACTION,
      icon: 'ax-caption-video-22',
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
