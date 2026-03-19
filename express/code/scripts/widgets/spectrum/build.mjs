#!/usr/bin/env node
/**
 * Spectrum Web Components Bundler
 *
 * Generates per-component ESM bundles for components not in the original
 * pre-built dist/ set.
 *
 * IMPORTANT: The original dist/ bundles (lit, base, theme, shared,
 * reactive-controllers, icons-ui, overlay, popover, menu,
 * picker) were built externally with a specific bundler configuration.
 * Do NOT regenerate them with this script — they will break.
 *
 * This script only builds NEW component bundles (button, tooltip, dialog,
 * toast, tags, textfield, search).  Each new bundle externalizes only
 * the original dist/ files to share the same runtime instances.
 *
 * Usage:
 *   node express/code/scripts/widgets/spectrum/build.mjs
 */
import { build } from 'esbuild';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '../../../../..');
const distDir = resolve(__dirname, 'dist');

/* ------------------------------------------------------------------ */
/*  External mappings                                                   */
/*                                                                      */
/*  These map SWC / Lit imports to the ORIGINAL pre-built dist/ files.  */
/*  The original bundles were built with their own internal bundler and */
/*  have a self-consistent export surface.  New bundles reference them. */
/*                                                                      */
/*  IMPORTANT: The original lit.js exports most of Lit but NOT these    */
/*  directives: live, repeat, until, when, join, unsafeHTML, createRef, */
/*  ref.  The Lit external mapping therefore only catches the main      */
/*  `lit` import and specific sub-paths that ARE in the original        */
/*  lit.js.  Unmatched lit/directives/* imports are bundled inline.     */
/* ------------------------------------------------------------------ */

// Lit sub-paths that the original lit.js DOES export
const LIT_EXTERNALS = [
  { match: /^lit$/, target: './lit.js' },
  { match: /^lit\/decorators\.js$/, target: './lit.js' },
  { match: /^lit\/decorators$/, target: './lit.js' },
  { match: /^lit\/directive\.js$/, target: './lit.js' },
  { match: /^lit\/directive$/, target: './lit.js' },
  { match: /^lit\/async-directive\.js$/, target: './lit.js' },
  { match: /^lit\/async-directive$/, target: './lit.js' },
  { match: /^lit\/directives\/if-defined\.js$/, target: './lit.js' },
  { match: /^lit\/directives\/class-map\.js$/, target: './lit.js' },
  { match: /^lit\/directives\/style-map\.js$/, target: './lit.js' },
  // These are NOT in original lit.js and must be bundled inline:
  // lit/directives/live.js, repeat.js, until.js, when.js, join.js,
  // unsafe-html.js, ref.js
  { match: /^@lit\/reactive-element(\/.*)?$/, target: './lit.js' },
  { match: /^@lit-labs\/(.+)?$/, target: './lit.js' },
];

const ORIGINAL_EXTERNALS = [
  ...LIT_EXTERNALS,

  // SWC shared infrastructure → original dist/ files
  // base.js does `export * from "./lit.js"` so it re-exports everything lit.js has.
  // We must NOT catch base/src/directives.js because it re-exports Lit directives
  // (live, repeat, etc.) that are missing from the original lit.js/base.js chain.
  // Letting esbuild resolve directives.js from node_modules allows each individual
  // lit directive import to hit the selective Lit mappings above.
  { match: /^@spectrum-web-components\/base\/src\/directives(\.js)?$/, target: null },
  { match: /^@spectrum-web-components\/base(\/.*)?$/, target: './base.js' },
  { match: /^@spectrum-web-components\/theme(\/.*)?$/, target: './theme.js' },
  { match: /^@spectrum-web-components\/shared(\/.*)?$/, target: './shared.js' },
  { match: /^@spectrum-web-components\/reactive-controllers(\/.*)?$/, target: './reactive-controllers.js' },
  { match: /^@spectrum-web-components\/icons-ui(\/.*)?$/, target: './icons-ui.js' },
  { match: /^@spectrum-web-components\/icons-workflow(\/.*)?$/, target: './icons-workflow.js' },

  // SWC overlay stack → original dist/ files
  { match: /^@spectrum-web-components\/overlay(\/.*)?$/, target: './overlay.js' },
  { match: /^@spectrum-web-components\/popover(\/.*)?$/, target: './popover.js' },
  { match: /^@spectrum-web-components\/menu(\/.*)?$/, target: './menu.js' },
  { match: /^@spectrum-web-components\/picker(\/.*)?$/, target: './picker.js' },
];

/**
 * Creates an esbuild plugin that externalises deps, with the ability to
 * skip specific mappings (by target path) so a bundle doesn't reference
 * itself or another new bundle it needs to inline.
 */
function createExternalPlugin(skipTargets = []) {
  const skipSet = new Set(skipTargets);
  return {
    name: 'spectrum-external',
    setup(b) {
      b.onResolve(
        { filter: /^(@spectrum-web-components\/|lit|@lit\/)/ },
        (args) => {
          for (const { match, target } of ORIGINAL_EXTERNALS) {
            if (skipSet.has(target)) continue;
            if (match.test(args.path)) {
              return { path: target, external: true };
            }
          }
          // Not in the map → let esbuild bundle it into the component file
          return undefined;
        },
      );
    },
  };
}

/* ------------------------------------------------------------------ */
/*  New component definitions                                           */
/*                                                                      */
/*  Each entry uses `sp-*.js` side-effect files that call               */
/*  defineElement() to register custom elements.                        */
/*                                                                      */
/*  extraExternals: additional dependencies to externalize (beyond      */
/*    ORIGINAL_EXTERNALS), e.g., referencing other new component bundles*/
/*  skipExternals: targets to NOT externalize (so their code gets       */
/*    bundled directly into this component file), e.g., when original   */
/*    dist/ bundles are missing required exports                        */
/* ------------------------------------------------------------------ */
const newComponents = [
  {
    name: 'button',
    entry: [
      "import '@spectrum-web-components/button/sp-button.js';",
      "import '@spectrum-web-components/button/sp-clear-button.js';",
      "import '@spectrum-web-components/button/sp-close-button.js';",
      "export * from '@spectrum-web-components/button';",
    ].join('\n'),
  },
  {
    name: 'tooltip',
    entry: [
      "import '@spectrum-web-components/tooltip/sp-tooltip.js';",
      "export * from '@spectrum-web-components/tooltip';",
    ].join('\n'),
  },
  {
    name: 'dialog',
    entry: [
      "import '@spectrum-web-components/dialog/sp-dialog.js';",
      "import '@spectrum-web-components/dialog/sp-dialog-wrapper.js';",
      "export * from '@spectrum-web-components/dialog';",
    ].join('\n'),
  },
  {
    name: 'toast',
    entry: [
      "import '@spectrum-web-components/toast/sp-toast.js';",
      "export * from '@spectrum-web-components/toast';",
    ].join('\n'),
  },
  {
    name: 'tags',
    entry: [
      "import '@spectrum-web-components/tags/sp-tag.js';",
      "import '@spectrum-web-components/tags/sp-tags.js';",
      "export * from '@spectrum-web-components/tags';",
    ].join('\n'),
  },
  {
    name: 'textfield',
    entry: [
      "import '@spectrum-web-components/textfield/sp-textfield.js';",
      "export * from '@spectrum-web-components/textfield';",
    ].join('\n'),
  },
  {
    name: 'search',
    // Search extends Textfield — textfield is externalized to ./textfield.js
    // so they share the same Textfield class instance at runtime.
    entry: [
      "import '@spectrum-web-components/search/sp-search.js';",
      "export * from '@spectrum-web-components/search';",
    ].join('\n'),
    // Extra externals: textfield bundle (new, not original)
    extraExternals: [
      { match: /^@spectrum-web-components\/textfield(\/.*)?$/, target: './textfield.js' },
    ],
  },
  {
    name: 'icons-workflow',
    entry: [
      "import '@spectrum-web-components/icons-workflow/icons/sp-icon-alert.js';",
      "import '@spectrum-web-components/icons-workflow/icons/sp-icon-alert-triangle.js';",
      "import '@spectrum-web-components/icons-workflow/icons/sp-icon-circle.js';",
      "import '@spectrum-web-components/icons-workflow/icons/sp-icon-copy.js';",
      "import '@spectrum-web-components/icons-workflow/icons/sp-icon-delete.js';",
      "import '@spectrum-web-components/icons-workflow/icons/sp-icon-edit.js';",
      "import '@spectrum-web-components/icons-workflow/icons/sp-icon-share-android.js';",
      "import '@spectrum-web-components/icons-workflow/icons/sp-icon-target.js';",
      "import '@spectrum-web-components/icons-workflow/icons/sp-icon-download.js';",
      "import '@spectrum-web-components/icons-workflow/icons/sp-icon-cclibrary.js';",
      "import '@spectrum-web-components/icons-workflow/icons/sp-icon-chevron-down.js';",
      "import '@spectrum-web-components/icons-workflow/icons/sp-icon-chevron-left.js';",
      "import '@spectrum-web-components/icons-workflow/icons/sp-icon-add.js';",
      "import '@spectrum-web-components/icons-workflow/icons/sp-icon-close.js';",
      "import '@spectrum-web-components/icons-workflow/icons/sp-icon-checkmark-circle.js';",
    ].join('\n'),
  },
  {
    name: 'swatch',
    entry: [
      "import '@spectrum-web-components/swatch/sp-swatch.js';",
      "import '@spectrum-web-components/swatch/sp-swatch-group.js';",
      "export * from '@spectrum-web-components/swatch';",
    ].join('\n'),
  },
  {
    name: 'color-area',
    entry: [
      "import '@spectrum-web-components/color-area/sp-color-area.js';",
      "export * from '@spectrum-web-components/color-area';",
    ].join('\n'),
    // Skip externalizing reactive-controllers so ColorController and
    // LanguageResolutionController get bundled directly into this file
    skipExternals: ['./reactive-controllers.js'],
  },
  {
    name: 'color-slider',
    entry: [
      "import '@spectrum-web-components/color-slider/sp-color-slider.js';",
      "export * from '@spectrum-web-components/color-slider';",
    ].join('\n'),
    // Skip externalizing reactive-controllers so ColorController and
    // LanguageResolutionController get bundled directly into this file
    skipExternals: ['./reactive-controllers.js'],
  },
  {
    name: 'slider',
    entry: [
      "import '@spectrum-web-components/slider/sp-slider.js';",
      "export * from '@spectrum-web-components/slider';",
    ].join('\n'),
    skipExternals: ['./reactive-controllers.js'],
  },
  {
    name: 'tray',
    entry: [
      "import '@spectrum-web-components/tray/sp-tray.js';",
      "export * from '@spectrum-web-components/tray';",
    ].join('\n'),
    skipExternals: ['./reactive-controllers.js'],
  },
  {
    name: 'badge',
    entry: [
      "import '@spectrum-web-components/badge/sp-badge.js';",
      "export * from '@spectrum-web-components/badge';",
    ].join('\n'),
  },
];

/* ------------------------------------------------------------------ */
/*  Build                                                              */
/* ------------------------------------------------------------------ */
const BANNER = '/* eslint-disable */\n/* Generated by da-express-milo Spectrum Web Components bundler */\n';

console.log('Building Spectrum Web Components bundles (new components only)...\n');

let success = 0;
let failed = 0;

for (const comp of newComponents) {
  // Each new component skips its own target from externals.
  // skipExternalTargets allows skipping additional original bundles.
  const selfTarget = `./${comp.name}.js`;
  const skipSet = new Set([selfTarget, ...(comp.skipExternals || [])]);

  // Create plugin with original externals + any extra externals
  const allExternals = [...ORIGINAL_EXTERNALS, ...(comp.extraExternals || [])];

  const plugin = {
    name: 'spectrum-external',
    setup(b) {
      b.onResolve(
        { filter: /^(@spectrum-web-components\/|lit|@lit\/)/ },
        (args) => {
          for (const { match, target } of allExternals) {
            if (!match.test(args.path)) continue;
            // target === null means "explicitly do NOT externalize, let esbuild resolve"
            if (target === null) return undefined;
            // Don't externalize self or explicitly skipped targets
            if (skipSet.has(target)) continue;
            return { path: target, external: true };
          }
          return undefined;
        },
      );
    },
  };

  try {
    await build({
      stdin: {
        contents: comp.entry,
        resolveDir: projectRoot,
      },
      bundle: true,
      format: 'esm',
      outfile: resolve(distDir, `${comp.name}.js`),
      minify: true,
      plugins: [plugin],
      banner: { js: BANNER },
      legalComments: 'none',
    });
    console.log(`  ✓ dist/${comp.name}.js`);
    success++;
  } catch (err) {
    console.error(`  ✗ dist/${comp.name}.js — ${err.message}`);
    failed++;
  }
}

console.log(`\nDone. ${success} built, ${failed} failed.`);
if (failed > 0) process.exit(1);
