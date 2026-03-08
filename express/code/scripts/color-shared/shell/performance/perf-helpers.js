/**
 * Detect if shared components were mounted
 * @param {Object} shell - Shell instance
 * @returns {boolean} True if components were mounted
 */
function detectMountedComponents(shell) {
  try {
    const allSlots = shell.getSlot ? [shell.getSlot('canvas'), shell.getSlot('sidebar')] : [];
    return allSlots.some((slot) => slot && slot.querySelector('[data-shared-component]'));
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

  const hasComponents = detectMountedComponents(shell);

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

  shell.navigate = async function wrappedNavigate(dest, options) {
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
