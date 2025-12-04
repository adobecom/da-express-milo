/**
 * Schema parsing and storage utilities
 */

import { STORAGE_KEY } from './state.js';

/**
 * Get stored schema from sessionStorage
 */
export function getStoredSchema() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
  } catch (e) {
    console.error('Failed to parse stored schema:', e);
    return {};
  }
}

/**
 * Parse schema fields into hierarchical structure
 * Groups fields by their prefix (e.g., hero.title -> hero group with title field)
 */
export function parseSchemaHierarchy(fields) {
  const groups = {};
  const repeaters = {};
  const standalone = [];

  fields.forEach((field) => {
    const { key } = field;

    // Check for repeater pattern: name[].field
    const repeaterMatch = key.match(/^([^[]+)\[\]\.(.+)$/);
    if (repeaterMatch) {
      const [, repeaterName, fieldName] = repeaterMatch;
      if (!repeaters[repeaterName]) {
        repeaters[repeaterName] = { name: repeaterName, fields: [] };
      }
      repeaters[repeaterName].fields.push({ ...field, fieldName, originalKey: key });
      return;
    }

    // Check for group pattern: name.field
    const groupMatch = key.match(/^([^.]+)\.(.+)$/);
    if (groupMatch) {
      const [, groupName, fieldName] = groupMatch;
      if (!groups[groupName]) {
        groups[groupName] = { name: groupName, fields: [] };
      }
      groups[groupName].fields.push({ ...field, fieldName, originalKey: key });
      return;
    }

    // Standalone field
    standalone.push(field);
  });

  return { groups, repeaters, standalone };
}

