import { getMetadata } from '../utils.js';
import { trackExportComplete } from '../instrument.js';

const UI_LOCATION = 'seo-discover-page';

function getMiniEditorTaskName() {
  return getMetadata('messagetype')?.trim() || 'quote';
}

export default function trackMiniEditorExport({ exportMethod } = {}) {
  return trackExportComplete({
    exportMethod,
    taskName: getMiniEditorTaskName(),
    uiLocation: UI_LOCATION,
  });
}
