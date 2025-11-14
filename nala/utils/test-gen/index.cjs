#!/usr/bin/env node
const fs = require('fs');
const chalk = require('chalk');
const { parseArgs, showHelp, validateInputs } = require('./cli/cli-parser.cjs');
const { loadHtml } = require('./core/html-loader.cjs');
const { generateFromHtml, refreshFromDisk } = require('./core/test-generator.cjs');
const { deleteAction } = require('./core/test-deleter.cjs');
const { summaryLog, detectProjectMode, confirmPrompt } = require('./core/helpers.cjs');

(async () => {
  try {
    // === CLI args ===
    const argv = process.argv.slice(2);

    // === Help ===
    if (argv[0] && ['help', '--help', '-h'].includes(argv[0].toLowerCase())) {
      showHelp();
      process.exit(0);
    }

    const { input, action, blockArg, variantArg } = parseArgs(argv);
    validateInputs({ input, action });

    // === Detect batch .txt input without explicit action ===
    if (input && input.endsWith('.txt') && (!action || !['add', 'update', 'delete', 'refresh'].includes(action))) {
      if (!fs.existsSync(input)) {
        console.error(chalk.red(`❌ File not found: ${input}`));
        process.exit(1);
      }

      console.log(chalk.cyan(`📜 Detected batch input file: ${input}`));
      console.log(chalk.yellow('\n💡 Tip: To process all URLs in this file, use one of the following commands:'));
      console.log(`   ${chalk.green('npm run nala-test-gen')} ${input} ${chalk.cyan('add')}`);
      console.log(`   ${chalk.green('npm run nala-test-gen')} ${input} ${chalk.cyan('update')}`);
      console.log(`   ${chalk.green('npm run nala-test-gen')} ${input} ${chalk.cyan('delete')}`);
      console.log('');
      process.exit(0);
    }

    const { isESM, ext } = detectProjectMode();

    console.log(
      chalk.cyan('💠 Mode:'),
      input
        ? `URL-based ${action.toUpperCase()} (${input})`
        : `Local ${action.toUpperCase()} (block: ${blockArg || 'N/A'}, variant: ${variantArg || 'N/A'})`,
    );

    // === Batch file mode (.txt) ===
    if (input && input.endsWith('.txt') && ['add', 'update', 'delete'].includes(action)) {
      if (!fs.existsSync(input)) {
        console.error(chalk.red(`❌ File not found: ${input}`));
        process.exit(1);
      }

      console.log(chalk.cyan(`📜 Detected batch file: ${input}`));
      const urls = fs
        .readFileSync(input, 'utf-8')
        .split(/\r?\n/)
        .map((u) => u.trim())
        .filter(Boolean);

      if (!urls.length) {
        console.log(chalk.red('⚠️  No valid URLs found in file.'));
        process.exit(1);
      }

      console.log(chalk.gray(`Found ${urls.length} URL(s) in file.`));

      // preview first few
      const preview = urls.slice(0, 3);
      console.log(chalk.gray(`First few URLs:\n - ${preview.join('\n - ')}${urls.length > 3 ? '\n - ...' : ''}`));

      console.log(chalk.cyan(`⚡ Detected batch mode: ${action.toUpperCase()}`));
      const confirm = await confirmPrompt(`Do you want to ${action} tests for all ${urls.length} URL(s)? (y/N):`);
      if (!confirm) {
        console.log(chalk.cyan('🛑 Operation cancelled by user.'));
        process.exit(0);
      }

      const total = { added: 0, updated: 0, deleted: 0 };

      for (const url of urls) {
        console.log(chalk.yellow(`\n🌐 Processing: ${url}`));
        const start = Date.now();

        try {
          if (action === 'delete') {
            const counts = await deleteAction({ input: url, blockArg, variantArg, ext, isESM });
            total.deleted += counts.deleted;
            total.updated += counts.updated;
          } else {
            const html = await loadHtml(url);
            const counts = await generateFromHtml(html, { input: url, action, blockArg, variantArg, ext, isESM });
            total.added += counts.added;
            total.updated += counts.updated;
          }
        } catch (err) {
          console.error(chalk.red(`⚠️  Failed to process ${url}: ${err.message}`));
        }

        const dur = ((Date.now() - start) / 1000).toFixed(1);
        console.log(chalk.gray(`🕒 Completed in ${dur}s`));
      }

      summaryLog(total);
      return;
    }

    let counts = { added: 0, updated: 0, deleted: 0 };

    // === ADD / UPDATE ===
    if (['add', 'update'].includes(action)) {
      const html = await loadHtml(input);
      counts = await generateFromHtml(html, { input, action, blockArg, variantArg, ext, isESM });
    }

    // === DELETE ===
    if (action === 'delete') {
      counts = await deleteAction({ input, blockArg, variantArg, ext, isESM });
    }

    // === REFRESH ===
    if (action === 'refresh') {
      counts = await refreshFromDisk({ ext, isESM });
    }

    // === SUMMARY ===
    summaryLog(counts);
  } catch (err) {
    console.error(`\n${chalk.red.bold('❌ nala-test-gen failed')}`);
    console.error(err.stack || err);
    process.exit(1);
  }
})();
