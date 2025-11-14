/* eslint-disable no-continue */
/* eslint-disable no-unused-vars */
/* eslint-disable import/no-unresolved */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { parseBlock } = require('./semantic-parser.cjs');
const { ensureSeoCheckLib, ensureAccessibilityLib } = require('./deps.cjs');
const { normalizePath, makeBlockClassName } = require('./helpers.cjs');
const config = require('../config/config.cjs');

function loadBlocksFromHtml(html) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const blocks = [...doc.querySelectorAll(config.selectors.blockLocator)];
  return blocks;
}

function readSchema(jsonFile, blockName) {
  return fs.existsSync(jsonFile)
    ? JSON.parse(fs.readFileSync(jsonFile, 'utf-8'))
    : { block: blockName, variants: [] };
}

function writeSchema(jsonFile, schema) {
  fs.mkdirSync(path.dirname(jsonFile), { recursive: true });
  fs.writeFileSync(jsonFile, JSON.stringify(schema, null, 2), 'utf-8');
}

// Generate Page Object
function generatePageObject({ blockDir, blockName, className, ext }) {
  const pageFile = path.join(blockDir, `${blockName}.page.${ext}`);
  if (!fs.existsSync(pageFile)) {
    const pageCode = `class ${className} {
  constructor(page, selector = '.${blockName}', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = ${className};`;
    fs.writeFileSync(pageFile, `${pageCode}\n`, 'utf-8');
  }
}

// Generate Spec File
function generateSpec({ blockDir, blockName, ext }) {
  const specFile = path.join(blockDir, `${blockName}.spec.${ext}`);
  if (!fs.existsSync(specFile)) {
    const specCode = `const schema = require('./${blockName}.block.json');

module.exports = { features: schema.variants };`;
    fs.writeFileSync(specFile, `${specCode}\n`, 'utf-8');
  }
}

// Generate Test File with Nala Test Template
function generateTest({ blockDir, blockName, className, schema, ext }) {
  const testFile = path.join(blockDir, `${blockName}.test.${ext}`);
  const variantsCode = schema.variants
    .map(
      (v, i) => `
  // Test Id : ${v.tcid} : ${v.name}
  test(\`[Test Id - \${features[${i}].tcid}] \${features[${i}].name} \${features[${i}].tags}\`, async ({ page, baseURL }) => {
    const { data } = features[${i}];
    const testUrl = \`\${baseURL}\${features[${i}].path}\`;
    const block = new ${className}(page, features[${i}].selector);
    console.info(\`[Test Page]: \${testUrl}\`);

    await test.step('step-1: Navigate to page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testUrl);
    });

    await test.step('step-2: Verify block content', async () => {
      await expect(block.block).toBeVisible();
      const sem = data.semantic;

      for (const t of sem.texts) {
        const locator = block.block.locator(t.selector).nth(t.nth || 0);
        await expect(locator).toContainText(t.text);
      }

      for (const m of sem.media) {
        const locator = block.block.locator(m.selector).nth(m.nth || 0);
        const isHiddenSelector = m.selector.includes('.isHidden');
        const isPicture = m.tag === 'picture';
        const target = isPicture ? locator.locator('img') : locator;
        if (isHiddenSelector) {
          await expect(target).toBeHidden();
        } else {
          await expect(target).toBeVisible();
        }
      }

      for (const iEl of sem.interactives) {
        const locator = block.block.locator(iEl.selector).nth(iEl.nth || 0);
        await expect(locator).toBeVisible({ timeout: 8000 });
        if (iEl.type === 'link' && iEl.href) {
          const href = await locator.getAttribute('href');
          if (/^(tel:|mailto:|sms:|ftp:|[+]?[\\d])/i.test(iEl.href)) {
            await expect(href).toBe(iEl.href);
          } else {
            const expectedPath = new URL(iEl.href, 'https://dummy.base').pathname;
            const actualPath = new URL(href, 'https://dummy.base').pathname;
            await expect(actualPath).toBe(expectedPath);
          }
        }
        if (iEl.text) await expect(locator).toContainText(iEl.text);
      }
    });

    await test.step('step-3: Accessibility validation', async () => {
      await runAccessibilityTest({ page, testScope: block.block, skipA11yTest: false });
    });

    await test.step('step-4: SEO validation', async () => {
      await runSeoChecks({ page, feature: features[${i}], skipSeoTest: false });
    });
  });`,
    )
    .join('\n');

  const testCode = `const { test, expect } = require('@playwright/test');
const { features } = require('./${blockName}.spec.${ext}');
const ${className} = require('./${blockName}.page.${ext}');
const { runAccessibilityTest } = require('../../libs/accessibility.${ext}');
const { runSeoChecks } = require('../../libs/seo-check.${ext}');

test.describe('${className} Test Suite', () => {${variantsCode}
});`;

  fs.writeFileSync(testFile, `${testCode.trimEnd()}\n`, 'utf-8');
}

// Regenerate all files for a block
function regenerateFiles(blockName, { ext }) {
  const blockDir = path.join(config.project.blocksDir, blockName);
  const jsonFile = path.join(blockDir, `${blockName}.block.json`);
  const schema = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));
  const className = makeBlockClassName(blockName);

  generatePageObject({ blockDir, blockName, className, ext });
  generateSpec({ blockDir, blockName, ext });
  generateTest({ blockDir, blockName, className, schema, ext });
}

// Main Generation Function
async function generateFromHtml(html, { input, action, blockArg, variantArg, ext, isESM }) {
  ensureSeoCheckLib(ext, isESM);
  ensureAccessibilityLib(ext, isESM);

  const blocks = loadBlocksFromHtml(html);
  console.log(`🔍 Found ${blocks.length} loaded block(s) in the HTML.`);

  let added = 0;
  let updated = 0;

  const touched = new Set();

  for (const [idx, block] of blocks.entries()) {
    const classList = [...block.classList];
    console.log(`\n🧩 Processing Block #${idx + 1}: ${classList.join(' ')}`);
    if (!classList.length) continue;

    const blockName = classList[0];
    const variants = classList.slice(1);
    const variantName = variants.length ? variants.join('-') : 'default';
    if (blockArg && blockArg !== blockName) continue;
    if (variantArg && variantArg !== variantName) continue;

    const blockDir = path.join(config.project.blocksDir, blockName);

    fs.mkdirSync(blockDir, { recursive: true });
    const jsonFile = path.join(blockDir, `${blockName}.block.json`);
    const schema = readSchema(jsonFile, blockName);

    const newVariant = parseBlock(block, blockName, variants, variantName, schema.variants.length, input, normalizePath);
    const existingIndex = schema.variants.findIndex((v) => v.name === newVariant.name);
    console.log(`     › ${existingIndex >= 0 ? 'Updating existing variant' : 'Adding new variant'}`);

    if (existingIndex >= 0) {
      schema.variants[existingIndex] = newVariant;
      updated++;
    } else {
      schema.variants.push(newVariant);
      added++;
    }

    schema.variants.forEach((v, i) => {
      v.tcid = i.toString();
    });

    writeSchema(jsonFile, schema);
    touched.add(blockName);
  }

  for (const b of touched) {
    console.log(`⚙️  Regenerating tests for ${b}...`);
    regenerateFiles(b, { ext });
  }

  return { added, updated, deleted: 0 };
}

async function refreshFromDisk({ ext, isESM }) {
  ensureSeoCheckLib(ext, isESM);
  ensureAccessibilityLib(ext, isESM);

  const { blocksDir } = config.project;

  if (!fs.existsSync(blocksDir)) return { added: 0, updated: 0, deleted: 0 };

  const names = fs.readdirSync(blocksDir).filter((f) => fs.existsSync(path.join(blocksDir, f, `${f}.block.json`)));
  for (const b of names) {
    console.log(`⚙️  Refreshing files for ${b}...`);
    regenerateFiles(b, { ext });
  }
  return { added: 0, updated: names.length, deleted: 0 };
}

module.exports = { generateFromHtml, refreshFromDisk, regenerateFiles };
