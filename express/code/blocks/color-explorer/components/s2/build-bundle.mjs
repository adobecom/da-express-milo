/**
 * Bundle Spectrum Web Components Tags into a single file
 * Run once: node build-bundle.mjs
 * Output: sp-tags-bundle.js (single file, no external dependencies except Lit from CDN)
 */

import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('🎯 Bundling Spectrum Tags...\n');

try {
  // Bundle with Lit as external (load from CDN)
  // Use absolute paths from project root
  const cwd = process.cwd();
  await esbuild.build({
    entryPoints: [
      join(cwd, 'node_modules/@spectrum-web-components/tags/sp-tags.js'),
      join(cwd, 'node_modules/@spectrum-web-components/tags/sp-tag.js'),
    ],
    bundle: true,
    format: 'esm',
    outdir: __dirname,
    outExtension: { '.js': '.bundle.js' },
    // Mark Lit as external so it's loaded from CDN
    external: [
      'lit',
      'lit/*',
      '@lit/*',
      '@lit/reactive-element',
      '@lit/reactive-element/*'
    ],
    minify: false, // Keep readable for debugging
    sourcemap: true,
    target: 'es2020',
    logLevel: 'info',
  });

  console.log('\n✅ Bundle created successfully!');
  console.log('\nCreated files:');
  console.log('  - sp-tags.bundle.js');
  console.log('  - sp-tag.bundle.js');
  console.log('  - Source maps (.map files)');
  console.log('\n📝 Next steps:');
  console.log('  1. Import Lit from CDN in your HTML:');
  console.log('     <script type="importmap">');
  console.log('       { "imports": { "lit": "https://cdn.jsdelivr.net/npm/lit@3/+esm" } }');
  console.log('     </script>');
  console.log('  2. Import the bundled files:');
  console.log('     import "./s2/sp-tags.bundle.js";');
  console.log('     import "./s2/sp-tag.bundle.js";');
  
} catch (error) {
  console.error('❌ Bundle failed:', error);
  process.exit(1);
}
