/* eslint-disable no-empty */
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const chalk = require('chalk');

function detectProjectMode() {
  let isESM = false;
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8'));
    isESM = pkg.type === 'module';
  } catch {}
  const ext = isESM ? 'cjs' : 'js';
  return { isESM, ext };
}

function normalizePath(input, blockName, variantName) {
  if (input && input.startsWith && input.startsWith('http')) {
    try { return new URL(input).pathname; } catch {}
  }
  return `/drafts/nala/blocks/${blockName}/${variantName}`;
}

function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

function makeBlockClassName(blockName) {
  return `${blockName.split(/[-_]/).map((s) => capitalize(s)).join('')}Block`;
}

function confirmPrompt(message) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`${chalk.yellow(message)} `, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y');
    });
  });
}

function readJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function getTimestamp() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}_${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
}

function summaryLog({ added = 0, updated = 0, deleted = 0 } = {}) {
  console.log(`\n${chalk.green.bold('✅ Nala Test Generation Complete!')}`);
  console.log(`${chalk.cyan('📦 Summary:')}`);
  console.log(`  • ${chalk.green('Added')}   : ${added}`);
  console.log(`  • ${chalk.yellow('Updated')} : ${updated}`);
  console.log(`  • ${chalk.red('Deleted')} : ${deleted}`);
  console.log(`${chalk.cyan('📁 Output:')} nala/blocks\n`);
}

module.exports = {
  detectProjectMode,
  normalizePath,
  makeBlockClassName,
  confirmPrompt,
  readJSON,
  writeJSON,
  getTimestamp,
  summaryLog,
};
