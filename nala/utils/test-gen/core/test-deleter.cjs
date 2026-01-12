/* eslint-disable no-empty */
/* eslint-disable no-continue */
/* eslint-disable import/no-unresolved */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const chalk = require('chalk');
const { confirmPrompt } = require('./helpers.cjs');
const { regenerateFiles } = require('./test-generator.cjs');
const { loadHtml } = require('./html-loader.cjs');

async function deleteAction({ input, blockArg, variantArg, ext }) {
  let deleted = 0;
  const blocksDir = path.join(process.cwd(), 'nala', 'blocks');
  const touched = new Set();

  let blocks = [];
  if (input && (!blockArg || !variantArg)) {
    try {
      let html;
      if (fs.existsSync(input)) {
        // local HTML file
        html = fs.readFileSync(input, 'utf-8');
      } else {
        // URL
        html = await loadHtml(input);
      }
      const dom = new JSDOM(html);
      const doc = dom.window.document;
      blocks = [...doc.querySelectorAll('main div.section div[data-block-status="loaded"], div[data-block-status="loaded"]')];
    } catch {}
  } else if (!input) {
    console.log(
      chalk.cyan(
        blockArg
          ? `ℹ️  No input page URL provided — scanning local test folders for block "${blockArg}"${variantArg ? ` and variant "${variantArg}"` : ''}.`
          : 'ℹ️  No input page URL provided — scanning local test folders for available blocks.',
      ),
    );
  }

  // MODE 1: block + variant
  if (blockArg && variantArg) {
    console.log(`\n🧩 Found user input: block = ${chalk.cyan(blockArg)}, variant = ${chalk.green(variantArg)}`);
    const blockDir = path.join(blocksDir, blockArg);
    const jsonFile = path.join(blockDir, `${blockArg}.block.json`);

    if (!fs.existsSync(jsonFile)) {
      console.warn(`⚠️ Block not found: ${blockArg}`);
    } else {
      const schema = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));
      let clean = variantArg.replace(/^@/, '');
      if (clean.startsWith(`${blockArg}-`)) clean = clean.replace(`${blockArg}-`, '');

      const idx = schema.variants.findIndex((v) => v.name === `@${blockArg}-${clean}`);
      if (idx === -1) console.warn(`⚠️ Variant not found: ${clean}`);
      else {
        console.log('\n📦 Variant details:');
        console.log(`   • Block   : ${blockArg}`);
        console.log(`   • Variant : ${schema.variants[idx].name}`);
        console.log(`   • Selector: ${schema.variants[idx].selector}`);
        console.log(`   • Path    : ${schema.variants[idx].path}`);

        const confirm = await confirmPrompt('\n⚠️  Delete this variant and regenerate tests? (y/N):');
        if (!confirm) {
          console.log(chalk.cyan('🛑 Deletion aborted by user.'));
        } else {
          schema.variants.splice(idx, 1);
          schema.variants.forEach((v, i) => (v.tcid = i.toString()));
          fs.writeFileSync(jsonFile, JSON.stringify(schema, null, 2), 'utf-8');
          console.log(`🗑️ Deleted variant ${clean} from ${blockArg}.block.json`);

          if (schema.variants.length === 0) {
            const proceed = await confirmPrompt(`⚠️  No variants left. Delete entire block folder "${blockArg}"? (y/N):`);
            if (proceed) {
              fs.rmSync(blockDir, { recursive: true, force: true });
              console.log(`🧹 Deleted block folder: ${blockArg}`);
            } else {
              console.log(chalk.cyan('⚙️ Keeping block folder for future variants.'));
            }
          } else {
            touched.add(blockArg);
            console.log(`⚙️  Regenerating ${blockArg}.test.${ext} for remaining variants...`);
          }
          deleted++;
        }
      }
    }// MODE 2: block only
  } else if (blockArg && !variantArg) {
    const blockDir = path.join(blocksDir, blockArg);
    if (!fs.existsSync(blockDir)) {
      console.warn(`⚠️ Block folder not found: ${blockArg}`);
    } else {
      const confirm = await confirmPrompt(`⚠️  Delete ENTIRE block folder "${blockArg}" (all variants, tests, and specs)? (y/N):`);
      if (!confirm) {
        console.log(chalk.cyan('🛑 Block deletion aborted.'));
      } else {
        fs.rmSync(blockDir, { recursive: true, force: true });
        console.log(`🧹 Deleted entire block folder: ${blockArg}`);
        deleted++;
      }
    } // MODE 3: no block/variant — from page or local
  } else if (blocks && blocks.length) {
    const detected = {};
    for (const block of blocks) {
      const classList = [...block.classList];
      if (!classList.length) continue;
      const b = classList[0];
      const variants = classList.slice(1);
      const vname = variants.length ? variants.join('-') : 'default';
      if (!detected[b]) detected[b] = [];
      detected[b].push(vname);
    }

    console.log('\n📦 Found following blocks and variants on the page:');
    for (const [b, vars] of Object.entries(detected)) console.log(`  • ${b}: ${vars.join(', ')}`);

    const confirm = await confirmPrompt('\n⚠️  Do you want to delete ALL of these variants from nala/blocks? (y/N):');
    if (!confirm) {
      console.log(chalk.cyan('🛑 Deletion cancelled by user.'));
      return { added: 0, updated: 0, deleted };
    }

    for (const [b, vars] of Object.entries(detected)) {
      const blockDir = path.join(blocksDir, b);
      const jsonFile = path.join(blockDir, `${b}.block.json`);
      if (!fs.existsSync(jsonFile)) {
        console.warn(`⚠️ Block not found locally: ${b}`);
        continue;
      }

      const schema = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));
      const before = schema.variants.length;
      schema.variants = schema.variants.filter((v) => !vars.some((vn) => v.name === `@${b}-${vn}`));

      if (schema.variants.length < before) {
        fs.writeFileSync(jsonFile, JSON.stringify(schema, null, 2), 'utf-8');
        console.log(`🗑️ Deleted ${before - schema.variants.length} variant(s) from ${b}.block.json`);
        if (schema.variants.length === 0) {
          const proceed = await confirmPrompt(`⚠️ No variants left for "${b}". Delete entire folder? (y/N):`);
          if (proceed) {
            fs.rmSync(blockDir, { recursive: true, force: true });
            console.log(`🧹 Deleted block folder: ${b}`);
          } else {
            console.log(chalk.cyan(`⚙️ Keeping ${b} folder for now.`));
          }
        } else {
          touched.add(b);
        }
        deleted++;
      } else {
        console.warn(`⚠️ No matching variants found in ${b}.block.json`);
      }
    }
  } else {
    console.log('⚠️ No blocks found for deletion.');
  }

  for (const b of touched) regenerateFiles(b, { ext });
  return { added: 0, updated: touched.size, deleted };
}

module.exports = { deleteAction };
