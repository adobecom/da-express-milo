/**
 * Plugin Manifest Registry
 *
 * Explicitly imports plugin manifests to avoid bundler-specific glob support.
 * Each plugin folder must export a default manifest from its own index.js.
 */
import behanceManifest from './behance/index.js';
import cclibraryManifest from './cclibrary/index.js';
import curatedManifest from './curated/index.js';
import kulerManifest from './kuler/index.js';
import reportAbuseManifest from './reportAbuse/index.js';
import stockManifest from './stock/index.js';
import universalManifest from './universal/index.js';
import userFeedbackManifest from './userFeedback/index.js';
import userSettingsManifest from './userSettings/index.js';

const pluginManifests = [
  behanceManifest,
  cclibraryManifest,
  curatedManifest,
  kulerManifest,
  reportAbuseManifest,
  stockManifest,
  universalManifest,
  userFeedbackManifest,
  userSettingsManifest,
].filter((manifest) => manifest && typeof manifest === 'object');

const pluginManifestMap = new Map(
  pluginManifests.map((manifest) => [manifest.name, manifest]),
);

export function getPluginManifests() {
  return pluginManifests;
}

export function getPluginManifest(name) {
  return pluginManifestMap.get(name);
}

