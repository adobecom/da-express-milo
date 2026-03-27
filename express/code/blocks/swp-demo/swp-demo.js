/**
 * SWP Demo Block
 *
 * Demonstrates every Express Spectrum 2 wrapper component and best practices
 * from the foundation system in spectrum/.
 *
 * Best-practice highlights shown here:
 *   1. Import from the barrel (spectrum/index.js) for convenience.
 *   2. All create* calls are async — await them.
 *   3. Each component self-loads its Spectrum bundle + CSS on first use.
 *   4. Use destroy() for cleanup when removing components.
 *   5. Accessibility is built-in (focus trap, ARIA, reduced-motion, etc.).
 */

import {
  createExpressPicker,
  createExpressButton,
  createExpressTooltip,
  createExpressDialog,
  showExpressToast,
  createExpressTag,
  createExpressSearch,
  createExpressTextfield,
  createExpressMenu,
} from '../../scripts/color-shared/spectrum/index.js';

// ── Helpers ──────────────────────────────────────────────────────────

function heading(text) {
  const h = document.createElement('h3');
  h.textContent = text;
  h.className = 'swp-demo-heading';
  return h;
}

function description(text) {
  const p = document.createElement('p');
  p.textContent = text;
  p.className = 'swp-demo-desc';
  return p;
}

function section(titleText, desc) {
  const s = document.createElement('section');
  s.className = 'swp-demo-section';
  s.appendChild(heading(titleText));
  if (desc) s.appendChild(description(desc));
  return s;
}

function row(...children) {
  const r = document.createElement('div');
  r.className = 'swp-demo-row';
  children.forEach((c) => r.appendChild(c));
  return r;
}

// ── Block entry point ────────────────────────────────────────────────

export default async function decorate(block) {
  block.innerHTML = '';
  block.classList.add('swp-demo');

  const title = document.createElement('h2');
  title.textContent = 'Spectrum Web Components — Demo';
  title.className = 'swp-demo-title';
  block.appendChild(title);

  const intro = document.createElement('p');
  intro.className = 'swp-demo-intro';
  intro.textContent = 'Each section below demonstrates an Express Spectrum 2 wrapper '
    + 'component. Components are lazy-loaded and opt-in — only the bundles '
    + 'used on this page are fetched.';
  block.appendChild(intro);

  // ── 1. Picker ──────────────────────────────────────────────────────
  const pickerSection = section(
    '1. Picker',
    'Themed <sp-picker> dropdown. Used for filters on Explore, Extract, etc.',
  );

  const picker = await createExpressPicker({
    label: 'Favorite color family',
    value: 'warm',
    options: [
      { value: 'warm', label: 'Warm tones' },
      { value: 'cool', label: 'Cool tones' },
      { value: 'neutral', label: 'Neutral tones' },
      { value: 'vibrant', label: 'Vibrant' },
      { value: 'pastel', label: 'Pastel' },
    ],
    id: 'demo-color-family',
    onChange: ({ value }) => {
      // eslint-disable-next-line no-console
      console.log('[SWP Demo] Picker changed →', value);
    },
  });
  pickerSection.appendChild(picker.element);
  block.appendChild(pickerSection);

  // ── 2. Buttons ─────────────────────────────────────────────────────
  const buttonSection = section(
    '2. Button',
    'Themed <sp-button> with variant mapping (primary, secondary, quiet, danger).',
  );

  const btnPrimary = await createExpressButton({
    label: 'Primary',
    variant: 'primary',
    onClick: () => showExpressToast({ message: 'Primary clicked!', variant: 'info' }),
  });

  const btnSecondary = await createExpressButton({
    label: 'Secondary',
    variant: 'secondary',
    onClick: () => showExpressToast({ message: 'Secondary clicked!', variant: 'positive' }),
  });

  const btnQuiet = await createExpressButton({
    label: 'Quiet',
    variant: 'quiet',
    onClick: () => showExpressToast({ message: 'Quiet clicked!', variant: 'neutral' }),
  });

  const btnDanger = await createExpressButton({
    label: 'Danger',
    variant: 'danger',
    onClick: () => showExpressToast({ message: 'Danger clicked!', variant: 'negative' }),
  });

  const btnDisabled = await createExpressButton({
    label: 'Disabled',
    variant: 'primary',
    disabled: true,
  });

  buttonSection.appendChild(
    row(
      btnPrimary.element,
      btnSecondary.element,
      btnQuiet.element,
      btnDanger.element,
      btnDisabled.element,
    ),
  );
  block.appendChild(buttonSection);

  // ── 3. Tooltip ─────────────────────────────────────────────────────
  const tooltipSection = section(
    '3. Tooltip',
    'Hover or focus the buttons below to see Express tooltips. '
    + 'ARIA aria-describedby is managed automatically.',
  );

  const tipTarget1 = document.createElement('button');
  tipTarget1.className = 'swp-demo-tip-target';
  tipTarget1.textContent = 'Hover me (top)';

  const tipTarget2 = document.createElement('button');
  tipTarget2.className = 'swp-demo-tip-target';
  tipTarget2.textContent = 'Hover me (right)';

  const tipTarget3 = document.createElement('button');
  tipTarget3.className = 'swp-demo-tip-target';
  tipTarget3.textContent = 'Hover me (bottom)';

  tooltipSection.appendChild(row(tipTarget1, tipTarget2, tipTarget3));
  block.appendChild(tooltipSection);

  // Attach tooltips after targets are in the DOM
  await createExpressTooltip({
    targetEl: tipTarget1,
    content: 'This tooltip appears on top',
    placement: 'top',
  });
  await createExpressTooltip({
    targetEl: tipTarget2,
    content: 'This tooltip appears on the right',
    placement: 'right',
  });
  await createExpressTooltip({
    targetEl: tipTarget3,
    content: 'This tooltip appears on the bottom',
    placement: 'bottom',
  });

  // ── 4. Dialog ──────────────────────────────────────────────────────
  const dialogSection = section(
    '4. Dialog',
    'Modal dialog with focus trapping, ESC-to-close, scroll lock, and action events.',
  );

  const dialog = await createExpressDialog({
    title: 'Delete this palette?',
    body: 'This action cannot be undone. The palette "Ocean Breeze" and all '
      + 'associated gradients will be permanently removed.',
    actions: [
      { label: 'Cancel', variant: 'secondary', action: 'cancel' },
      { label: 'Delete', variant: 'danger', action: 'confirm' },
    ],
  });

  dialog.on('confirm', () => {
    showExpressToast({ message: 'Palette deleted (demo)', variant: 'negative', timeout: 3000 });
  });
  dialog.on('cancel', () => {
    showExpressToast({ message: 'Cancelled', variant: 'neutral', timeout: 2000 });
  });

  const openDialogBtn = await createExpressButton({
    label: 'Open Dialog',
    variant: 'primary',
    onClick: () => dialog.open(),
  });

  dialogSection.appendChild(openDialogBtn.element);
  block.appendChild(dialogSection);

  // ── 5. Toast ───────────────────────────────────────────────────────
  const toastSection = section(
    '5. Toast',
    'Imperative notifications with showExpressToast(). Stack up to 3 visible, '
    + 'auto-dismiss, and announce to screen readers via aria-live.',
  );

  const toastPositive = await createExpressButton({
    label: 'Positive Toast',
    variant: 'primary',
    size: 's',
    onClick: () => showExpressToast({ message: 'Color saved successfully!', variant: 'positive' }),
  });

  const toastNegative = await createExpressButton({
    label: 'Negative Toast',
    variant: 'danger',
    size: 's',
    onClick: () => showExpressToast({ message: 'Failed to export palette', variant: 'negative' }),
  });

  const toastInfo = await createExpressButton({
    label: 'Info Toast',
    variant: 'secondary',
    size: 's',
    onClick: () => showExpressToast({ message: '#1473E6 copied to clipboard', variant: 'info' }),
  });

  const toastNeutral = await createExpressButton({
    label: 'Neutral Toast',
    variant: 'quiet',
    size: 's',
    onClick: () => showExpressToast({ message: 'Preference updated', variant: 'neutral', timeout: 2000 }),
  });

  toastSection.appendChild(
    row(
      toastPositive.element,
      toastNegative.element,
      toastInfo.element,
      toastNeutral.element,
    ),
  );
  block.appendChild(toastSection);

  // ── 6. Tags ────────────────────────────────────────────────────────
  const tagSection = section(
    '6. Tag',
    'Selectable and removable tags for filtering workflows. '
    + 'Click to toggle selection; X to remove.',
  );

  const tagOutput = document.createElement('p');
  tagOutput.className = 'swp-demo-tag-output';
  tagOutput.textContent = 'Selected: (none)';

  const selectedTags = new Set();

  function updateTagOutput() {
    tagOutput.textContent = selectedTags.size
      ? `Selected: ${[...selectedTags].join(', ')}`
      : 'Selected: (none)';
  }

  const tagData = [
    { label: 'Warm', value: 'warm' },
    { label: 'Cool', value: 'cool' },
    { label: 'Vibrant', value: 'vibrant' },
    { label: 'Pastel', value: 'pastel' },
    { label: 'Earthy', value: 'earthy' },
    { label: 'Neon', value: 'neon' },
  ];

  const tagRow = document.createElement('div');
  tagRow.className = 'swp-demo-row swp-demo-tag-row';

  for (const t of tagData) {
    // eslint-disable-next-line no-await-in-loop
    const tag = await createExpressTag({
      label: t.label,
      value: t.value,
      selectable: true,
      onToggle: ({ value, selected }) => {
        if (selected) selectedTags.add(value);
        else selectedTags.delete(value);
        updateTagOutput();
      },
    });
    tagRow.appendChild(tag.element);
  }

  const removableTag = await createExpressTag({
    label: 'Removable',
    value: 'removable',
    removable: true,
    onRemove: () => {
      showExpressToast({ message: 'Tag removed', variant: 'info', timeout: 2000 });
    },
  });
  tagRow.appendChild(removableTag.element);

  tagSection.appendChild(tagRow);
  tagSection.appendChild(tagOutput);
  block.appendChild(tagSection);

  // ── 7. Search Field ─────────────────────────────────────────────────
  const searchSection = section(
    '7. Search Field',
    'Themed <sp-search> with clear button, submit handling, and real-time input events.',
  );

  const searchOutput = document.createElement('p');
  searchOutput.className = 'swp-demo-field-output';
  searchOutput.textContent = 'Search value: (empty)';

  const search = await createExpressSearch({
    placeholder: 'Search colors…',
    onInput: ({ value }) => {
      searchOutput.textContent = value
        ? `Search value: "${value}"`
        : 'Search value: (empty)';
    },
    onSubmit: ({ value }) => {
      showExpressToast({ message: `Searching for "${value}"`, variant: 'info', timeout: 2000 });
    },
    onClear: () => {
      searchOutput.textContent = 'Search value: (empty)';
      showExpressToast({ message: 'Search cleared', variant: 'neutral', timeout: 1500 });
    },
  });

  const searchQuiet = await createExpressSearch({
    placeholder: 'Quiet search…',
    quiet: true,
    onInput: ({ value }) => {
      // eslint-disable-next-line no-console
      console.log('[SWP Demo] Quiet search input →', value);
    },
  });

  searchSection.appendChild(row(search.element, searchQuiet.element));
  searchSection.appendChild(searchOutput);
  block.appendChild(searchSection);

  // ── 8. Text Field ───────────────────────────────────────────────────
  const textfieldSection = section(
    '8. Text Field',
    'Themed <sp-textfield> with label, placeholder, validation, and multiline support.',
  );

  const fieldOutput = document.createElement('p');
  fieldOutput.className = 'swp-demo-field-output';
  fieldOutput.textContent = 'Last committed value: (none)';

  const textfield = await createExpressTextfield({
    label: 'Color name',
    placeholder: 'e.g. Ocean Breeze',
    onChange: ({ value }) => {
      fieldOutput.textContent = `Last committed value: "${value}"`;
    },
  });

  const textfieldRequired = await createExpressTextfield({
    label: 'Hex code (required)',
    placeholder: '#1473E6',
    required: true,
    pattern: '^#[0-9A-Fa-f]{6}$',
    size: 's',
  });

  const textfieldQuiet = await createExpressTextfield({
    label: 'Quiet variant',
    placeholder: 'Minimal underline style',
    quiet: true,
  });

  const textfieldMultiline = await createExpressTextfield({
    label: 'Notes (multiline)',
    placeholder: 'Describe this palette…',
    multiline: true,
  });

  const textfieldDisabled = await createExpressTextfield({
    label: 'Disabled',
    value: 'Cannot edit this',
    disabled: true,
  });

  textfieldSection.appendChild(
    row(textfield.element, textfieldRequired.element, textfieldQuiet.element),
  );
  textfieldSection.appendChild(row(textfieldMultiline.element, textfieldDisabled.element));
  textfieldSection.appendChild(fieldOutput);
  block.appendChild(textfieldSection);

  // ── 9. Menu ─────────────────────────────────────────────────────────
  const menuSection = section(
    '9. Menu',
    'Standalone <sp-menu> with single selection, dividers, and disabled items. '
    + 'Use for action lists and settings panels.',
  );

  const menuOutput = document.createElement('p');
  menuOutput.className = 'swp-demo-field-output';
  menuOutput.textContent = 'Selected action: (none)';

  const menu = await createExpressMenu({
    label: 'Color actions',
    selects: 'single',
    items: [
      { value: 'copy-hex', label: 'Copy HEX value' },
      { value: 'copy-rgb', label: 'Copy RGB value' },
      { value: 'copy-hsl', label: 'Copy HSL value' },
      { divider: true },
      { value: 'export-png', label: 'Export as PNG' },
      { value: 'export-svg', label: 'Export as SVG' },
      { divider: true },
      { value: 'delete', label: 'Delete palette', disabled: true },
    ],
    onSelect: ({ value }) => {
      menuOutput.textContent = `Selected action: "${value}"`;
      showExpressToast({ message: `Action: ${value}`, variant: 'info', timeout: 2000 });
    },
  });

  menuSection.appendChild(menu.element);
  menuSection.appendChild(menuOutput);
  block.appendChild(menuSection);
}
