/**
 * Bundle Spectrum Web Components Tags into a single file
 * Run once: node build-bundle.mjs
 * Output: spectrum-tags.bundle.js (single file with both components)
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
    // Mark Lit as external so it's loaded from CDN
    external: [
      'lit',
      'lit/*',
      '@lit/*',
      '@lit/reactive-element',
      '@lit/reactive-element/*'
    ],
    minify: false, // Keep readable for debugging
    sourcemap: false, // Set to true if you need debugging support
    target: 'es2020',
    logLevel: 'info',
  });

  console.log('\n✅ Bundle created successfully!');
  console.log('\nCreated file:');
  console.log('  - spectrum-tags.bundle.js (SINGLE FILE - both sp-tag and sp-tags)');
  console.log('\n📝 Next steps:');
  console.log('  1. Import Lit from CDN in your HTML:');
  console.log('     <script type="importmap">');
  console.log('       { "imports": { "lit": "https://cdn.jsdelivr.net/npm/lit@3/+esm" } }');
  console.log('     </script>');
  console.log('  2. Import the bundled file:');
  console.log('     import "./s2/spectrum-tags.bundle.js";');
  console.log('\n💡 This single file includes both <sp-tags> and <sp-tag> components');
  
} catch (error) {
  console.error('❌ Bundle failed:', error);
  process.exit(1);
}
