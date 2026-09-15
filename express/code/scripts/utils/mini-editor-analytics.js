import { getMetadata } from '../utils.js';
import trackExportEvent from './export-analytics.js';

const UI_LOCATION = 'seo-discover-page';

function getMiniEditorTaskName() {
  return getMetadata('messagetype')?.trim() || 'quote';
}

export default function trackMiniEditorExport({ exportMethod } = {}) {
  return trackExportEvent({
    exportMethod,
    taskName: getMiniEditorTaskName(),
    uiLocation: UI_LOCATION,
  });
}
