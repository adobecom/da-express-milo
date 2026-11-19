const { randomUUID } = require('crypto');
const { writeFile } = require('fs/promises');
const { test } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { AccessibilityError } = require('./customerrors.cjs');

/**
 * Run automated axe checks; a passing scan does not establish WCAG conformance.
 * @param {Object} page - The page object.
 * @param {string|import('@playwright/test').Locator} [testScope='body'] - CSS selector or single-element locator.
 * @param {string[]} [includeTags=['wcag2a', 'wcag2aa']] - Optional tags to include in the accessibility test. Default is WCAG 2.0/2.1 A & AA.
 * @param {number} [maxViolations=0] - Optional maximum number of allowed violations before the test fails. Default is 0 (any violation fails the test).
 * @param {boolean} [skipA11yTest=false] - If true, the test step is logged and skipped.
 */
async function runAccessibilityTest({
  page,
  testScope = 'body',
  includeTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
  maxViolations = 0,
  skipA11yTest = false,
} = {}) {
  if (skipA11yTest) {
    console.log(
      `[Skipping]: Accessibility test step skipped for this component ${testScope}`,
    );
    return undefined;
  }

  let testName;
  let markedScope;
  let previousScope;
  try {
    // Retrive the test title (name)
    testName = test.info().title.includes(',')
      ? test.info().title.split(',')[0]
      : test.info().title;

    let scopeDescription = 'entire page';
    let testElement = testScope;

    let violationsDetails = '';

    // Handle a case where testScope is a string or locator from POM
    if (typeof testScope === 'string') {
      if (testScope === 'body') {
        testElement = 'body';
      } else {
        scopeDescription = `section: ${testScope}`;
      }
    } else if (testScope && typeof testScope.evaluate === 'function') {
      // Axe accepts selectors, not ElementHandles. Mark the exact locator match,
      // including nth()/filtered locators, without widening the scan.
      const scopeId = randomUUID();
      testElement = `[data-nala-a11y-scope="${scopeId}"]`;
      previousScope = await testScope.evaluate((element, selector) => {
        const previous = element.getAttribute('data-nala-a11y-scope');
        element.setAttribute('data-nala-a11y-scope', selector);
        return previous;
      }, scopeId);
      markedScope = testScope;
      scopeDescription = `the provided locator: ${testScope}`;
    } else {
      throw new AccessibilityError('testScope must be a CSS selector or a single-element locator');
    }

    console.log('Scope description:', scopeDescription);
    // Run the Axe accessibility test on the given scope and tags
    const axe = await new AxeBuilder({ page })
      .withTags(includeTags)
      .include(testElement)
      .exclude('.dynamic-nav-status')
      .exclude('.feds-navLink--hoverCaret.feds-localnav-title')
      .analyze();

    const enhancedAxeResults = {
      testName,
      testScope:
        testScope === 'body' ? 'Entire Page' : `Specific Section: ${testScope}`,
      ...axe,
    };

    const violationCount = enhancedAxeResults.violations.length;

    const reportPath = test.info().outputPath(`accessibility-${randomUUID()}.json`);
    await writeFile(reportPath, JSON.stringify(enhancedAxeResults, null, 2));
    await test.info().attach('Accessibility Test Results', {
      path: reportPath,
      contentType: 'application/json',
    });

    if (violationCount > maxViolations) {
      // Accessibility violations details
      violationsDetails += '\n========== Accessibility Test ==========\n';
      violationsDetails += `[Test Name    ]: ${testName}\n`;
      violationsDetails += `[Test Page URL]: ${page.url()}\n`;
      violationsDetails += `[Accessibility]: Running accessibility test on ${scopeDescription}\n`;

      enhancedAxeResults.violations.forEach((violation, index) => {
        violationsDetails += `[Result       ]: Accessibility test found ${violationCount} accessibility violation(s) for ${testName}\n`;
        violationsDetails += '[Violation Details]:\n';
        violationsDetails += `\n${index + 1}. Violation: ${
          violation.description
        }\n`;
        violationsDetails += `   - Axe Rule ID: ${violation.id}\n`;
        violationsDetails += `   - Severity: ${violation.impact}\n`;

        const wcagTags = Array.isArray(violation.tags)
          ? violation.tags.join(', ')
          : 'N/A';
        violationsDetails += `   - WCAG Tags: ${wcagTags}\n`;
        violationsDetails += '   - Nodes affected:\n';

        violation.nodes.forEach((node, nodeIndex) => {
          violationsDetails += `     ${nodeIndex + 1}. ${node.html}\n`;
        });
        violationsDetails += `   - Fix: ${violation.helpUrl}\n`;
      });

      throw new AccessibilityError(
        `\nAccessibility test failed : ${violationCount} violation(s) found. \n ${violationsDetails}`,
      );
    } else if (violationCount > 0) {
      console.info(
        `[Accessibility Test]: Found ${violationCount} violation(s) for ${testName}, but under the threshold of ${maxViolations}.`,
      );
    } else {
      console.info(
        `[Accessibility Test]: No accessibility violations found for ${testName}.`,
      );
    }
    return enhancedAxeResults;
  } catch (err) {
    throw new AccessibilityError(
      `[Accessibility Test failed for ${testName}].\n ${err.message}`,
    );
  } finally {
    if (markedScope) {
      await markedScope.evaluate((element, previous) => {
        if (previous === null) element.removeAttribute('data-nala-a11y-scope');
        else element.setAttribute('data-nala-a11y-scope', previous);
      }, previousScope);
    }
  }
}

module.exports = { runAccessibilityTest };
