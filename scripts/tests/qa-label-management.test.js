/* eslint-disable no-console */

/**
 * Unit Tests for QA Label Management Workflow
 *
 * This file contains unit tests for the GitHub Actions
 * label management workflow logic using ES modules.
 */

// Mock functions for testing the label management logic
const labelManagementLogic = {
  // Determine target labels based on PR state
  determineTargetLabels: (currentLabels, isDraft, isTestMode, approvalCount) => {
    // Start fresh - only keep non-Ready labels
    const targetLabels = currentLabels.filter((label) => !['Ready for Review', 'Ready for review', 'Ready for QA', 'Ready for qa'].includes(label));

    // Add the correct Ready label based on state
    if (isDraft) {
      // Draft PRs should have no Ready labels
      return targetLabels;
    } if (isTestMode || approvalCount >= 2) {
      // Ready for QA - 2+ approvals and no request changes
      targetLabels.push('Ready for QA');
      return targetLabels;
    }
    // Ready for Review - default for non-draft PRs
    targetLabels.push('Ready for Review');
    return targetLabels;
  },

  // Check if labels have changed
  haveLabelsChanged: (currentLabels, targetLabels) => {
    const currentReadyLabels = currentLabels.filter((label) => label.includes('Ready for'));
    const targetReadyLabels = targetLabels.filter((label) => label.includes('Ready for'));

    return currentReadyLabels.length !== targetReadyLabels.length
           || !currentReadyLabels.every((label) => targetReadyLabels.includes(label));
  },

  // Count approvals from reviews
  countApprovals: (reviews) => {
    let approvalCount = 0;
    for (const review of reviews) {
      if (review.state === 'APPROVED') {
        approvalCount += 1;
      } else if (review.state === 'CHANGES_REQUESTED') {
        // Request changes blocks QA
        return 0;
      }
    }
    return approvalCount;
  },

  // Validate label names
  isValidLabel: (label) => label.length <= 50
           && /^[a-zA-Z0-9\-_\s]+$/.test(label)
           && !label.startsWith('-')
           && !label.endsWith('-'),
};

// Simple test runner
const runTests = () => {
  let passed = 0;
  let failed = 0;

  const test = (name, fn) => {
    try {
      fn();
      console.log(`✅ ${name}`);
      passed += 1;
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
      failed += 1;
    }
  };

  const expect = (actual) => ({
    toEqual: (expected) => {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    },
    toBe: (expected) => {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, got ${actual}`);
      }
    },
  });

  console.log('🧪 Running QA Label Management Tests');
  console.log('='.repeat(40));

  // Test determineTargetLabels
  test('should add "Ready for Review" for non-draft PRs with no approvals', () => {
    const currentLabels = ['bug', 'enhancement'];
    const result = labelManagementLogic.determineTargetLabels(
      currentLabels,
      false, // not draft
      false, // not test mode
      0, // no approvals
    );

    expect(result).toEqual(['bug', 'enhancement', 'Ready for Review']);
  });

  test('should add "Ready for QA" for PRs with 2+ approvals', () => {
    const currentLabels = ['bug', 'enhancement'];
    const result = labelManagementLogic.determineTargetLabels(
      currentLabels,
      false, // not draft
      false, // not test mode
      2, // 2 approvals
    );

    expect(result).toEqual(['bug', 'enhancement', 'Ready for QA']);
  });

  test('should add "Ready for QA" for test mode PRs', () => {
    const currentLabels = ['bug', 'test-qa-workflow'];
    const result = labelManagementLogic.determineTargetLabels(
      currentLabels,
      false, // not draft
      true, // test mode
      0, // no approvals
    );

    expect(result).toEqual(['bug', 'test-qa-workflow', 'Ready for QA']);
  });

  test('should not add Ready labels for draft PRs', () => {
    const currentLabels = ['bug', 'enhancement'];
    const result = labelManagementLogic.determineTargetLabels(
      currentLabels,
      true, // is draft
      false, // not test mode
      2, // 2 approvals
    );

    expect(result).toEqual(['bug', 'enhancement']);
  });

  // Test haveLabelsChanged
  test('should detect when Ready labels have changed', () => {
    const currentLabels = ['bug', 'Ready for Review'];
    const targetLabels = ['bug', 'Ready for QA'];

    expect(labelManagementLogic.haveLabelsChanged(currentLabels, targetLabels)).toBe(true);
  });

  test('should not detect changes when Ready labels are the same', () => {
    const currentLabels = ['bug', 'Ready for Review'];
    const targetLabels = ['bug', 'Ready for Review'];

    expect(labelManagementLogic.haveLabelsChanged(currentLabels, targetLabels)).toBe(false);
  });

  // Test countApprovals
  test('should count approved reviews', () => {
    const reviews = [
      { state: 'APPROVED' },
      { state: 'APPROVED' },
      { state: 'COMMENTED' },
    ];

    expect(labelManagementLogic.countApprovals(reviews)).toBe(2);
  });

  test('should return 0 when changes are requested', () => {
    const reviews = [
      { state: 'APPROVED' },
      { state: 'CHANGES_REQUESTED' },
      { state: 'APPROVED' },
    ];

    expect(labelManagementLogic.countApprovals(reviews)).toBe(0);
  });

  // Test isValidLabel
  test('should validate correct label names', () => {
    expect(labelManagementLogic.isValidLabel('bug')).toBe(true);
    expect(labelManagementLogic.isValidLabel('Ready for Review')).toBe(true);
    expect(labelManagementLogic.isValidLabel('test-qa-workflow')).toBe(true);
  });

  test('should reject invalid label names', () => {
    expect(labelManagementLogic.isValidLabel('')).toBe(false);
    expect(labelManagementLogic.isValidLabel('-invalid')).toBe(false);
    expect(labelManagementLogic.isValidLabel('invalid-')).toBe(false);
  });

  // Summary
  console.log('\n📊 Test Results');
  console.log('='.repeat(20));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Total: ${passed + failed}`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed!');
    return true;
  }
  console.log('\n❌ Some tests failed.');
  return false;
};

// Run tests if this file is executed directly
if (process.argv[1] && process.argv[1].endsWith('qa-label-management.test.js')) {
  const success = runTests();
  process.exit(success ? 0 : 1);
}

export { labelManagementLogic, runTests };
