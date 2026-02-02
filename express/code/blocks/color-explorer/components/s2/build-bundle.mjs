/**
 * Bundle Spectrum Web Components Tags into a single self-contained file
 * Run: node build-bundle.mjs
 * 
 * Output: spectrum-tags.bundle.js
 * - Includes both <sp-tags> and <sp-tag> components
 * - Includes Lit template library (no external dependencies!)
 * - Minified for production
 * - ~98 KB (~26 KB gzipped)
 * 
 * No import map needed - everything is bundled!
 */

import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('🎯 Bundling Spectrum Tags...\n');

try {
  // Bundle both components into a single file
  const cwd = process.cwd();
  await esbuild.build({
    // Create a virtual entry point that imports both components
    stdin: {
      contents: `
        export * from '@spectrum-web-components/tags/sp-tags.js';
        export * from '@spectrum-web-components/tags/sp-tag.js';
      `,
      resolveDir: cwd,
      sourcefile: 'spectrum-tags-entry.js',
    },
    bundle: true,
    format: 'esm',
    outfile: join(__dirname, 'spectrum-tags.bundle.js'),
    // Bundle everything together (no external dependencies)
    external: [],
    minify: true, // Minify for production
    sourcemap: false, // Set to true if you need debugging support
    target: 'es2020',
    logLevel: 'info',
  });

  console.log('\n✅ Bundle created successfully!');
  console.log('\nCreated file:');
  console.log('  - spectrum-tags.bundle.js (SELF-CONTAINED - no dependencies!)');
  console.log('\n📦 What\'s included:');
  console.log('  - <sp-tags> and <sp-tag> components');
  console.log('  - Lit template library');
  console.log('  - All base classes and controllers');
  console.log('\n📝 How to use:');
  console.log('  Just import the bundle:');
  console.log('    import "./s2/spectrum-tags.bundle.js";');
  console.log('\n💡 No import map needed - everything is bundled!');
  
} catch (error) {
  console.error('❌ Bundle failed:', error);
  process.exit(1);
}
