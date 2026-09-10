/**
 * Group items by numeric closeness (descending), so a comparison run where
 * e.g. 190 pages all show the same ~0.7% diff (one shared change rippling
 * across every page that uses a block) reports as one group instead of 190
 * near-duplicate lines.
 *
 * A group's span is measured from its first (largest) member — every member
 * must be within `tolerance` of the group's max, not just of its neighbor —
 * so a long run of slowly-drifting values can't chain into one enormous
 * group. Pure function: takes any array + a value getter, returns groups
 * sorted by descending value with the original items intact.
 */
export function groupBySimilarity(items, getValue, tolerance = 0.05) {
  const sorted = [...items].sort((a, b) => getValue(b) - getValue(a));
  const groups = [];
  for (const item of sorted) {
    const value = getValue(item);
    const current = groups[groups.length - 1];
    if (current && current.maxValue - value <= tolerance) {
      current.items.push(item);
      current.minValue = value;
    } else {
      groups.push({ maxValue: value, minValue: value, items: [item] });
    }
  }
  return groups;
}
