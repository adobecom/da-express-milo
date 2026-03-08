/**
 * Slot Validation
 * 
 * Validates that shared components and pages reference only slots exposed by the active layout instance.
 * Provides helpful error messages including layout type and available slot names.
 */

/**
 * Validate that all shared component slots exist in the layout
 * @param {Array} sharedComponents - Array of shared component configs with { slot, type, options }
 * @param {Object} layoutInstance - Mounted layout instance with hasSlot, getSlotNames, type
 * @throws {Error} If any shared component references a non-existent slot
 */
export function validateSharedComponentSlots(sharedComponents, layoutInstance) {
  if (!sharedComponents || sharedComponents.length === 0) {
    return;
  }

  const missingSlots = [];
  const componentsBySlot = {};

  for (const component of sharedComponents) {
    const { slot, type } = component;
    
    if (!layoutInstance.hasSlot(slot)) {
      missingSlots.push(slot);
      componentsBySlot[slot] = type;
    }
  }

  if (missingSlots.length > 0) {
    const availableSlots = layoutInstance.getSlotNames();
    const slotList = missingSlots.map(slot => `"${slot}" (${componentsBySlot[slot]})`).join(', ');
    
    throw new Error(
      `Shared component validation failed: Layout "${layoutInstance.type}" does not expose the following slots: ${slotList}. ` +
      `Available slots: ${availableSlots.map(s => `"${s}"`).join(', ')}`
    );
  }
}

/**
 * Validate that all required page slots exist in the layout
 * @param {Object} pageModule - Page module with requiredSlots array
 * @param {Object} layoutInstance - Mounted layout instance with hasSlot, getSlotNames, type
 * @throws {Error} If any required slot does not exist in the layout
 */
export function validatePageRequiredSlots(pageModule, layoutInstance) {
  const requiredSlots = pageModule.requiredSlots || [];
  
  if (requiredSlots.length === 0) {
    return;
  }

  const missingSlots = [];

  for (const slot of requiredSlots) {
    if (!layoutInstance.hasSlot(slot)) {
      missingSlots.push(slot);
    }
  }

  if (missingSlots.length > 0) {
    const availableSlots = layoutInstance.getSlotNames();
    const slotList = missingSlots.map(s => `"${s}"`).join(', ');
    
    throw new Error(
      `Page slot validation failed: Layout "${layoutInstance.type}" does not expose the following required slots: ${slotList}. ` +
      `Available slots: ${availableSlots.map(s => `"${s}"`).join(', ')}`
    );
  }
}
