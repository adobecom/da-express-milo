/**
 * Node runner for guard-dev-blocks tests (script uses fs, so cannot run in browser wtr).
 * Run: node test/scripts/guard-dev-blocks.run.js
 * MWPW-187637
 */

import { runGuard } from '../../scripts/guard-dev-blocks.js';
import { mkdtemp, writeFile, rm, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

async function main() {
  let passed = 0;
  let failed = 0;

  try {
    const { success, violations } = await runGuard();
    if (success && violations.length === 0) {
      console.log('✓ passes when production blocks and shared do not import from dev/');
      passed += 1;
    } else {
      console.error('✗ expected no violations in repo', violations);
      failed += 1;
    }
  } catch (e) {
    console.error('✗ runGuard() threw', e);
    failed += 1;
  }

  let root = null;
  try {
    root = await mkdtemp(join(tmpdir(), 'guard-dev-blocks-'));
    const blocksFakeDir = join(root, 'express', 'code', 'blocks', 'some-prod-block');
    await mkdir(blocksFakeDir, { recursive: true });
    await writeFile(join(blocksFakeDir, 'some-prod-block.js'), `
      import something from '../../dev-palettes/dev-palettes.js';
      export default function decorate() {}
    `);
    const { success, violations } = await runGuard(root);
    if (!success && violations.length >= 1 && violations.some((v) => v.scope === 'blocks')) {
      console.log('✓ fails when a production block imports from dev-* (same blocks folder)');
      passed += 1;
    } else {
      console.error('✗ expected failure for blocks importing dev', { success, violations });
      failed += 1;
    }
  } catch (e) {
    console.error('✗ test 2 threw', e);
    failed += 1;
  } finally {
    if (root) await rm(root, { recursive: true, force: true });
  }

  root = null;
  try {
    root = await mkdtemp(join(tmpdir(), 'guard-dev-blocks-req-'));
    const blocksDir = join(root, 'express', 'code', 'blocks');
    await mkdir(blocksDir, { recursive: true });
    await writeFile(join(blocksDir, 'bad.js'), `const x = require("./dev-palettes/dev-palettes.js");`);
    const { success, violations } = await runGuard(root);
    if (!success && violations.length >= 1) {
      console.log('✓ fails when a file uses require(...dev-*)');
      passed += 1;
    } else {
      console.error('✗ expected failure for require(dev)', { success, violations });
      failed += 1;
    }
  } catch (e) {
    console.error('✗ test 3 threw', e);
    failed += 1;
  } finally {
    if (root) await rm(root, { recursive: true, force: true });
  }

  root = null;
  try {
    root = await mkdtemp(join(tmpdir(), 'guard-dev-blocks-dev-palettes-'));
    const blocksDir = join(root, 'express', 'code', 'blocks');
    await mkdir(blocksDir, { recursive: true });
    await writeFile(join(blocksDir, 'some-block.js'), `import x from "./dev-palettes/dev-palettes.js";`);
    const { success, violations } = await runGuard(root);
    if (!success && violations.length >= 1) {
      console.log('✓ fails when a block imports from dev-*');
      passed += 1;
    } else {
      console.error('✗ expected failure for import from dev-*', { success, violations });
      failed += 1;
    }
  } catch (e) {
    console.error('✗ test 4 threw', e);
    failed += 1;
  } finally {
    if (root) await rm(root, { recursive: true, force: true });
  }

  root = null;
  try {
    root = await mkdtemp(join(tmpdir(), 'guard-dev-blocks-shared-'));
    const sharedDir = join(root, 'express', 'code', 'shared');
    await mkdir(sharedDir, { recursive: true });
    await writeFile(join(sharedDir, 'utils.js'), `import x from '../blocks/dev-palettes/dev-palettes.js';`);
    const { success, violations } = await runGuard(root);
    if (!success && violations.length >= 1 && violations.some((v) => v.scope === 'shared')) {
      console.log('✓ fails when shared imports from dev-* (wrong path)');
      passed += 1;
    } else {
      console.error('✗ expected failure for shared importing dev', { success, violations });
      failed += 1;
    }
  } catch (e) {
    console.error('✗ test 5 threw', e);
    failed += 1;
  } finally {
    if (root) await rm(root, { recursive: true, force: true });
  }

  console.log('');
  if (failed > 0) {
    console.error(`Guard tests: ${passed} passed, ${failed} failed`);
    process.exit(1);
  }
  console.log(`Guard tests: ${passed} passed`);
  process.exit(0);
}

main();
