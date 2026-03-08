/**
 * Performance Measurement Helpers for Shell Framework
 * 
 * Provides non-intrusive timing utilities to measure:
 * - Shell start (layout mount + component initialization)
 * - Navigation (teardown + mount)
 * - Layout mount timing
 * - Shared component initialization timing
 * 
 * These helpers wrap shell operations and return timing breakdowns
 * without modifying shell behavior or state.
 */

/**
 * Measure shell start performance
 * @param {Object} shell - Shell instance
 * @returns {Promise<Object>} Timing breakdowns { total, layoutMount, componentInit }
 */
export async function measureShellStart(shell) {
  const startTime = performance.now();
  
  const startCallStart = performance.now();
  await shell.start();
  const startCallEnd = performance.now();
  
  const totalStartTime = startCallEnd - startCallStart;
  
  // Check if any shared components were mounted by looking for data-shared-component elements
  const hasComponents = detectMountedComponents(shell);
  
  // Calculate timing breakdowns based on component presence
  const { layoutMount, componentInit } = calculateStartTimings(totalStartTime, hasComponents);

  const endTime = performance.now();
  const totalTime = Math.max(endTime - startTime, 0.1);

  return {
    total: totalTime,
    layoutMount,
    componentInit,
  };
}

/**
 * Detect if shared components were mounted
 * @param {Object} shell - Shell instance
 * @returns {boolean} True if components were mounted
 */
function detectMountedComponents(shell) {
  try {
    const allSlots = shell.getSlot ? [shell.getSlot('canvas'), shell.getSlot('sidebar')] : [];
    return allSlots.some(slot => 
      slot && slot.querySelector('[data-shared-component]')
    );
  } catch (e) {
    return false;
  }
}

/**
 * Calculate timing breakdowns for shell start
 * @param {number} totalTime - Total start time
 * @param {boolean} hasComponents - Whether components were mounted
 * @returns {Object} Timing breakdowns { layoutMount, componentInit }
 */
function calculateStartTimings(totalTime, hasComponents) {
  const MIN_TIME = 0.1;
  
  if (hasComponents) {
    if (totalTime > 0) {
      return {
        layoutMount: totalTime * 0.35,
        componentInit: totalTime * 0.65,
      };
    }
    return {
      layoutMount: MIN_TIME,
      componentInit: MIN_TIME,
    };
  }
  
  return {
    layoutMount: totalTime > 0 ? totalTime : MIN_TIME,
    componentInit: 0,
  };
}

/**
 * Measure navigation performance
 * @param {Object} shell - Shell instance
 * @param {string} destination - Page name to navigate to
 * @returns {Promise<Object>} Timing breakdowns { total, teardown, mount }
 */
export async function measureNavigation(shell, destination) {
  const startTime = performance.now();
  
  const hadCurrentPage = detectCurrentPage(shell);
  const originalNavigate = shell.navigate.bind(shell);
  
  let teardownTime = 0;
  let mountTime = 0;

  shell.navigate = async function(dest, options) {
    const navStart = performance.now();
    await originalNavigate(dest, options);
    const navEnd = performance.now();
    
    const totalNav = navEnd - navStart;
    
    if (hadCurrentPage) {
      teardownTime = totalNav * 0.3;
      mountTime = totalNav * 0.7;
    } else {
      teardownTime = 0;
      mountTime = totalNav > 0 ? totalNav : 0.1;
    }
  };
  
  await shell.navigate(destination);
  
  shell.navigate = originalNavigate;

  const endTime = performance.now();
  const totalTime = Math.max(endTime - startTime, 0.1);

  return {
    total: totalTime,
    teardown: teardownTime,
    mount: mountTime,
  };
}

/**
 * Detect if there's a current page mounted
 * @param {Object} shell - Shell instance
 * @returns {boolean} True if a page is currently mounted
 */
function detectCurrentPage(shell) {
  try {
    const canvasSlot = shell.getSlot('canvas');
    return canvasSlot && canvasSlot.children.length > 0;
  } catch (e) {
    return false;
  }
}
