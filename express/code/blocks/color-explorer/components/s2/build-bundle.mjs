/**
 * Bundle Spectrum Web Components Tags (following Milo's pattern)
 * Run: node build-bundle.mjs
 * 
 * Output: spectrum-tags.bundle.js
 * - Includes both <sp-tags> and <sp-tag> components
 * - Uses Milo's shared lit-all.min.js (loaded globally)
 * - Minified for production
 * - ~12 KB (~4 KB gzipped) - much smaller without bundling Lit!
 * 
 * Lit is loaded once via /libs/deps/lit-all.min.js (Milo's pattern)
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
    // Lit is loaded globally via Milo's lit-all.min.js (shared by all components)
    external: ['lit', '@lit/*'],
    minify: true, // Minify for production
    sourcemap: false, // Set to true if you need debugging support
    target: 'es2020',
    logLevel: 'info',
  });

  console.log('\n✅ Bundle created successfully!');
  console.log('\nCreated file:');
  console.log('  - spectrum-tags.bundle.js (~12 KB, ~4 KB gzipped)');
  console.log('\n📦 What\'s included:');
  console.log('  - <sp-tags> and <sp-tag> components');
  console.log('  - All base classes and controllers');
  console.log('\n🔗 Depends on:');
  console.log('  - Milo\'s lit-all.min.js (loaded globally in head.html)');
  console.log('\n📝 How to use:');
  console.log('  1. Lit loads once: <script src="/libs/deps/lit-all.min.js"></script>');
  console.log('  2. Import components: import "./s2/spectrum-tags.bundle.js";');
  console.log('\n💡 Following Milo\'s pattern - Lit shared by all components!');
  
} catch (error) {
  console.error('❌ Bundle failed:', error);
  process.exit(1);
}
