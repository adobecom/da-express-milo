#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);

// Check if --fix flag is provided
const shouldAutoFix = process.argv.includes('--fix');

// Normalize color values for comparison
function normalizeColor(color) {
  // Remove whitespace
  let normalized = color.trim();

  // Handle shorthand hex (#fff -> #ffffff)
  if (/^#[0-9a-fA-F]{3}$/.test(normalized)) {
    normalized = normalized.replace(/^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/, '#$1$1$2$2$3$3');
  }

  // Convert to lowercase for consistency
  return normalized.toLowerCase();
}

// Color name to hex mapping
const colorNameToHex = {
  black: '#000',
  white: '#fff',
  transparent: 'transparent',
  inherit: 'inherit',
  initial: 'initial',
  unset: 'unset',
};

// Color keywords that are allowed and should not trigger violations
const allowedColorKeywords = [
  'transparent',
  'inherit',
  'initial',
  'unset',
  'currentColor',
  'none',
];

// Helper function to determine which variable name is more semantically correct
function shouldPreferVariable(newVarName, existingVar) {
  const existingVarName = existingVar.replace('var(--color-', '').replace(')', '');

  // Prefer simple color names over complex ones
  const simpleColors = ['black', 'white', 'red', 'green', 'blue', 'yellow', 'gray', 'grey'];

  const newIsSimple = simpleColors.includes(newVarName);
  const existingIsSimple = simpleColors.includes(existingVarName);

  if (newIsSimple && !existingIsSimple) {
    return true;
  }

  if (!newIsSimple && existingIsSimple) {
    return false;
  }

  // If both are simple or both are complex, prefer the shorter name
  return newVarName.length < existingVarName.length;
}

// Read the root CSS variables
function getRootVariables() {
  const stylesPath = path.join(currentDir, '../express/code/styles/styles.css');
  const stylesContent = fs.readFileSync(stylesPath, 'utf8');

  const colorVars = {};
  const spacingVars = {};

  // Extract color variables - look specifically in the :root block
  const rootBlockMatch = stylesContent.match(/:root\s*\{([\s\S]*?)\}/);

  if (rootBlockMatch) {
    const rootContent = rootBlockMatch[1];

    // Extract color variables from the :root block - be more specific
    const lines = rootContent.split('\n');

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      // Only match lines that start with --color- and contain a color value
      const colorMatch = trimmedLine.match(/^--color-([^:]+):\s*([^;]+);/);

      if (colorMatch) {
        const varName = colorMatch[1];
        const value = colorMatch[2].trim();

        // Only process if this looks like a valid color value
        if (/^#[0-9a-fA-F]{3,6}$|^rgb\(|^rgba\(|^hsl\(|^hsla\(|^[a-zA-Z]+$/.test(value)) {
          const normalizedValue = normalizeColor(value);

          // Prioritize more semantically correct variable names
          const existingVar = colorVars[normalizedValue];
          if (!existingVar || shouldPreferVariable(varName, existingVar)) {
            colorVars[normalizedValue] = `var(--color-${varName})`;
          }
        }
      }
    });

    // Extract spacing variables from the :root block
    lines.forEach((line) => {
      const trimmedLine = line.trim();
      const spacingMatch = trimmedLine.match(/^--spacing-([^:]+):\s*([^;]+);/);

      if (spacingMatch) {
        const varName = spacingMatch[1];
        const value = spacingMatch[2].trim();
        spacingVars[value] = `var(--spacing-${varName})`;
      }
    });
  }

  return { colorVars, spacingVars };
}

// Check a CSS file for hardcoded colors and spacing
function checkFile(filePath, colorVars, spacingVars) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];

  // Find all color values in various properties (including shorthand)
  const colorRegex = /(?:color|background-color|border-color|fill|stroke|background|border):\s*([^;]+);/g;
  let match = colorRegex.exec(content);

  while (match !== null) {
    const fullValue = match[1].trim();
    const matchIndex = match.index;

    // Extract color values from the property value
    // This handles cases like "background: #ffffff url(image.png) no-repeat;"
    const colorMatches = fullValue.match(/#[0-9a-fA-F]{3,6}|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\)|black|white|transparent|inherit|initial|unset/g);

    if (colorMatches) {
      // Filter out matches that are inside var() calls
      const validColorMatches = colorMatches.filter((colorMatch) => {
        const colorMatchIndex = fullValue.indexOf(colorMatch);
        const beforeColorMatch = fullValue.substring(0, colorMatchIndex);
        const lastVarIndex = beforeColorMatch.lastIndexOf('var(');
        const lastCloseParenIndex = beforeColorMatch.lastIndexOf(')');

        // If there's a var( before this match and no closing ) before it, skip it
        if (lastVarIndex > lastCloseParenIndex) {
          return false;
        }

        return true;
      });

      validColorMatches.forEach((colorValue) => {
        // Skip if the value is already a CSS variable or contains var()
        if (colorValue.includes('var(')) {
          return;
        }

        // Skip allowed color keywords that don't need to be replaced with variables
        if (allowedColorKeywords.includes(colorValue.toLowerCase())) {
          return;
        }

        // Convert color names to hex values if they exist in our mapping
        const hexValue = colorNameToHex[colorValue.toLowerCase()] || colorValue;
        const normalizedColor = normalizeColor(hexValue);

        // Check if this color has a corresponding variable
        if (colorVars[normalizedColor]) {
          const lineNumber = content.substring(0, matchIndex).split('\n').length;
          const fullRule = content.substring(matchIndex, content.indexOf(';', matchIndex) + 1).trim();

          // Find the selector by looking backwards for the opening brace
          const beforeMatch = content.substring(0, matchIndex);
          const lastBraceIndex = beforeMatch.lastIndexOf('{');
          const selectorStart = beforeMatch.lastIndexOf('}', lastBraceIndex) + 1;
          const selector = content.substring(selectorStart, lastBraceIndex).trim();

          issues.push({
            file: filePath,
            line: lineNumber,
            value: colorValue,
            suggestion: colorVars[normalizedColor],
            type: 'color',
            fullRule: `${selector} { ${fullRule} }`,
          });
        }
      });
    }

    match = colorRegex.exec(content);
  }

  // Find spacing values
  const spacingRegex = /(margin(?:-top|-right|-bottom|-left|-inline-start|-inline-end)?|padding(?:-top|-right|-bottom|-left|-inline-start|-inline-end)?|gap|top|right|bottom|left|width|height|min-width|max-width|min-height|max-height):\s*([^;]+);/g;
  match = spacingRegex.exec(content);

  while (match !== null) {
    const fullValue = match[2].trim();
    const matchIndex = match.index;

    // Extract spacing values (numbers with units)
    const spacingMatches = fullValue.match(/\d+px|\d+rem|\d+em|\d+%|\d+vw|\d+vh/g);

    if (spacingMatches) {
      const replacements = [];

      spacingMatches.forEach((spacingValue) => {
        // Check if this spacing has a corresponding variable
        if (spacingVars[spacingValue]) {
          replacements.push({
            from: spacingValue,
            to: spacingVars[spacingValue],
          });
        }
      });

      if (replacements.length > 0) {
        // Calculate line number based on the position of the semicolon
        const semicolonIndex = content.indexOf(';', matchIndex);
        const lineNumber = content.substring(0, semicolonIndex).split('\n').length;
        const fullRule = content.substring(matchIndex, semicolonIndex + 1).trim();

        // Find the selector by looking backwards for the opening brace
        const beforeMatch = content.substring(0, matchIndex);
        const lastBraceIndex = beforeMatch.lastIndexOf('{');
        const selectorStart = beforeMatch.lastIndexOf('}', lastBraceIndex) + 1;
        const selector = content.substring(selectorStart, lastBraceIndex).trim();

        issues.push({
          file: filePath,
          line: lineNumber,
          fullRule: `${selector} { ${fullRule} }`,
          replacements,
          type: 'spacing',
        });
      }
    }

    match = spacingRegex.exec(content);
  }

  return issues;
}

// Apply fixes to a CSS file
function applyFixes(filePath, issues) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Sort issues by line number in descending order to avoid offset issues
  const sortedIssues = issues.sort((a, b) => b.line - a.line);

  sortedIssues.forEach((issue) => {
    if (issue.replacements) {
      // Handle spacing replacements
      const lines = content.split('\n');
      const targetLine = lines[issue.line - 1];
      let newLine = targetLine;
      let lineModified = false;

      console.log(`Processing line ${issue.line}: "${targetLine}"`);

      issue.replacements.forEach((replacement) => {
        console.log(`  Looking for "${replacement.from}" -> "${replacement.to}"`);
        if (newLine.includes(replacement.from)) {
          console.log('    Found! Replacing...');
          newLine = newLine.replace(replacement.from, replacement.to);
          lineModified = true;
        } else {
          console.log('    Not found in line');
        }
      });

      if (lineModified) {
        console.log(`  Final line: "${newLine}"`);
        lines[issue.line - 1] = newLine;
        content = lines.join('\n');
        modified = true;
      }
    } else {
      // Handle color replacements
      const lines = content.split('\n');
      const targetLine = lines[issue.line - 1];

      if (targetLine.includes(issue.value)) {
        const newLine = targetLine.replace(issue.value, issue.suggestion);
        lines[issue.line - 1] = newLine;
        content = lines.join('\n');
        modified = true;
      }
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }

  return false;
}

// Get staged CSS files
function getStagedCSSFiles() {
  try {
    const stagedFiles = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' });
    return stagedFiles
      .split('\n')
      .filter((file) => file.trim() && file.endsWith('.css'))
      .map((file) => path.resolve(file));
  } catch (error) {
    console.error('Error getting staged files:', error.message);
    return [];
  }
}

// Main function
function main() {
  const { colorVars, spacingVars } = getRootVariables();
  const stagedCSSFiles = getStagedCSSFiles();

  if (stagedCSSFiles.length === 0) {
    console.log('✅ No CSS files staged for commit');
    process.exit(0);
  }

  let allIssues = [];

  // Check only staged CSS files
  stagedCSSFiles.forEach((filePath) => {
    const issues = checkFile(filePath, colorVars, spacingVars);
    allIssues = allIssues.concat(issues);
  });

  // Report issues
  if (allIssues.length > 0) {
    console.log('❌ CSS Variable Linting Issues Found in Staged Files:');
    console.log('');

    allIssues.forEach((issue) => {
      console.log(`📁 ${issue.file}:${issue.line}`);
      console.log(`   Found: ${issue.fullRule}`);

      if (issue.replacements) {
        // Multiple replacements for spacing
        console.log('   Replace:');
        issue.replacements.forEach((replacement) => {
          console.log(`     ${replacement.from} → ${replacement.to}`);
        });
      } else {
        // Single replacement for colors
        console.log(`   Use: ${issue.suggestion}`);
      }
      console.log('');
    });

    console.log(`Total issues: ${allIssues.length}`);
    console.log('');
    console.log('💡 Update these hardcoded colors and spacing to use CSS variables from :root');

    if (shouldAutoFix) {
      console.log('🔄 Applying fixes...');
      stagedCSSFiles.forEach((filePath) => {
        const fileIssues = allIssues.filter((issue) => issue.file === filePath);
        applyFixes(filePath, fileIssues);
      });
      console.log('✅ Fixes applied. Please re-stage your files.');
    }

    process.exit(1);
  } else {
    console.log('✅ No CSS variable issues found in staged files!');
    process.exit(0);
  }
}

main();
