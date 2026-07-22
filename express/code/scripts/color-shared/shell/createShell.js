import createContextProvider from './contextProvider.js';
import { globalDependencyTracker } from './dependencyTracker.js';

function preload(dependencies) {
  return globalDependencyTracker.preload(dependencies);
}

export default function createShell(host) {
  const context = createContextProvider(host);
  return { context, preload, destroy() { context?.destroy(); } };
}
