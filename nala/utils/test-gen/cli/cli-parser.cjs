const chalk = require('chalk');

function parseArgs(args) {
  const known = ['add', 'update', 'delete', 'refresh'];
  let input = null;
  let action = 'add';
  let blockArg = null;
  let variantArg = null;

  const first = args[0]?.toLowerCase();
  if (known.includes(first)) {
    action = first;
    blockArg = args[1] || null;
    variantArg = args[2] || null;
  } else {
    input = args[0] || null;
    action = (args[1] || 'add').toLowerCase();
    blockArg = args[2] || null;
    variantArg = args[3] || null;
  }
  return { input, action, blockArg, variantArg };
}

function validateInputs({ input, action }) {
  if (!input && !['delete', 'refresh'].includes(action)) {
    console.error(`
❌ Please Use the Following Syntax:
  npm run nala-test-gen <htmlFileOrUrl> [action] [blockName] [variantName]
  OR
  npm run nala-test-gen [action] [blockName] [variantName]

Examples:
  - npm run nala-test-gen https://page.html
  - npm run nala-test-gen https://page.html add ax-columns
  - npm run nala-test-gen https://page.html update ax-columns width-2-columns
  - npm run nala-test-gen delete ax-columns width-2-columns
  - npm run nala-test-gen delete ax-columns
`);
    process.exit(1);
  }
}

function showHelp() {
  console.log(chalk.bold.blue('-----------------------------------------------------------------'));
  console.log(chalk.bold.blue('\nNala Test Generator CLI \n'));
  console.log(chalk.bold.white('Command:\n'));
  console.log(`  ${chalk.cyan('npm run nala-test-gen')} ${chalk.yellow('<htmlFileOrUrl>')} ${chalk.green('[action]')} ${chalk.magenta('[blockName]')} ${chalk.gray('[variantName]')}`);
  console.log(chalk.gray('  (default action is "add" when not specified)\n'));
  console.log(chalk.bold.white('Examples:'));
  console.log(`  ${chalk.gray('•')} ${chalk.cyan('npm run nala-test-gen')} https://page.html`);
  console.log(`  ${chalk.gray('•')} ${chalk.cyan('npm run nala-test-gen')} https://page.html ${chalk.green('add')} ${chalk.magenta('ax-columns')}`);
  console.log(`  ${chalk.gray('•')} ${chalk.cyan('npm run nala-test-gen')} https://page.html ${chalk.green('update')} ${chalk.magenta('ax-columns')} ${chalk.gray('width-2-columns')}`);
  console.log(`  ${chalk.gray('•')} ${chalk.cyan('npm run nala-test-gen')} ${chalk.green('delete')} ${chalk.magenta('ax-columns')} ${chalk.gray('width-2-columns')}`);
  console.log(`  ${chalk.gray('•')} ${chalk.cyan('npm run nala-test-gen')} ${chalk.green('delete')} ${chalk.magenta('ax-columns')}`);
  console.log(`  ${chalk.gray('•')} ${chalk.cyan('npm run nala-test-gen')} ${chalk.green('refresh')}`);
  console.log(`  ${chalk.gray('•')} ${chalk.cyan('npm run nala-test-gen')} ${chalk.green('help')}\n`);

  console.log(chalk.bold.white('Batch Run (url.txt input):'));
  console.log(chalk.gray('  You can provide a text file containing multiple URLs.'));
  console.log(chalk.gray('  Example file (urls.txt):'));
  console.log(chalk.gray('      https://page1.html'));
  console.log(chalk.gray('      https://page2.html\n'));
  console.log(chalk.bold.white('Command:\n'));
  console.log(`  ${chalk.cyan('npm run nala-test-gen')} ${chalk.yellow('<nala/assets/urls.txt>')}\n`);

  console.log(chalk.bold.white('Available Actions:'));
  console.log(`  ${chalk.green('add')}       → Parse new blocks from a given page and generate block JSON + tests.`);
  console.log(`  ${chalk.yellow('update')}    → Update existing block variants from a given page.`);
  console.log(`  ${chalk.red('delete')}    → Delete a block or specific variant from nala/blocks.`);
  console.log(`  ${chalk.blue('refresh')}   → Regenerate test/spec/page files from existing block.json files.`);
  console.log(`  ${chalk.cyan('help')}      → Show this command reference.\n`);
}

module.exports = { parseArgs, showHelp, validateInputs };
